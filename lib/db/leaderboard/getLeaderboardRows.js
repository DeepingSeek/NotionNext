import { getDateValue, getTextContent, parsePageId } from 'notion-utils'
import getAllPageIds from '../notion/getAllPageIds'
import { fetchNotionPageBlocks } from '../notion/getPostBlocks'
import {
  normalizeCollection,
  normalizePageBlock,
  normalizeSchema
} from '../notion/normalizeUtil'
import { buildLeaderboard } from './mapping'

const COLLECTION_TYPES = ['collection_view_page', 'collection_view']
// 榜单原始数据的缓存时长（秒），否则本地文件缓存永不过期，同步后页面不更新
const RAW_ROWS_CACHE_TTL_SECOND = 3600

/**
 * 找到榜单数据库所在的 collection_view 块：链接可以指向数据库页面本身，也可以指向包含数据库的页面
 */
function findCollectionViewBlockId(recordMap, pageId) {
  const isCollection = id =>
    COLLECTION_TYPES.includes(normalizePageBlock(recordMap.block?.[id])?.type)

  if (isCollection(pageId)) return pageId
  const content = normalizePageBlock(recordMap.block?.[pageId])?.content || []
  return content.find(isCollection) || null
}

/**
 * 读取榜单库的原始行：属性名 -> 文本（日期取起始值）。不做业务判断。
 * @param {string} tableUrl 榜单库的 Notion 链接
 * @returns {Promise<Array<Object>|null>} 未配置或找不到数据库时返回 null
 */
export async function getLeaderboardRawRows(tableUrl) {
  const pageId = parsePageId(tableUrl)
  if (!pageId) return null

  const recordMap = await fetchNotionPageBlocks(pageId, 'leaderboard', {
    cacheTtl: RAW_ROWS_CACHE_TTL_SECOND
  })
  if (!recordMap) return null

  const viewBlockId = findCollectionViewBlockId(recordMap, pageId)
  if (!viewBlockId) {
    console.warn('[leaderboard] 链接中未找到数据库:', pageId)
    return null
  }

  const viewBlock = normalizePageBlock(recordMap.block[viewBlockId])
  const collectionId = viewBlock?.collection_id
  if (!collectionId) return null

  const collection = normalizeCollection(recordMap.collection?.[collectionId])
  const schema = normalizeSchema(collection?.schema || {})
  const rowIds = getAllPageIds(
    recordMap.collection_query,
    collectionId,
    recordMap.collection_view,
    viewBlock.view_ids
  )

  const rows = []
  for (const id of rowIds) {
    const row = normalizePageBlock(recordMap.block?.[id])
    if (!row?.properties) continue

    const props = { id }
    for (const [key, val] of Object.entries(row.properties)) {
      const field = schema[key]
      if (!field?.name) continue
      props[field.name] =
        field.type === 'date'
          ? getDateValue(val)?.start_date ?? null
          : getTextContent(val)
    }
    rows.push(props)
  }

  return rows
}

/**
 * 占位状态：未配置、读取失败或找不到数据库时使用
 */
export function createUnavailableBoard() {
  return {
    status: 'unavailable',
    rows: [],
    syncedAt: null,
    indexVersion: null,
    stale: false,
    rankIssue: false,
    invalidRows: 0
  }
}

/**
 * 读取并校验榜单数据，供 getStaticProps 使用
 * @param {string} tableUrl
 * @returns {Promise<Object>} status 为 unavailable 时表示未配置或读取不到数据库
 */
export async function getLeaderboardBoard(tableUrl) {
  const rawRows = await getLeaderboardRawRows(tableUrl)
  if (!rawRows) return createUnavailableBoard()
  return buildLeaderboard(rawRows)
}
