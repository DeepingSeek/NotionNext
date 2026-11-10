# 榜单页面 UI 设计方案（前端层）

- 日期：2026-11-10
- 状态：设计草案，未实现
- 上游：[榜单页面方案](./2026-11-10-leaderboard-page.md)（路由、数据、缓存、组件文件布局以该文档为准）
- 范围：`/leaderboard` 页面的视觉、信息层级、交互、响应式与无障碍规格

## 1. 结论

1. 视觉上沿用 NotionNext 的 Tailwind 体系，不引入新色板、不引入新 UI 框架。颜色使用 `tailwind.config.js` 中的令牌（`primary`、`secondary`、`dark-*`、`day`、`night`）。
2. 综合分是唯一主指标，其余指标为次要列。首屏顺序：页头 → 工具条（排序、搜索、厂商）→ 表格。
3. 窄屏用卡片列表，宽屏用表格。断点与侧边栏的关系需要先定（见第 7 节）。
4. 图标使用项目已有依赖（`@tabler/icons-react`、`remixicon-react`），不用 emoji。下拉与展开使用 `@headlessui/react`。
5. 无障碍优先：可排序表头用 `<button>` + `aria-sort`，焦点环可见，暗色模式下文字对比度单独校验。

## 2. Skill 使用说明

- 已加载 `ui-ux-pro-max`，但其 `scripts/` 与 `data/` 目录为空，`search.py --design-system` 无法运行。因此本方案以该 skill 的 **SKILL.md 规则**（第 1–10 优先级）为依据，并以仓库现有代码核对。
- Skill 的「Common Rules」与像素规格面向原生 App（pt/dp）。在 Web 端按下列方式映射：44pt → 44px，48dp → 48px，8dp 间距 → 8px。
- 有意偏离的一条：skill 建议 50 项以上列表做虚拟化。本页 Top 100 且需要 `__NEXT_DATA__` 与 SEO 可见内容，不做虚拟化，只限制列数与行高。

## 3. 现状核对

| 项 | 事实 | 出处 |
| --- | --- | --- |
| 默认主题 | `simple`（可由 `NEXT_PUBLIC_THEME` 覆盖） | `blog.config.js:9` |
| 暗色模式 | 默认 `light`，Tailwind `darkMode` 为 `class` | `blog.config.js:16`，`tailwind.config.js:10` |
| 颜色令牌 | `primary #3758F9`、`secondary #13C296`、`warning #FBBF24`、`body-color #637381`、`body-secondary #8899A8`、`dark.*`、`day`、`night` | `tailwind.config.js:30-60` |
| 断点 | `sm 540`、`md 720`、`lg 960`、`xl 1140`（注意：不是常见的 768） | `tailwind.config.js:12-22` |
| 布局骨架 | `simple` 的 `LayoutBase` 渲染 `children`；xl 以上有右侧边栏 `w-96 pl-12` | `themes/simple/index.js:109`、`:117` |
| 全宽 | `fullWidth` 来自 `post?.fullWidth`，榜单页没有 `post`，因此默认显示侧边栏 | `lib/global.js:53` |
| 图标库 | `@tabler/icons-react`、`remixicon-react` 已安装 | `package.json:75`、`:97` |
| 交互库 | `@headlessui/react` 已安装 | `package.json:71` |
| 骨架屏 | 已有 `animate-pulse` 骨架写法，可复用 | `themes/theme.js:14-60` |

对方案文档的修正：

- 方案 4.7 写「颜色取主题已有的 CSS 变量」。通用层没有统一的 CSS 变量色板，实际可用的是 Tailwind 颜色令牌。应改为「使用 `tailwind.config.js` 的颜色令牌」。
- 方案第 6 节 Phase 0 的「确认 `LayoutBase` 是否渲染 `children`」已部分确认：`simple`、`hexo`、`next`、`heo` 的 `LayoutBase` 都渲染 `children`（`themes/simple/index.js:109` 等）。仍需确认其余主题。

## 4. 设计原则（按 skill 优先级）

