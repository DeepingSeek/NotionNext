import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import CONFIG from '../config'
import {
  buildNavTree,
  findActiveFolderIds,
  resolveCategoryOrder,
  toggleExpandedIds
} from '../navTree'
import BlogPostCard from './BlogPostCard'
import NavPostItem from './NavPostItem'

/**
 * 博客列表滚动分页
 * @param posts 所有文章
 * @param tags 所有标签
 * @returns {JSX.Element}
 * @constructor
 */
const NavPostList = props => {
  const { filteredNavPages } = props
  const { locale, currentSearch } = useGlobal()
  const router = useRouter()

  // 层级配置：分隔符与最大层级（见 config.js）
  const separator = siteConfig('GITBOOK_CATEGORY_SEPARATOR', '>', CONFIG)
  const maxDepth = siteConfig('GITBOOK_NAV_MAX_DEPTH', 4, CONFIG)
  const AUTO_SORT = siteConfig('GITBOOK_AUTO_SORT', true, CONFIG)
  // 排序列表每次渲染可能是新数组引用；按内容生成稳定的 key，避免导航树被反复重建
  const orderKey = resolveCategoryOrder(
    siteConfig('GITBOOK_CATEGORY_ORDER', [], CONFIG)
  ).join('\u0000')
  const orderList = useMemo(
    () => (orderKey ? orderKey.split('\u0000') : []),
    [orderKey]
  )

  // 按分类构建导航树（一级 > 二级 > ...）
  const navTree = useMemo(
    () =>
      buildNavTree(filteredNavPages, {
        separator,
        maxDepth,
        autoSort: AUTO_SORT,
        order: orderList
      }),
    [filteredNavPages, separator, maxDepth, AUTO_SORT, orderList]
  )

  // 存放被展开的文件夹 id
  const [expandedIds, setExpandedIds] = useState([])

  // 是否排他折叠，同一层级只展开一个文件夹
  const GITBOOK_EXCLUSIVE_COLLAPSE = siteConfig(
    'GITBOOK_EXCLUSIVE_COLLAPSE',
    null,
    CONFIG
  )

  useEffect(() => {
    // 展开当前文章所在的整条路径；找不到则展开第一个文件夹
    // 只在路由变化或导航树变化时执行，用户点击展开/收起不会触发（否则会被重置）
    const timer = setTimeout(() => {
      const currentPath = decodeURIComponent(router.asPath.split('?')[0])
      const activeIds = findActiveFolderIds(
        navTree,
        post => currentPath === post.href
      )
      const firstFolder = navTree.entries.find(
        e => e.type === 'folder' && !e.plain
      )
      setExpandedIds(
        activeIds.length > 0 ? activeIds : firstFolder ? [firstFolder.id] : []
      )
    }, 500)
    return () => clearTimeout(timer)
  }, [router.asPath, navTree])

  // 折叠项切换：node 为被点击的文件夹，siblings 为同级文件夹
  const toggleFolder = (node, siblings) => {
    setExpandedIds(prev =>
      toggleExpandedIds(prev, node, siblings, GITBOOK_EXCLUSIVE_COLLAPSE)
    )
  }

  // 如果href
  const href = siteConfig('GITBOOK_INDEX_PAGE') + ''

  const homePost = {
    id: '-1',
    title: siteConfig('DESCRIPTION'),
    href: href.indexOf('/') !== 0 ? '/' + href : href
  }

  // 空数据返回
  if (!navTree.entries || navTree.entries.length === 0) {
    // 空白内容
    return (
      <div className='flex w-full items-center justify-center min-h-screen mx-auto md:-mt-20'>
        <p className='text-gray-500 dark:text-gray-300'>
          {locale.COMMON.NO_RESULTS_FOUND}{' '}
          {currentSearch && <div>{currentSearch}</div>}
        </p>
      </div>
    )
  }

  // 搜索结果：平铺列表，每条显示完整分类路径
  if (currentSearch) {
    return (
      <div
        id='posts-wrapper'
        className='w-full flex-grow space-y-0.5 pr-4 tracking-wider'>
        <BlogPostCard className='mb-4' post={homePost} />
        {(filteredNavPages || []).filter(Boolean).map((post, index) => (
          <div key={post.id || index}>
            {post.category && (
              <div className='ml-3 text-xs text-gray-400 dark:text-gray-500'>
                {post.category}
              </div>
            )}
            <BlogPostCard className='text-md py-2' post={post} />
          </div>
        ))}
      </div>
    )
  }

  const topFolders = navTree.entries.filter(
    e => e.type === 'folder' && !e.plain
  )

  return (
    <div
      id='posts-wrapper'
      className='w-full flex-grow space-y-0.5 pr-4 tracking-wider'>
      {/* 当前文章 */}
      <BlogPostCard className='mb-4' post={homePost} />

      {/* 文章列表 */}
      {navTree.entries.map((entry, index) =>
        entry.type === 'folder' ? (
          <NavPostItem
            key={entry.id || index}
            node={entry}
            expandedIds={expandedIds}
            onToggle={toggleFolder}
            siblings={topFolders}
            onHeightChange={props.onHeightChange}
          />
        ) : (
          <div key={index}>
            <BlogPostCard className='text-md py-2' post={entry.post} />
          </div>
        )
      )}
    </div>
  )
}

export default NavPostList
