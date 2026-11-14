import { fetchNotionPageBlocks } from '@/lib/db/notion/getPostBlocks'
import {
  getLeaderboardBoard,
  getLeaderboardRawRows
} from '@/lib/db/leaderboard/getLeaderboardRows'

jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  fetchNotionPageBlocks: jest.fn()
}))

// notion-utils 为 ESM 包，jest 无法直接加载；这里只模拟读取层用到的三个函数
jest.mock('notion-utils', () => ({
  getTextContent: value => (value || []).map(segment => segment?.[0] ?? '').join(''),
  getDateValue: value => {
    const start = value?.[0]?.[1]?.[0]?.[1]?.start_date
    return start ? { start_date: start } : null
  },
  parsePageId: url => {
    const match = /([0-9a-f]{32})$/i.exec(url || '')
    if (!match) return null
    const hex = match[1]
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
}))

const PAGE_ID = '01234567-89ab-cdef-0123-456789abcdef'
const TABLE_URL = 'https://www.notion.so/Leaderboard-0123456789abcdef0123456789abcdef'
const COLLECTION_ID = 'coll-1'
const VIEW_ID = 'view-1'

const schema = {
  t1: { name: 'Name', type: 'title' },
  t2: { name: 'Rank', type: 'number' },
  t3: { name: 'Active', type: 'checkbox' },
  t4: { name: 'Synced At', type: 'date' }
}

const rowBlock = (name, rank, active) => ({
  value: {
    type: 'page',
    properties: {
      t1: [[name]],
      t2: [[rank]],
      t3: active ? [['Yes']] : [],
      t4: [['‣', [['d', { type: 'date', start_date: '2026-11-10' }]]]]
    }
  }
})

const buildRecordMap = ({ viewBlockIsPage }) => {
  const viewBlock = {
    type: 'collection_view_page',
    collection_id: COLLECTION_ID,
    view_ids: [VIEW_ID]
  }
  const pageBlock = viewBlockIsPage
    ? { value: viewBlock }
    : { value: { type: 'page', content: ['cv-1'] } }
  const block = {
    [PAGE_ID]: pageBlock,
    'row-1': rowBlock('Model A', '1', true),
    'row-2': rowBlock('Model B', '2', false)
  }
  if (!viewBlockIsPage) {
    block['cv-1'] = { value: { type: 'collection_view', collection_id: COLLECTION_ID, view_ids: [VIEW_ID] } }
  }
  return {
    block,
    collection: { [COLLECTION_ID]: { value: { schema } } },
    collection_query: {
      [COLLECTION_ID]: {
        [VIEW_ID]: { collection_group_results: { blockIds: ['row-1', 'row-2'] } }
      }
    }
  }
}

describe('getLeaderboardRawRows', () => {
  beforeEach(() => {
    fetchNotionPageBlocks.mockReset()
  })

  it('reads rows when the link points to the database page itself', async () => {
    fetchNotionPageBlocks.mockResolvedValue(buildRecordMap({ viewBlockIsPage: true }))

    const rows = await getLeaderboardRawRows(TABLE_URL)

    expect(fetchNotionPageBlocks).toHaveBeenCalledWith(PAGE_ID, 'leaderboard', { cacheTtl: 3600 })
    expect(rows).toEqual([
      { id: 'row-1', Name: 'Model A', Rank: '1', Active: 'Yes', 'Synced At': '2026-11-10' },
      { id: 'row-2', Name: 'Model B', Rank: '2', Active: '', 'Synced At': '2026-11-10' }
    ])
  })

  it('finds the database inside a page that links to it', async () => {
    fetchNotionPageBlocks.mockResolvedValue(buildRecordMap({ viewBlockIsPage: false }))

    const rows = await getLeaderboardRawRows(TABLE_URL)

    expect(rows.map(row => row.Name)).toEqual(['Model A', 'Model B'])
  })

  it('returns null when the URL has no page id', async () => {
    expect(await getLeaderboardRawRows('')).toBeNull()
    expect(fetchNotionPageBlocks).not.toHaveBeenCalled()
  })

  it('returns null when the page cannot be loaded or has no database', async () => {
    fetchNotionPageBlocks.mockResolvedValueOnce(null)
    expect(await getLeaderboardRawRows(TABLE_URL)).toBeNull()

    fetchNotionPageBlocks.mockResolvedValueOnce({
      block: { [PAGE_ID]: { value: { type: 'page', content: [] } } }
    })
    expect(await getLeaderboardRawRows(TABLE_URL)).toBeNull()
  })
})

describe('getLeaderboardBoard', () => {
  beforeEach(() => {
    fetchNotionPageBlocks.mockReset()
  })

  it('returns an unavailable board when no table URL is configured', async () => {
    const board = await getLeaderboardBoard('')
    expect(board).toMatchObject({ status: 'unavailable', rows: [], syncedAt: null })
    expect(fetchNotionPageBlocks).not.toHaveBeenCalled()
  })

  it('keeps only active rows in the board', async () => {
    fetchNotionPageBlocks.mockResolvedValue(buildRecordMap({ viewBlockIsPage: true }))

    const board = await getLeaderboardBoard(TABLE_URL)

    expect(board.rows.map(row => row.name)).toEqual(['Model A'])
    expect(board.status).toBe('ok')
  })
})
