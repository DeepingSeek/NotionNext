import {
  buildBoardQuery,
  buildLeaderboard,
  filterLeaderboardRows,
  formatMetric,
  formatSyncedAt,
  getVendorOptions,
  normalizeLeaderboardRow,
  parseBoardQuery,
  parseNullableNumber,
  sortLeaderboardRows,
  STALE_AFTER_MS
} from '@/lib/db/leaderboard/mapping'

const NOW = Date.parse('2026-11-10T12:00:00Z')
const SYNCED = '2026-11-10T11:00:00Z'

const raw = (overrides = {}) => ({
  id: `id-${overrides.Rank ?? 'x'}`,
  Name: 'Model',
  Rank: '1',
  Creator: 'Vendor',
  'Intelligence Index': '50',
  'Input Price': '1.5',
  'Output Price': '6',
  'Median Output TPS': '100',
  'Median TTFT (s)': '0.5',
  'AA Model ID': 'aa-1',
  'Index Version': '4',
  Active: 'Yes',
  'Synced At': SYNCED,
  ...overrides
})

describe('parseNullableNumber', () => {
  it('keeps empty values as null instead of 0', () => {
    expect(parseNullableNumber(null)).toBeNull()
    expect(parseNullableNumber(undefined)).toBeNull()
    expect(parseNullableNumber('')).toBeNull()
    expect(parseNullableNumber('   ')).toBeNull()
  })

  it('parses numeric text and keeps real zero', () => {
    expect(parseNullableNumber('0')).toBe(0)
    expect(parseNullableNumber('12.5')).toBe(12.5)
    expect(parseNullableNumber(3)).toBe(3)
  })

  it('returns null for non-numeric text', () => {
    expect(parseNullableNumber('abc')).toBeNull()
    expect(parseNullableNumber(Number.NaN)).toBeNull()
  })
})

describe('normalizeLeaderboardRow', () => {
  it('maps a complete row', () => {
    const row = normalizeLeaderboardRow(raw({ Rank: '3', Creator: ' Acme ' }))
    expect(row).toMatchObject({
      id: 'id-3',
      modelId: 'aa-1',
      name: 'Model',
      rank: 3,
      creator: 'Acme',
      intelligence: 50,
      inputPrice: 1.5,
      outputPrice: 6,
      outputTps: 100,
      ttft: 0.5,
      indexVersion: 4,
      syncedAt: '2026-11-10T11:00:00.000Z'
    })
  })

  it('keeps missing metrics as null and tolerates missing columns', () => {
    const row = normalizeLeaderboardRow({
      id: 'r1',
      Name: 'Only Name',
      Rank: '2'
    })
    expect(row).toMatchObject({
      name: 'Only Name',
      rank: 2,
      creator: '',
      intelligence: null,
      inputPrice: null,
      outputPrice: null,
      outputTps: null,
      ttft: null,
      indexVersion: null,
      syncedAt: null
    })
  })

  it('rejects rows without name or with invalid rank', () => {
    expect(normalizeLeaderboardRow(raw({ Name: '   ' }))).toBeNull()
    expect(normalizeLeaderboardRow(raw({ Rank: '' }))).toBeNull()
    expect(normalizeLeaderboardRow(raw({ Rank: '0' }))).toBeNull()
    expect(normalizeLeaderboardRow(raw({ Rank: '1.5' }))).toBeNull()
    expect(normalizeLeaderboardRow({})).toBeNull()
  })
})

describe('buildLeaderboard', () => {
  it('keeps only Active rows and sorts them by Rank', () => {
    const board = buildLeaderboard(
      [
        raw({ id: 'c', Name: 'C', Rank: '3' }),
        raw({ id: 'a', Name: 'A', Rank: '1' }),
        raw({ id: 'x', Name: 'Inactive', Rank: '2', Active: '' }),
        raw({ id: 'b', Name: 'B', Rank: '2' })
      ],
      { now: NOW }
    )
    expect(board.rows.map(row => row.name)).toEqual(['A', 'B', 'C'])
    expect(board.status).toBe('ok')
    expect(board.rankIssue).toBe(false)
  })

  it('flags gaps and duplicate ranks as an anomaly', () => {
    const gap = buildLeaderboard([raw({ Name: 'A', Rank: '1' }), raw({ Name: 'B', Rank: '3' })], { now: NOW })
    expect(gap.rankIssue).toBe(true)

    const duplicate = buildLeaderboard([raw({ Name: 'A', Rank: '1' }), raw({ Name: 'B', Rank: '1' })], { now: NOW })
    expect(duplicate.rankIssue).toBe(true)
  })

  it('counts invalid active rows and flags them', () => {
    const board = buildLeaderboard([raw({ Name: 'A', Rank: '1' }), raw({ Name: '', Rank: '2' })], { now: NOW })
    expect(board.invalidRows).toBe(1)
    expect(board.rankIssue).toBe(true)
  })

  it('returns empty status when no active rows exist', () => {
    const board = buildLeaderboard([raw({ Active: '' })], { now: NOW })
    expect(board).toMatchObject({ status: 'empty', rows: [], syncedAt: null })
  })

  it('uses the latest Synced At and the first available Index Version', () => {
    const board = buildLeaderboard(
      [
        raw({ Name: 'A', Rank: '1', 'Synced At': '2026-11-10T09:00:00Z', 'Index Version': '' }),
        raw({ Name: 'B', Rank: '2', 'Synced At': '2026-11-10T11:30:00Z', 'Index Version': '5' })
      ],
      { now: NOW }
    )
    expect(board.syncedAt).toBe('2026-11-10T11:30:00.000Z')
    expect(board.indexVersion).toBe(5)
  })

  it('marks data stale only after 36 hours', () => {
    const fresh = buildLeaderboard([raw({ 'Synced At': SYNCED })], { now: NOW })
    expect(fresh.stale).toBe(false)

    const old = new Date(Date.parse(SYNCED) + STALE_AFTER_MS + 1000).toISOString()
    const later = buildLeaderboard([raw({ 'Synced At': SYNCED })], { now: Date.parse(old) })
    expect(later.stale).toBe(true)
  })
})

