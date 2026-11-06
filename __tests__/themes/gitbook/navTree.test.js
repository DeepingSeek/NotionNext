import {
  buildNavTree,
  collectFolderIds,
  findActiveFolderIds,
  hasLatestPost,
  parseCategory,
  resolveCategoryOrder,
  resolveMaxDepth,
  resolveSeparator,
  summarizeTopLevel
} from '@/themes/gitbook/navTree'

const SEP = '\u001f' // 与 navTree.js 中的 id 分隔符一致

const post = (id, category, extra = {}) => ({
  id,
  href: `/${id}`,
  category,
  ...extra
})

// 把树转换为便于断言的简单结构：文件夹名 -> 子项；文章为 id 字符串
const toShape = node =>
  node.entries.map(entry => {
    if (entry.type === 'post') return entry.post.id
    if (entry.plain) return { plain: entry.entries.map(e => e.post.id) }
    return { [entry.name]: toShape(entry) }
  })

describe('resolveSeparator / resolveMaxDepth', () => {
  it('空值或含 / 的分隔符回退到 >', () => {
    expect(resolveSeparator('')).toBe('>')
    expect(resolveSeparator(undefined)).toBe('>')
    expect(resolveSeparator('/')).toBe('>')
    expect(resolveSeparator('a/b')).toBe('>')
  })

  it('分隔符两侧空格被去掉', () => {
    expect(resolveSeparator(' > ')).toBe('>')
    expect(resolveSeparator('|')).toBe('|')
  })

  it('最大层级非正整数时回退到 4', () => {
    expect(resolveMaxDepth(undefined)).toBe(4)
    expect(resolveMaxDepth(0)).toBe(4)
    expect(resolveMaxDepth('abc')).toBe(4)
    expect(resolveMaxDepth('3')).toBe(3)
  })
})

describe('parseCategory', () => {
  it('空分类返回空数组', () => {
    expect(parseCategory('')).toEqual([])
    expect(parseCategory('   ')).toEqual([])
    expect(parseCategory(undefined)).toEqual([])
    expect(parseCategory(null)).toEqual([])
  })

  it('无分隔符的分类为单层', () => {
    expect(parseCategory('快速开始')).toEqual(['快速开始'])
  })

  it('各种写法的空格都解析为同一路径', () => {
    const expected = ['A', 'B']
    expect(parseCategory('A>B')).toEqual(expected)
    expect(parseCategory('A > B')).toEqual(expected)
    expect(parseCategory(' A >  B ')).toEqual(expected)
  })

  it('支持四级', () => {
    expect(parseCategory('A > B > C > D')).toEqual(['A', 'B', 'C', 'D'])
  })

  it('超过最大层级时，超出部分并入最后一级', () => {
    expect(parseCategory('A > B > C > D > E', { maxDepth: 4 })).toEqual([
      'A',
      'B',
      'C',
      'D > E'
    ])
    expect(parseCategory('A > B > C', { maxDepth: 2 })).toEqual(['A', 'B > C'])
  })

  it('跳过空段', () => {
    expect(parseCategory('A >> B')).toEqual(['A', 'B'])
  })
})