| 优先级 | 类别 | 本页落地 |
| --- | --- | --- |
| 1 | 无障碍 | 文字对比度 ≥ 4.5:1；所有可交互元素有 `focus-visible` 焦点环；排序按钮带文字与 `aria-sort`；表格带 `<caption>`；前 5 名高亮同时用文字徽标，不只靠颜色 |
| 2 | 触控 | 触控目标 ≥ 44px；控件间距 ≥ 8px；排序按钮、搜索框在移动端高度 ≥ 44px |
| 3 | 性能 | 无图片；表格数值列用 `tabular-nums`，避免排序时抖动；页头预留高度，避免 CLS |
| 4 | 风格 | 一套图标族（tabler）、统一圆角与阴影；不混用 emoji；前 3 名用数字徽标 |
| 5 | 布局与响应式 | 移动优先；页面本身不出现横向滚动；宽表格只在自身容器内横向滚动 |
| 6 | 字体与颜色 | 正文 ≥ 16px；次要文字 ≥ 14px；数字用 `tabular-nums`；数值列右对齐 |
| 7 | 动效 | 排序切换不做位移动画；颜色过渡 150–200ms；`motion-reduce:transition-none` |
| 8 | 表单与反馈 | 搜索框有可见标签；厂商下拉有标签；空结果与失败状态有文字说明 |
| 9 | 导航 | 排序、搜索、厂商状态写入 URL（`?sort=`、`?q=`、`?vendor=`），返回时保留状态（沿用方案中的 `?board=`） |
| 10 | 图表 | 本期无图表；表格即无障碍替代方案 |

## 5. 颜色与对比度

在 WCAG 公式下手算的参考值（实施时用工具复核）：

| 用途 | 浅色 | 暗色 | 结论 |
| --- | --- | --- | --- |
| 正文 | `text-dark`（`#111928`）on white | `dark:text-gray-300`（`#D1D5DB`）on black | 满足 |
| 次要文字（指标、厂商） | `text-body-color`（`#637381`）on white，约 4.9:1 | `dark:text-gray-400`（`#9CA3AF`）on black，约 8:1 | 满足 |
| 主指标（综合分）颜色 | `text-primary`（`#3758F9`）on white，约 5.4:1 | 暗色改用 `dark:text-indigo-400`（`#818CF8`），约 7:1 | 暗色不能直接用 `primary` |
| 次要文字 | `text-body-secondary`（`#8899A8`）约 2.9:1 | — | **不用于文字**，只用于分隔线或图标 |
| `secondary`（`#13C296`） | 约 2.3:1 | — | **不用于文字**，只用于小面积装饰 |
| 前 5 名行背景 | `bg-primary/5` + 左侧 2px `border-primary` | `dark:bg-primary/10` | 文字颜色不变 |
| 第 1–3 名徽标 | 实心 `bg-primary text-white`（白字约 5.4:1） | 同左 | 满足 |
| 过期提示条 | `bg-warning/20` + `text-dark`（不用白字） | `dark:bg-warning/15` + `dark:text-gray-100` | 不用白字压黄色 |
| 分隔线 | `border-gray-200` | `dark:border-gray-800` | 两种模式都可见 |

规则：文字只用 `dark`、`body-color`、`primary`（浅色）及对应的暗色变体。`body-secondary` 与 `secondary` 不用于文字。

## 6. 组件规格

| 组件 | 结构 | 关键样式 |
| --- | --- | --- |
| `LeaderboardIntro` | 标题（h1）、一句话说明、数据来源与更新频率、`Synced At`、`Index Version` | h1 `text-3xl font-bold lg:text-4xl`；元信息 `text-sm text-body-color` |
| 过期提示条 | `role="status"`，图标 + 文字 | 仅超过 36 小时才显示 |
| `SortChips` | 4 个按钮（综合分、价格、速度、首字延迟），`aria-pressed` 表示当前项 | `h-11 px-4 rounded-full border`；选中 `bg-primary text-white`；未选中 `border-gray-300 text-dark` |
| `FilterBar` | 搜索框（可见标签）+ 厂商下拉（`@headlessui/react` Listbox，带标签） | 搜索框 `h-11 rounded-lg`；移动端全宽，桌面端与排序并排 |
| `LeaderboardTable` | `<table>`，`<caption class="sr-only">`，表头为 `<button>` | 行高 `h-14`；数值列 `text-right tabular-nums`；表头 `text-sm font-semibold text-body-color` |
| 首列（Rank + 名称） | `position: sticky; left: 0`，背景与行同色 | 名称下方用小字显示厂商（减少一列） |
| 综合分列 | 唯一加粗列 | `font-semibold text-dark dark:text-white`；暗色列文字用 `text-indigo-400` 强调 |
| `LeaderboardCards` | 小屏卡片：Rank 徽标、名称、厂商、综合分；`Disclosure` 展开其余指标 | `rounded-xl border p-4`；展开按钮 `min-h-11` |
| 空状态 | 图标 + 文字，说明“暂无数据”或“数据暂不可用” | 不提供假数据；失败状态文案与方案 4.3 一致 |
| `Attribution` | 署名、MIT 声明、来源链接 | `text-sm text-body-color`；链接 `underline underline-offset-4` 并带焦点环 |

