import Badge from '@/components/Badge'
import Collapse from '@/components/Collapse'
import { siteConfig } from '@/lib/config'
import { useEffect, useState } from 'react'
import BlogPostCard from './BlogPostCard'
import { hasLatestPost } from '../navTree'

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
      <Collapse isOpen={expanded} onHeightChange={onHeightChange}>
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
      </Collapse>
    </>
  )
}

export default NavPostItem
