const CONFIG = {
  GITBOOK_COLOR_PRIMARY: '#16a34a',

  GITBOOK_INDEX_PAGE: 'about', // 文档首页显示的文章，请确此路径包含在您的notion数据库中

  GITBOOK_AUTO_SORT: process.env.NEXT_PUBLIC_GITBOOK_AUTO_SORT || true, // 是否自动按分类名 归组排序文章；自动归组可能会打乱您Notion中的文章顺序

  GITBOOK_LATEST_POST_RED_BADGE:
    process.env.NEXT_PUBLIC_GITBOOK_LATEST_POST_RED_BADGE || true, // 是否给最新文章显示红点

  // 菜单
  GITBOOK_MENU_CATEGORY: true, // 显示分类
  GITBOOK_BOOK_MENU_TAG: true, // 显示标签
  GITBOOK_MENU_ARCHIVE: true, // 显示归档
  GITBOOK_MENU_SEARCH: true, // 显示搜索

  // 导航文章自动排他折叠
  GITBOOK_EXCLUSIVE_COLLAPSE: true, // 一次只展开一个分类，其它文件夹自动关闭。

  GITBOOK_FOLDER_HOVER_EXPAND: false, // 左侧导航文件夹鼠标悬停时自动展开；若为false，则要点击才能展开

  // 分类层级（一级 > 二级 > ...）
  GITBOOK_CATEGORY_SEPARATOR: '>', // 层级分隔符，不可为 /
  GITBOOK_NAV_MAX_DEPTH: 4, // 导航最大层级，超出部分并入最后一级名称
  // 文件夹显示顺序：按名称匹配，同一父级下排在前面；未列出的保持 Notion 顺序排在后面。
  // 默认为 Azure AI 文档站的模块顺序（学习路径）、二级模块的序号顺序，以及 Diátaxis 类型顺序。
  // 二级名称（如 1_模型与部署）同一父级下序号唯一，因此按序号升序列出即可；新增二级模块时需同步加入此列表。
  GITBOOK_CATEGORY_ORDER: [
    '入门',
    'Microsoft Foundry',
    'Azure OpenAI',
    'Azure AI Search',
    'Foundry Tools',
    'RAG 与知识工程',
    '智能体与工具',
    '评测、观测与安全',
    '企业架构与成本',
    '解决方案场景',
    '样例与学习资源',
    '附录',
    '0_总览', '0_快速上手', '0_基础', '0_架构', '0_评测', '0_知识与分析', '0_官方入口',
    '1_部署与配额', '1_检索概念', '1_语言', '1_模型与部署', '1_数据准备', '1_成本与容量', '1_上手', '1_MCP 与 Skills', '1_客户工具', '1_文档与服务', '1_安全',
    '2_索引与分块', '2_API 与开发', '2_语音', '2_Agent Service', '2_检索质量与评测', '2_区域与落地', '2_选型', '2_样例仓库',
    '3_权限与安全', '3_翻译', '3_工具与知识', '3_课程与路径',
    '4_性能与基准', '4_视觉', '4_观测与评测', '4_社区与问答',
    '5_文档智能', '5_治理与网络',
    '6_内容理解', '6_开发工具',
    '7_内容安全',
    '8_其他服务',
    '概念解释',
    '教程',
    '操作指南',
    '参考'
  ],

  // Widget
  GITBOOK_WIDGET_REVOLVER_MAPS:
    process.env.NEXT_PUBLIC_WIDGET_REVOLVER_MAPS || 'false', // 地图插件
  GITBOOK_WIDGET_TO_TOP: true // 跳回顶部
}
export default CONFIG
