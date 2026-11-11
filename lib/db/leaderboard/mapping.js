/**
 * 榜单派生表的字段映射与纯函数处理，不访问 Notion，可直接单测
 * 字段名与 NotionBlog 方案第 5 节一致；两边改字段时需同步更新
 */

export const LEADERBOARD_FIELDS = {
  name: 'Name',
  rank: 'Rank',
  creator: 'Creator',
  intelligence: 'Intelligence Index',
  inputPrice: 'Input Price',
  outputPrice: 'Output Price',
  outputTps: 'Median Output TPS',
  ttft: 'Median TTFT (s)',
  modelId: 'AA Model ID',
  indexVersion: 'Index Version',
  active: 'Active',
  syncedAt: 'Synced At'
}

// 数据超过 36 小时未同步即视为可能过期
export const STALE_AFTER_MS = 36 * 60 * 60 * 1000

export const DEFAULT_SORT_KEY = 'intelligence'

// 排序键与字段、方向的对应关系；与 SortChips 的选项保持一致
export const SORT_SPECS = {
  intelligence: { field: 'intelligence', direction: 'desc' },
  price: { field: 'inputPrice', direction: 'asc' },
  speed: { field: 'outputTps', direction: 'desc' },
  ttft: { field: 'ttft', direction: 'asc' }
}

const EFFORT_LEVELS = new Set([
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
  'reasoning',
  'non-reasoning'
])

/**
 * 只保留模型名末尾括号里的推理档位（如 Max、High、Reasoning），去掉 Default Fallback 等配置后缀
 * @param {string} name
 * @returns {string}
 */
export function cleanModelName(name) {
  return name
    .replace(/\s*\(([^()]*)\)\s*$/, (match, inner) => {
      const levels = []
      for (const word of inner.split(/[\s,]+/)) {
        if (EFFORT_LEVELS.has(word.toLowerCase()) && !levels.includes(word)) {
          levels.push(word)
        }
      }
      return levels.length ? ` (${levels.join(', ')})` : ''
    })
    .trim()
}

const clean = value => (typeof value === 'string' ? value.trim() : '')

/**
 * 空值保持为 null，不转为 0
 * @param {*} raw
 * @returns {number|null}
 */
export function parseNullableNumber(raw) {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  const text = String(raw).trim()
  if (text === '') return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

export function parseCheckbox(raw) {
  return raw === true || raw === 'Yes' || raw === 'true'
}

function parseIsoDate(raw) {
  if (!raw) return null
  const time = new Date(raw).getTime()
  return Number.isNaN(time) ? null : new Date(time).toISOString()
}

/**
 * 把一行原始属性（属性名 -> 值）转换为页面使用的结构
 * @param {Object} props 以 Notion 属性名为键，并带有 id
 * @returns {Object|null} 名称或排名无效时返回 null
 */
export function normalizeLeaderboardRow(props = {}) {
  const name = clean(props[LEADERBOARD_FIELDS.name])
  const rank = parseNullableNumber(props[LEADERBOARD_FIELDS.rank])
  if (!name || rank === null || !Number.isInteger(rank) || rank < 1) {
    return null
  }

  const modelId = clean(props[LEADERBOARD_FIELDS.modelId])
  return {
    id: props.id || modelId || name,
    modelId,
    name: cleanModelName(name),
    rank,
    creator: clean(props[LEADERBOARD_FIELDS.creator]),
    intelligence: parseNullableNumber(props[LEADERBOARD_FIELDS.intelligence]),
    inputPrice: parseNullableNumber(props[LEADERBOARD_FIELDS.inputPrice]),
    outputPrice: parseNullableNumber(props[LEADERBOARD_FIELDS.outputPrice]),
    outputTps: parseNullableNumber(props[LEADERBOARD_FIELDS.outputTps]),
    ttft: parseNullableNumber(props[LEADERBOARD_FIELDS.ttft]),
    indexVersion: parseNullableNumber(props[LEADERBOARD_FIELDS.indexVersion]),
    syncedAt: parseIsoDate(props[LEADERBOARD_FIELDS.syncedAt])
  }
}

/**
 * 过滤 Active 行、转换、按 Rank 排序，并做校验
 * @param {Array<Object>} rawRows
 * @param {{ now?: number }} options
 */
export function buildLeaderboard(rawRows = [], { now = Date.now() } = {}) {
  const activeRaw = rawRows.filter(row =>
    parseCheckbox(row?.[LEADERBOARD_FIELDS.active])
  )

  let invalidRows = 0
  const rows = []
  for (const raw of activeRaw) {
    const row = normalizeLeaderboardRow(raw)
    if (row) {
      rows.push(row)
    } else {
      invalidRows += 1
    }
  }

  rows.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))

  // 排名应为 1 到 N 的连续整数；缺号、重号或存在无效行都视为异常
  const rankIssue =
    invalidRows > 0 || rows.some((row, index) => row.rank !== index + 1)

  const syncedTimes = rows
    .map(row => row.syncedAt)
    .filter(Boolean)
    .sort()
  const syncedAt = syncedTimes.length
    ? syncedTimes[syncedTimes.length - 1]
    : null

  const indexVersion = rows.find(row => row.indexVersion !== null)?.indexVersion ?? null
  const stale = syncedAt
    ? now - Date.parse(syncedAt) > STALE_AFTER_MS
    : false

  return {
    status: rows.length ? 'ok' : 'empty',
    rows,
    syncedAt,
    indexVersion,
    stale,
    rankIssue,
    invalidRows
  }
}