焦点样式（全局统一）：`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`，暗色加 `dark:focus-visible:ring-offset-black`。

## 7. 响应式与布局

### 7.1 断点

- 窄屏（< `lg`，即 960px 以下）：卡片列表。
- 宽屏（≥ `lg`）：表格。

不用 `md`（720px）切换表格。7 列在 720px 下会挤压到无法阅读。

### 7.2 侧边栏问题（需要决定）

`simple` 主题在 xl（1140px）以上显示 `w-96 pl-12` 的右侧边栏。在 1200px 视口下，主内容区只剩约 600px，表格会严重受限。

可选方案：

- **A（已确认）**：榜单页隐藏侧边栏。需要让 `fullWidth` 为 true。当前 `lib/global.js:53` 只读 `post?.fullWidth`，需要确认能否通过页面 props 注入，实施时验证。
- **B**：保留侧边栏。表格在宽屏下使用自身的横向滚动容器，首列固定。阅读体验较差。

### 7.3 表格列（宽屏）

| 列 | 宽度（参考） | 对齐 | 说明 |
| --- | --- | --- | --- |
| Rank | 56px | 右 | 固定列，tabular |
| 模型（名称 + 厂商小字） | 220px 起 | 左 | 固定列 |
| 综合分（Intelligence Index） | 120px | 右 | 默认排序列，唯一加粗 |
| 输入价格 | 110px | 右 | 标题保持“价格（单位待确认）” |
| 输出价格 | 110px | 右 | 同上 |
| 输出速度（TPS） | 120px | 右 | 1 位小数 |
| 首字延迟（TTFT，秒） | 120px | 右 | 2 位小数 |

厂商从“Creator”单列合并为名称下方的小字，减少一列宽度。这是相对方案 4.4 的调整（已确认）。

### 7.4 页面结构

- 页面外边距：沿用主题容器，移动端 `px-4`，桌面端不额外加宽。
- 页头与工具条之间 `mt-8`；工具条与表格之间 `mt-4`。
- 表格外层 `overflow-x-auto`，并设置 `-mx-4 px-4 lg:mx-0 lg:px-0`，避免页面级横向滚动。

## 8. 交互与状态

- **排序**：点击排序按钮或表头，结果一致。切换时表格直接重排，不做位移动画。`aria-sort` 同步更新。
- **搜索**：输入即过滤（100 行，客户端 `useMemo` 即可，不需要防抖）。无结果时显示“没有匹配的模型”与清空按钮。
- **厂商下拉**：选项从数据中生成，首项为“全部厂商”。
- **URL 状态**：`?sort=intelligence|price|speed|ttft`、`?q=`、`?vendor=`；`?board=intelligence` 为未来类别预留。使用 `router.replace` 更新，不产生历史记录。
- **展开（小屏）**：`Disclosure`，展开时背景 `transition-colors duration-200`，动画遵守 `motion-reduce`。
- **过期**：超过 36 小时，页头显示提示条，不隐藏数据。
- **空数据与读取失败**：按方案 4.3 显示占位状态，`noindex`。

## 9. 数字格式

| 指标 | 格式 | 空值 |
| --- | --- | --- |
| 综合分 | 1 位小数 | “—”，`title="未测量"`，`aria-label="未测量"` |
| 价格 | 2 位小数，单位待确认 | 同上 |
| 输出速度（TPS） | 1 位小数 | 同上 |
| 首字延迟（秒） | 2 位小数 | 同上 |

`null` 不显示为 0。`Rank` 为整数。

## 10. 验收清单

- [ ] 375px、768px、1024px、1440px 视口各检查一次；无页面级横向滚动。
- [ ] 1024px（宽屏、侧边栏可见或隐藏）下表格可读，首列固定可见。
- [ ] 亮色与暗色模式各检查一次；正文、次要文字、前 5 名高亮对比度符合第 5 节。
- [ ] 键盘可完成全部操作：Tab 顺序与视觉顺序一致；排序按钮可用空格或回车触发；焦点环可见。
- [ ] 屏幕阅读器读出表格 caption、列名与 `aria-sort`。
- [ ] `prefers-reduced-motion` 下无位移动画。
- [ ] 200% 缩放下内容不被截断。
- [ ] 数字列对齐，排序切换时没有列宽抖动。
- [ ] 无 emoji 用作图标。

