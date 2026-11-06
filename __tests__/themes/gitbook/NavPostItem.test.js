import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import NavPostItem from '@/themes/gitbook/components/NavPostItem'
import { buildNavTree, toggleExpandedIds } from '@/themes/gitbook/navTree'

jest.mock('@/lib/config', () => ({ siteConfig: () => false }))
jest.mock('@/components/Badge', () => () => null)
jest.mock('@/themes/gitbook/components/BlogPostCard', () => {
  const BlogPostCardMock = ({ post }) => <div>{post.title}</div>
  return BlogPostCardMock
})

const post = (id, category, title) => ({ id, href: `/${id}`, category, title })

// 三级结构：入门 > 基础 > 概念解释 > 文章；入门 > 上手 > 教程 > 文章
const posts = [
  post('p1', '入门 > 基础 > 概念解释', '术语与改名对照'),
  post('p2', '入门 > 上手 > 教程', '第一次调用模型')
]

/** 与 NavPostList 相同的展开逻辑（排他折叠），用于复现真实交互 */
function Harness({ exclusive = true }) {
  const root = buildNavTree(posts)
  const [expandedIds, setExpandedIds] = useState([])
  const toggle = (node, siblings) =>
    setExpandedIds(prev => toggleExpandedIds(prev, node, siblings, exclusive))
  return (
    <NavPostItem
      node={root.entries[0]}
      expandedIds={expandedIds}
      onToggle={toggle}
      siblings={[]}
    />
  )
}

const click = name => fireEvent.click(screen.getByText(name))

describe('NavPostItem 嵌套展开', () => {
  it('逐级点击可以依次看到二级、三级文件夹和文章', () => {
    render(<Harness />)

    // 初始全部收起：只有一级可见
    expect(screen.getByText('入门')).toBeVisible()
    expect(screen.queryByText('基础')).not.toBeVisible()
    expect(screen.queryByText('概念解释')).not.toBeVisible()
    expect(screen.queryByText('术语与改名对照')).not.toBeVisible()

    // 一级：展开后二级可见
    click('入门')
    expect(screen.getByText('基础')).toBeVisible()
    expect(screen.getByText('上手')).toBeVisible()

    // 二级：展开后三级可见
    click('基础')
    expect(screen.getByText('概念解释')).toBeVisible()

    // 三级：展开后文章可见
    click('概念解释')
    expect(screen.getByText('术语与改名对照')).toBeVisible()
  })

  it('再次点击可以收起三级，文章随之隐藏', () => {
    render(<Harness />)
    click('入门')
    click('基础')
    click('概念解释')
    expect(screen.getByText('术语与改名对照')).toBeVisible()

    click('概念解释')
    expect(screen.queryByText('术语与改名对照')).not.toBeVisible()
    // 父级仍然展开
    expect(screen.getByText('概念解释')).toBeVisible()
  })

  it('排他折叠：展开另一个二级时，原二级及其三级收起', () => {
    render(<Harness />)
    click('入门')
    click('基础')
    click('概念解释')
    expect(screen.getByText('术语与改名对照')).toBeVisible()

    click('上手')
    expect(screen.queryByText('术语与改名对照')).not.toBeVisible()
    expect(screen.queryByText('概念解释')).not.toBeVisible()
    expect(screen.getByText('教程')).toBeVisible()

    click('教程')
    expect(screen.getByText('第一次调用模型')).toBeVisible()
  })
})