/**
 * 排序；空值排在最后，同值按 Rank 升序
 * @param {Array<Object>} rows
 * @param {string} sortKey
 */
export function sortLeaderboardRows(rows, sortKey = DEFAULT_SORT_KEY) {
  const spec = SORT_SPECS[sortKey] || SORT_SPECS[DEFAULT_SORT_KEY]
  return [...rows].sort((a, b) => {
    const av = a[spec.field]
    const bv = b[spec.field]
    if ((av === null) !== (bv === null)) return av === null ? 1 : -1
    if (av !== null && av !== bv) {
      return spec.direction === 'asc' ? av - bv : bv - av
    }
    return a.rank - b.rank
  })
}

/**
 * 按厂商精确匹配，按名称或厂商做不区分大小写的搜索
 * @param {Array<Object>} rows
 * @param {{ query?: string, vendor?: string }} filters
 */
export function filterLeaderboardRows(rows, { query = '', vendor = '' } = {}) {
  const keyword = query.trim().toLowerCase()
  return rows.filter(row => {
    if (vendor && row.creator !== vendor) return false
    if (!keyword) return true
    return (
      row.name.toLowerCase().includes(keyword) ||
      row.creator.toLowerCase().includes(keyword)
    )
  })
}

export function getVendorOptions(rows) {
  return [...new Set(rows.map(row => row.creator).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'zh-CN')
  )
}

/**
 * 解析 URL 查询参数为看板状态，非法值回退到默认值
 * @param {Object} query
 */
export function parseBoardQuery(query = {}) {
  const sort = typeof query.sort === 'string' ? query.sort : ''
  const text = value => (typeof value === 'string' ? value : '')
  return {
    sort: SORT_SPECS[sort] ? sort : DEFAULT_SORT_KEY,
    query: text(query.q),
    vendor: text(query.vendor)
  }
}

/**
 * 把看板状态写回查询参数，默认值不写入，保留其他参数（如 theme）
 * @param {Object} baseQuery
 * @param {{ sort: string, query: string, vendor: string }} state
 */
export function buildBoardQuery(baseQuery = {}, state) {
  const next = { ...baseQuery }
  delete next.sort
  delete next.q
  delete next.vendor
  if (state.sort && state.sort !== DEFAULT_SORT_KEY) next.sort = state.sort
  if (state.query.trim()) next.q = state.query
  if (state.vendor) next.vendor = state.vendor
  return next
}

/**
 * 数字格式化；空值返回 null，由组件渲染为“—”
 * @param {number|null} value
 * @param {number} digits
 */
export function formatMetric(value, digits) {
  if (value === null || value === undefined) return null
  return value.toFixed(digits)
}

/**
 * 同步时间统一按北京时间显示，避免服务端与客户端时区不同导致水合不一致
 * @param {string|null} iso
 */
export function formatSyncedAt(iso) {
  if (!iso) return null
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(iso))
}