describe('buildNavTree', () => {
  it('扁平分类：每个分类一个文件夹，顺序与首次出现一致', () => {
    const tree = buildNavTree([
      post('1', '快速开始'),
      post('2', '功能说明'),
      post('3', '快速开始')
    ])
    expect(toShape(tree)).toEqual([
      { 快速开始: ['1', '3'] },
      { 功能说明: ['2'] }
    ])
  })

  it('两级分类：二级文件夹位于一级文件夹之下', () => {
    const tree = buildNavTree([
      post('1', '快速开始 > 安装'),
      post('2', '快速开始 > 配置'),
      post('3', '快速开始 > 安装 > Windows')
    ])
    expect(toShape(tree)).toEqual([
      {
        快速开始: [
          { 安装: ['1', { Windows: ['3'] }] },
          { 配置: ['2'] }
        ]
      }
    ])
  })

  it('一级与两级混合：一级下既有直接文章也有子文件夹', () => {
    const tree = buildNavTree([
      post('1', '快速开始'),
      post('2', '快速开始 > 安装')
    ])
    expect(toShape(tree)).toEqual([{ 快速开始: ['1', { 安装: ['2'] }] }])
  })

  it('无分类文章归入一个无名组，位置为首次出现的位置', () => {
    const tree = buildNavTree([
      post('1', '快速开始'),
      post('2', ''),
      post('3', '功能说明'),
      post('4', undefined)
    ])
    expect(toShape(tree)).toEqual([
      { 快速开始: ['1'] },
      { plain: ['2', '4'] },
      { 功能说明: ['3'] }
    ])
  })

  it('同名文件夹在同一父节点下合并（autoSort 为 true）', () => {
    const tree = buildNavTree([
      post('1', '快速开始 > 安装'),
      post('2', '功能说明'),
      post('3', '快速开始 > 配置')
    ])
    expect(toShape(tree)).toEqual([
      { 快速开始: [{ 安装: ['1'] }, { 配置: ['3'] }] },
      { 功能说明: ['2'] }
    ])
  })

  it('autoSort 为 false 时只与最后一个分组合并', () => {
    const tree = buildNavTree(
      [post('1', '快速开始'), post('2', '功能说明'), post('3', '快速开始')],
      { autoSort: false }
    )
    expect(toShape(tree)).toEqual([
      { 快速开始: ['1'] },
      { 功能说明: ['2'] },
      { 快速开始: ['3'] }
    ])
  })

  it('同名文件夹生成不同的 id（即使非自动排序下重复出现）', () => {
    const tree = buildNavTree(
      [post('1', '快速开始'), post('2', '功能说明'), post('3', '快速开始')],
      { autoSort: false }
    )
    const ids = tree.entries.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('忽略空值文章', () => {
    expect(toShape(buildNavTree([null, undefined]))).toEqual([])
  })

  it('分隔符配置为 | 时按 | 分层', () => {
    const tree = buildNavTree([post('1', 'A|B')], { separator: '|' })
    expect(toShape(tree)).toEqual([{ A: [{ B: ['1'] }] }])
  })
})

describe('findActiveFolderIds', () => {
  const tree = buildNavTree([
    post('a', '快速开始 > 安装'),
    post('b', '快速开始 > 安装 > Windows'),
    post('c', '功能说明')
  ])

  it('返回文章所在的全部祖先文件夹（从外到内）', () => {
    const ids = findActiveFolderIds(tree, p => p.id === 'b')
    expect(ids).toEqual([
      // 一级「快速开始」→ 二级「安装」→ 三级「Windows」；id 由 父id + 名称 + 序号 组成
      ['快速开始', '0'].join(SEP),
      ['快速开始', '0', '安装', '0'].join(SEP),
      ['快速开始', '0', '安装', '0', 'Windows', '0'].join(SEP)
    ])
  })

  it('一级文章的祖先为该一级文件夹', () => {
    const ids = findActiveFolderIds(tree, p => p.id === 'c')
    expect(ids).toEqual(['功能说明' + SEP + '0'])
  })

  it('未找到时返回空数组', () => {
    expect(findActiveFolderIds(tree, p => p.id === 'none')).toEqual([])
  })
})

describe('collectFolderIds', () => {
  it('收集节点下所有子孙文件夹 id，不含节点自身', () => {
    const tree = buildNavTree([
      post('1', 'A > B > C'),
      post('2', 'A > D')
    ])
    const a = tree.entries[0]
    const ids = collectFolderIds(a)
    expect(ids).toHaveLength(3)
    expect(ids).not.toContain(a.id)
  })
})

describe('hasLatestPost', () => {
  it('子孙文章有 isLatest 时父文件夹也为真', () => {
    const tree = buildNavTree([
      post('1', 'A > B', { isLatest: true }),
      post('2', 'C')
    ])
    expect(hasLatestPost(tree.entries[0])).toBe(true)
    expect(hasLatestPost(tree.entries[1])).toBe(false)
  })
})

describe('summarizeTopLevel', () => {
  it('只汇总一级分类，数量为其下所有分类之和', () => {
    const options = [
      { name: '快速开始', count: 2 },
      { name: '快速开始 > 安装', count: 3 },
      { name: '快速开始 > 配置', count: 1 },
      { name: '功能说明', count: 4 }
    ]
    expect(summarizeTopLevel(options)).toEqual([
      { name: '快速开始', count: 6 },
      { name: '功能说明', count: 4 }
    ])
  })

  it('没有子分类时与原数据一致', () => {
    const options = [
      { name: 'A', count: 1 },
      { name: 'B', count: 2 }
    ]
    expect(summarizeTopLevel(options)).toEqual([
      { name: 'A', count: 1 },
      { name: 'B', count: 2 }
    ])
  })

  it('空输入返回空数组', () => {
    expect(summarizeTopLevel(undefined)).toEqual([])
    expect(summarizeTopLevel([])).toEqual([])
  })

  it('传入 order 时按排序列表排列，未列出的保持原顺序在后', () => {
    const options = [
      { name: '附录 > 维护', count: 1 },
      { name: '其他', count: 1 },
      { name: '入门 > 上手', count: 2 },
      { name: '另一个', count: 1 }
    ]
    expect(summarizeTopLevel(options, { order: ['入门', '附录'] })).toEqual([
      { name: '入门', count: 2 },
      { name: '附录', count: 1 },
      { name: '其他', count: 1 },
      { name: '另一个', count: 1 }
    ])
  })
})

describe('resolveCategoryOrder', () => {
  it('接受数组，也接受以 | 或换行分隔的字符串，并去掉空白', () => {
    expect(resolveCategoryOrder(['入门', ' 附录 ', ''])).toEqual(['入门', '附录'])
    expect(resolveCategoryOrder('入门 | 附录\n参考')).toEqual(['入门', '附录', '参考'])
    expect(resolveCategoryOrder(undefined)).toEqual([])
  })
})

describe('sortNavTree / buildNavTree 的 order 选项', () => {
  const topNames = root => root.entries.filter(e => e.type === 'folder').map(e => e.name)

  it('一级文件夹按列表顺序排列，未列出的保持 Notion 顺序', () => {
    const posts = [
      post('p1', '附录 > 维护'),
      post('p2', '其他'),
      post('p3', '入门 > 上手'),
      post('p4', 'Microsoft Foundry > 总览')
    ]
    const root = buildNavTree(posts, { order: ['入门', 'Microsoft Foundry', '附录'] })
    expect(topNames(root)).toEqual(['入门', 'Microsoft Foundry', '附录', '其他'])
  })

  it('不传 order 时保持首次出现的顺序', () => {
    const posts = [post('p1', '附录 > 维护'), post('p2', '入门 > 上手')]
    expect(topNames(buildNavTree(posts))).toEqual(['附录', '入门'])
  })

  it('三级类型按列表排序（概念解释、教程、操作指南、参考）', () => {
    const posts = [
      post('p1', 'A > B > 参考'),
      post('p2', 'A > B > 教程'),
      post('p3', 'A > B > 概念解释'),
      post('p4', 'A > B > 操作指南')
    ]
    const root = buildNavTree(posts, { order: ['概念解释', '教程', '操作指南', '参考'] })
    const b = root.entries[0].entries[0]
    expect(b.entries.map(e => e.name)).toEqual(['概念解释', '教程', '操作指南', '参考'])
  })

  it('排序只重排文件夹，文章与无名组的位置不变', () => {
    const posts = [
      post('p1', '附录 > 维护'),
      post('p2', ''),
      post('p3', '入门 > 上手'),
      post('p4', '附录 > 维护 > 参考')
    ]
    const root = buildNavTree(posts, { order: ['入门', '附录'] })
    expect(root.entries[0].name).toBe('入门')
    expect(root.entries[1].plain).toBe(true)
    expect(root.entries[1].entries.map(e => e.post.id)).toEqual(['p2'])
  })

  it('默认配置的模块顺序与 Azure AI 文档站规划一致', () => {
    const CONFIG = require('@/themes/gitbook/config').default
    const modules = [
      '评测、观测与安全',
      '入门',
      'Foundry Tools',
      'Microsoft Foundry',
      'Azure AI Search',
      '附录'
    ]
    const posts = modules.map((m, i) => post(`p${i}`, `${m} > 子主题`))
    const names = topNames(buildNavTree(posts, { order: CONFIG.GITBOOK_CATEGORY_ORDER }))
    expect(names).toEqual([
      '入门',
      'Microsoft Foundry',
      'Azure AI Search',
      'Foundry Tools',
      '评测、观测与安全',
      '附录'
    ])
  })
})
