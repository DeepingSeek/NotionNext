/**
 * 榜单页面 /leaderboard 的配置，数据来自 NotionBlog 同步到 Notion 的派生表
 * 优先级：Notion 配置表 > 环境变量 > 此处默认值
 */
module.exports = {
  LEADERBOARD_ENABLE: false, // 是否开启榜单页面；关闭时 /leaderboard 返回 404
  LEADERBOARD_TABLE_URL: '', // 榜单库的 Notion 链接（已分享到网页），形如 https://www.notion.so/...-<32位页面ID>
  LEADERBOARD_REVALIDATE_SECOND: 86400, // 榜单页 ISR 刷新间隔（秒）
  LEADERBOARD_SHOW_ATTRIBUTION: false, // 是否在页脚显示署名与许可声明；暂不显示
  LEADERBOARD_SOURCE_NAME: '国内MIT', // 数据来源名称，用于页面标题与署名
  LEADERBOARD_SOURCE_URL: '', // 数据来源链接；为空时不显示链接
  LEADERBOARD_LICENSE_NOTICE: '', // 许可声明文本；为空时不显示许可声明
  LEADERBOARD_MENU_NAME: '榜单' // 开关开启时导航中显示的名称
}
