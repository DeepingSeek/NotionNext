import Badge from '@/components/Badge'
import { siteConfig } from '@/lib/config'
import { useEffect, useRef, useState } from 'react'
import BlogPostCard from './BlogPostCard'
import { hasLatestPost } from '../navTree'

/**
 * 导航折叠容器（仅 gitbook 使用）
 *
 * 不使用 components/Collapse：它在展开结束后会把高度固定为像素值（且清除了定时器，
 * 不会切回 auto），嵌套时父级的固定高度会裁切新展开的子级。
 * 这里用 grid-template-rows 从 0fr 过渡到 1fr，高度由内容决定，嵌套层级互不影响。
 */
const NavCollapse = ({ isOpen, onHeightChange, children }) => {
  const innerRef = useRef(null)

  useEffect(() => {
    // 与 Collapse 保持一致：只在展开状态变化时通知父组件（不把回调放入依赖，避免父组件每次渲染都被触发）
    onHeightChange &&
      onHeightChange({
        height: innerRef.current ? innerRef.current.scrollHeight : 0,
        increase: isOpen
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'grid-template-rows 300ms ease, visibility 300ms'
      }}>
      <div ref={innerRef} style={{ overflow: 'hidden', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}

/**
 * 导航文件夹（递归）
 * @param node 当前文件夹节点（见 navTree.js 的 buildNavTree）
 * @param expandedIds 已展开的文件夹 id 列表
 * @param onToggle(node, siblings) 切换展开状态
 * @param siblings 同级的文件夹列表（用于排他折叠）
 * @returns {JSX.Element}
 */
const NavPostItem = props => {
  const { node, expandedIds, onToggle, siblings, onHeightChange } = props
  const hoverExpand = siteConfig('GITBOOK_FOLDER_HOVER_EXPAND')
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // 检测是否为触摸设备
  useEffect(() => {
    const checkTouchDevice = () => {
      if (window.matchMedia('(pointer: coarse)').matches) {
        setIsTouchDevice(true)
      }
    }
    checkTouchDevice()

    // 可选：监听窗口大小变化时重新检测
    window.addEventListener('resize', checkTouchDevice)
    return () => {
      window.removeEventListener('resize', checkTouchDevice)
    }
  }, [])

  // 无名组（无分类文章）：直接渲染为平铺文章
  if (node.plain) {
    return (
      <>
        {node.entries.map((entry, index) =>
          entry.type === 'post' ? (
            <div key={index}>
              <BlogPostCard className='text-md py-2' post={entry.post} />
            </div>
          ) : null
        )}
      </>
    )
  }

  const expanded = expandedIds.includes(node.id)
  const childFolders = node.entries.filter(e => e.type === 'folder' && !e.plain)
  const folderHasLatest = hasLatestPost(node)

  const toggleOpenSubMenu = () => {
    onToggle(node, siblings)
  }
  const onHoverToggle = () => {
    // 允许鼠标悬停时自动展开，而非点击展开
    if (!hoverExpand || isTouchDevice) {
      return
    }
    toggleOpenSubMenu()
  }

  return (
    <>
      <div
        onMouseEnter={onHoverToggle}
        onClick={toggleOpenSubMenu}
        className='cursor-pointer relative flex justify-between text-md p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 dark:hover:text-gray-200'>
        <span className={`${expanded && 'font-semibold'}`}>{node.name}</span>
        <div className='inline-flex items-center select-none pointer-events-none '>
          <i
            className={`px-2 fas fa-chevron-left transition-all opacity-50 duration-700 ${expanded ? '-rotate-90' : ''}`}></i>
        </div>
        {folderHasLatest &&
          siteConfig('GITBOOK_LATEST_POST_RED_BADGE') &&
          !expanded && <Badge />}
      </div>
      <NavCollapse isOpen={expanded} onHeightChange={onHeightChange}>
        {node.entries.map((entry, index) =>
          entry.type === 'folder' ? (
            <div
              key={entry.id}
              className='ml-3 border-l border-gray-200 dark:border-gray-700'>
              <NavPostItem
                node={entry}
                expandedIds={expandedIds}
                onToggle={onToggle}
                siblings={childFolders}
                onHeightChange={onHeightChange}
              />
            </div>
          ) : (
            <div
              key={index}
              className='ml-3 border-l border-gray-200 dark:border-gray-700'>
              <BlogPostCard className='ml-3' post={entry.post} />
            </div>
          )
        )}
      </NavCollapse>
    </>
  )
}

export default NavPostItem