describe('sortLeaderboardRows', () => {
  const rows = [
    { id: 'a', name: 'A', rank: 1, intelligence: 50, inputPrice: 2, outputTps: 80, ttft: 0.8 },
    { id: 'b', name: 'B', rank: 2, intelligence: null, inputPrice: 0.5, outputTps: null, ttft: 0.2 },
    { id: 'c', name: 'C', rank: 3, intelligence: 60, inputPrice: null, outputTps: 120, ttft: null },
    { id: 'd', name: 'D', rank: 4, intelligence: 60, inputPrice: 0.5, outputTps: 120, ttft: 0.2 }
  ]

  it('sorts intelligence descending with nulls last and ties by rank', () => {
    expect(sortLeaderboardRows(rows, 'intelligence').map(r => r.id)).toEqual(['c', 'd', 'a', 'b'])
  })

  it('sorts price ascending with nulls last', () => {
    expect(sortLeaderboardRows(rows, 'price').map(r => r.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('sorts speed descending and ttft ascending', () => {
    expect(sortLeaderboardRows(rows, 'speed').map(r => r.id)).toEqual(['c', 'd', 'a', 'b'])
    expect(sortLeaderboardRows(rows, 'ttft').map(r => r.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('does not mutate the input array', () => {
    const copy = [...rows]
    sortLeaderboardRows(rows, 'price')
    expect(rows).toEqual(copy)
  })
})

describe('filterLeaderboardRows and getVendorOptions', () => {
  const rows = [
    { id: '1', name: 'GPT Alpha', creator: 'OpenCo' },
    { id: '2', name: 'Beta Pro', creator: 'Acme' },
    { id: '3', name: 'Gamma', creator: '' }
  ]

  it('matches name or vendor case-insensitively', () => {
    expect(filterLeaderboardRows(rows, { query: 'gpt' }).map(r => r.id)).toEqual(['1'])
    expect(filterLeaderboardRows(rows, { query: 'ACME' }).map(r => r.id)).toEqual(['2'])
  })

  it('filters by exact vendor and combines with query', () => {
    expect(filterLeaderboardRows(rows, { vendor: 'Acme' }).map(r => r.id)).toEqual(['2'])
    expect(filterLeaderboardRows(rows, { vendor: 'Acme', query: 'gpt' })).toEqual([])
  })

  it('builds unique sorted vendor options without empty values', () => {
    expect(getVendorOptions([...rows, { creator: 'Acme' }])).toEqual(['Acme', 'OpenCo'])
  })
})

describe('board query helpers', () => {
  it('falls back to defaults for invalid query values', () => {
    expect(parseBoardQuery({ sort: 'unknown', q: ['x'], vendor: 3 })).toEqual({
      sort: 'intelligence',
      query: '',
      vendor: ''
    })
    expect(parseBoardQuery({ sort: 'price', q: 'gpt', vendor: 'Acme' })).toEqual({
      sort: 'price',
      query: 'gpt',
      vendor: 'Acme'
    })
  })

  it('omits default values and keeps unrelated params such as theme', () => {
    const query = buildBoardQuery(
      { theme: 'simple', sort: 'speed' },
      { sort: 'intelligence', query: '', vendor: '' }
    )
    expect(query).toEqual({ theme: 'simple' })
  })

  it('writes non-default state back to the query', () => {
    const query = buildBoardQuery({}, { sort: 'ttft', query: ' gpt ', vendor: 'Acme' })
    expect(query).toEqual({ sort: 'ttft', q: ' gpt ', vendor: 'Acme' })
  })
})

describe('formatting helpers', () => {
  it('formats numbers with fixed digits and returns null for empty values', () => {
    expect(formatMetric(12.5, 2)).toBe('12.50')
    expect(formatMetric(0, 1)).toBe('0.0')
    expect(formatMetric(null, 1)).toBeNull()
  })

  it('formats synced time in Beijing time', () => {
    expect(formatSyncedAt(null)).toBeNull()
    expect(formatSyncedAt('2026-11-10T12:00:00.000Z')).toMatch(/2026\/11\/10 20:00/)
  })
})
