/**
 * gitbook 导航：分类层级解析与树构建（纯函数，无 React 依赖，便于单测）
 *
 * 分类格式：「一级 > 二级 > 三级 > 四级」（最多 GITBOOK_NAV_MAX_DEPTH 级，默认 4）
 * 分隔符：GITBOOK_CATEGORY_SEPARATOR，默认 `>`，不得为 `/`（会破坏 /category/[category] 路由）
 */

export const DEFAULT_SEPARATOR = '>'
export const DEFAULT_MAX_DEPTH = 4

const ID_SEP = '\u001f'
const ROOT_ID = ''
const UNNAMED_ID = '\u001e'

/** 分隔符校验：空或包含 `/` 时回退到默认值 */
export function resolveSeparator(separator) {
  const sep = typeof separator === 'string' ? separator.trim() : ''
  if (!sep || sep.includes('/')) return DEFAULT_SEPARATOR
  return sep
}

/** 层级校验：非正整数时回退到默认值 */
export function resolveMaxDepth(maxDepth) {
  const n = Number(maxDepth)
  return Number.isInteger(n) && n >= 1 ? n : DEFAULT_MAX_DEPTH
}

/**
 * 把分类字符串解析为层级数组
 * 'A>B'、'A > B'、' A >  B ' 都解析为 ['A', 'B']
 * 超过最大层级的部分并入最后一级，保留原分隔符文本
 */
export function parseCategory(category, { separator, maxDepth } = {}) {
  if (typeof category !== 'string' || !category.trim()) return []
  const sep = resolveSeparator(separator)
  const depth = resolveMaxDepth(maxDepth)
  let segments = category
    .split(sep)
    .map(s => s.trim())
    .filter(Boolean)
  if (segments.length > depth) {
    segments = [
      ...segments.slice(0, depth - 1),
      segments.slice(depth - 1).join(` ${sep} `)
    ]
  }
  return segments
}

function findFolder(node, name, autoSort) {
  if (autoSort) {
    return node.entries.find(
      e => e.type === 'folder' && !e.plain && e.name === name
    )
  }
  // 关闭自动排序：只与最后一个分组合并（与原 groupArticles 行为一致）
  const last = node.entries[node.entries.length - 1]
  return last && last.type === 'folder' && !last.plain && last.name === name
    ? last
    : undefined
}

function createFolder(parent, name) {
  const occurrence = parent.entries.filter(
    e => e.type === 'folder' && !e.plain && e.name === name
  ).length
  const id = [parent.id, name, occurrence]
    .filter((part, i) => !(i === 0 && part === ROOT_ID))
    .join(ID_SEP)
  return { type: 'folder', name, id, plain: false, entries: [] }
}

/**
 * 按分类构建导航树
 * - 文件夹与平铺文章按首次出现的位置排列（与原 groupArticles 一致）
 * - autoSort 为 true 时，同名文件夹在同一父节点下合并；为 false 时只与最后一个分组合并
 * - 无分类文章归入根下的一个无名组（plain），渲染为平铺文章
 * @returns {{ id, name, plain, entries }} 根节点；entries 元素为 {type:'folder', ...} 或 {type:'post', post}
 */
export function buildNavTree(posts, options = {}) {
  const { autoSort = true } = options
  const root = {
    type: 'folder',
    name: '',
    id: ROOT_ID,
    plain: false,
    entries: []
  }

  for (const post of posts || []) {
    if (!post) continue
    const segments = parseCategory(post.category, options)

    if (segments.length === 0) {
      let unnamed = autoSort
        ? root.entries.find(e => e.type === 'folder' && e.plain)
        : root.entries[root.entries.length - 1]
      if (!unnamed || !(unnamed.type === 'folder' && unnamed.plain)) {
        unnamed = { type: 'folder', name: '', id: UNNAMED_ID, plain: true, entries: [] }
        root.entries.push(unnamed)
      }
      unnamed.entries.push({ type: 'post', post })
      continue
    }

    let node = root
    for (const seg of segments) {
      let child = findFolder(node, seg, autoSort)
      if (!child) {
        child = createFolder(node, seg)
        node.entries.push(child)
      }
      node = child
    }
    node.entries.push({ type: 'post', post })
  }
  return options.order ? sortNavTree(root, options.order) : root
}