## 11. 已确认的决定

1. 榜单页隐藏右侧边栏（方案 A）。实施时需验证能否通过页面 props 注入 `fullWidth`。
2. 窄屏卡片与宽屏表格的切换点为 `lg`（960px）。
3. 厂商合并到名称下方的小字，不单列。

剩余实施前验证项：`fullWidth` 注入方式；其余主题的 `LayoutBase` 是否渲染 `children`；第 5 节对比度数值用工具复核。

## 12. 验证结果与实施偏差

验证结果：
- `LayoutBase` 渲染 `children`：已核对 27 个主题（`themes/*/index.js`），全部渲染。
- `fullWidth` 注入：`_app.js` 把 `pageProps` 展开给 `GlobalContextProvider`，已改为 `post?.fullWidth ?? pageFullWidth ?? false`（`lib/global.js`）。
- 对比度：用脚本计算 WCAG 比值，第 5 节数值成立；`body-secondary`（2.93）、`secondary`（2.29）、白字压 `warning`（1.67）不用于文字。

实施偏差（相对本文档）：
- 厂商下拉改用原生 `<select>`，不用 Listbox（读屏与移动端更稳定）。
- 小屏卡片展开使用原生 `<details>`，不用 Disclosure。
- “价格”排序按输入价格升序，空值排最后。
- 页面结构：状态组件 `LeaderboardBoard.js` 负责排序、搜索、厂商与 URL 同步；`shared.js` 放共享的焦点样式与指标渲染。
- 来源名称、来源链接、许可声明改为配置项（`LEADERBOARD_SOURCE_NAME`、`LEADERBOARD_SOURCE_URL`、`LEADERBOARD_LICENSE_NOTICE`），链接与许可文本未提供时不显示。
- 未实现：导航入口随开关显示/隐藏（见实施记录）。

## 13. 实施记录（第二轮）

- 导航入口：开关开启时，`getSiteDataByPageId` 在 Notion 菜单末尾追加指向 `/leaderboard` 的项（`lib/db/leaderboard/menu.js`）。名称由 `LEADERBOARD_MENU_NAME` 配置，默认“榜单”。已有指向该路径的菜单项则不重复添加；开关关闭时不移除手动添加的入口。站点数据有缓存，切换开关需等待缓存刷新。
- 布局修正：`_app.js` 已用主题的 `LayoutBase`（GLayout）包裹所有页面，因此榜单页不再使用 `DynamicLayout`，只输出内容。第一轮用 `DynamicLayout` 套了两层布局，客户端水合后整个页面子树被丢弃，表现为空白页。
- 主题颜色覆盖：`themes/simple/style.js` 把 `bg-primary`、`text-primary` 等覆盖为主题红色 `#dd3333`，白字对比度约 4.2:1，不满足文字要求。因此文字与选中态改用中性色（`dark`、`gray`），`primary` 只用于左侧高亮条与焦点环等非文字强调。
- 暗色模式：主题还会改写 `bg-white`、`bg-black` 等工具类在暗色下的映射。固定列背景与选中态因此改用 `gray-950`、`gray-100` 等颜色；个别细节（选中芯片与固定列的底色）仍会受主题影响，属于已知的主题相关表现。
- 页面标题：`components/SEO.js` 增加 `/leaderboard` 分支，标题为“站点名 | 榜单”，避免显示默认的 `loading` 文案。
- 视觉验收（开发预览，固定假数据，已删除预览页）：桌面亮色、桌面暗色、移动端卡片视图均已检查。移动端无横向滚动。
- 价格单位：确认为美元 / 百万 tokens，列标题与卡片标签已更新，不再显示“单位待确认”。
- 署名：页脚署名默认隐藏，由 `LEADERBOARD_SHOW_ATTRIBUTION`（默认 `false`）控制。页面标题与简介中的“国内MIT”仍保留，它们是页面主题而非页脚署名。
- 未验证：真实 Notion 数据读取（需在部署环境配置 `LEADERBOARD_TABLE_URL`）；ISR 再生成与紧急下线；`yarn build`。
