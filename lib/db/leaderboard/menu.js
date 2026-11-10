import { siteConfig } from '@/lib/config'

export const LEADERBOARD_PATH = '/leaderboard'

/**
 * 开关开启时，在导航末尾追加榜单入口；已有指向榜单的菜单项则不重复添加。
 * 注意：开关关闭时不会移除 Notion 菜单中手动添加的入口。
 * @param {Array<Object>} customMenu Notion 菜单（已由 getCustomMenu 生成）
 * @param {Object} NOTION_CONFIG 站点配置
 * @returns {Array<Object>}
 */
export function appendLeaderboardMenu(customMenu = [], NOTION_CONFIG = {}) {
  if (siteConfig('LEADERBOARD_ENABLE', false, NOTION_CONFIG) !== true) {
    return customMenu
  }
  if (customMenu.some(item => item?.href === LEADERBOARD_PATH)) {
    return customMenu
  }
  return [
    ...customMenu,
    {
      id: 'leaderboard',
      name: siteConfig('LEADERBOARD_MENU_NAME', '榜单', NOTION_CONFIG),
      href: LEADERBOARD_PATH,
      icon: 'fas fa-trophy',
      show: true
    }
  ]
}