/**
 * 把排序配置规范化为名称数组
 * 支持数组，或以 `|` / 换行分隔的字符串（便于在 Notion Config 表中填写）
 */
export function resolveCategoryOrder(order) {
  const list = Array.isArray(order)
    ? order
    : typeof order === 'string'
      ? order.split(/[|\n]/)
      : []
  return list.map(s => String(s).trim()).filter(Boolean)
}

/** 名称在排序列表中的位置；未列出的排在列表之后（保持原顺序） */
function rankOf(name, order) {
  const i = order.indexOf(name)
  return i === -1 ? order.length : i
}

/**
 * 按 GITBOOK_CATEGORY_ORDER 对导航树中的文件夹排序（原地修改，返回 root）
 * - 按名称匹配，所以一级模块与三级类型（概念解释、教程…）都可以列在同一个数组里
 * - 只在文件夹占据的位置之间重排；文章与无名组的位置不变
 * - 同名或未列出的文件夹保持原顺序（稳定排序）
 */
export function sortNavTree(root, order) {
  const list = resolveCategoryOrder(order)
  if (list.length === 0) return root
  const visit = node => {
    const slots = []
    const folders = []
    node.entries.forEach((entry, i) => {
      if (entry.type === 'folder' && !entry.plain) {
        slots.push(i)
        folders.push(entry)
      }
    })
    const sorted = folders
      .map((folder, i) => ({ folder, i }))
      .sort((a, b) => rankOf(a.folder.name, list) - rankOf(b.folder.name, list) || a.i - b.i)
      .map(x => x.folder)
    slots.forEach((slot, k) => {
      node.entries[slot] = sorted[k]
    })
    node.entries.forEach(entry => {
      if (entry.type === 'folder') visit(entry)
    })
  }
  visit(root)
  return root
}

/**
 * 找到包含当前文章的所有祖先文件夹 id（从外到内）
 * 未找到返回空数组
 */
export function findActiveFolderIds(root, isActive) {
  const search = node => {
    for (const entry of node.entries) {
      if (entry.type === 'post') {
        if (isActive(entry.post)) return []
        continue
      }
      if (entry.plain) {
        if (search(entry)) return []
        continue
      }
      const sub = search(entry)
      if (sub) return [entry.id, ...sub]
    }
    return null
  }
  return search(root) || []
}

/** 收集某节点下所有文件夹的 id（不含节点自身） */
export function collectFolderIds(node) {
  const ids = []
  for (const entry of node.entries || []) {
    if (entry.type === 'folder' && !entry.plain) {
      ids.push(entry.id, ...collectFolderIds(entry))
    }
  }
  return ids
}

/** 节点下（含子孙）是否有 isLatest 的文章 */
export function hasLatestPost(node) {
  return (node.entries || []).some(e =>
    e.type === 'post' ? !!e.post?.isLatest : hasLatestPost(e)
  )
}

/**
 * 分类索引页：只汇总一级分类
 * 一级名称取分类的第一段；数量为其下所有分类（含二级及以下）的文章数之和
 */
export function summarizeTopLevel(categoryOptions, options = {}) {
  const result = []
  const byName = new Map()
  for (const option of categoryOptions || []) {
    const segments = parseCategory(option?.name, options)
    if (segments.length === 0) continue
    const top = segments[0]
    if (!byName.has(top)) {
      const item = { name: top, count: 0 }
      byName.set(top, item)
      result.push(item)
    }
    byName.get(top).count += Number(option.count) || 0
  }
  const order = resolveCategoryOrder(options.order)
  if (order.length === 0) return result
  return result
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rankOf(a.item.name, order) - rankOf(b.item.name, order) || a.i - b.i)
    .map(x => x.item)
}
