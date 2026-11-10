# 榜单页面方案（NotionNext 侧）

- 日期：2026-11-10
- 状态：方案草案，未实现
- 范围：NotionNext 如何展示 NotionBlog 同步到 Notion 派生表的国内MIT 榜单 Top 100
- 上游：[NotionBlog 接入方案](../../../NotionBlog/docs/plans/2026-11-10-artificial-analysis-leaderboard.md)（数据获取、许可与署名、派生表字段均以该文档为准）

## 1. 结论

1. 合并为一期交付：说明页与表格同期完成，共用同一个页面与读取层。前置条件是 NotionBlog 派生表已写入并核对字段（见第 6 节 Phase 0）。
2. **读取方式沿用文章的通道。** 榜单库与文章一样，通过 NotionNext 现有的 `fetchNotionPageBlocks`（`lib/db/notion/getPostBlocks.js`，基于 `notion-client`，已有缓存与限流）直接读取库页面。不新增 SDK、不写 REST 封装、不新建 integration。
3. **不需要读库凭据。** 榜单库已分享到网页，与文章一样公开读取，不使用 `NOTION_TOKEN_V2`（`conf/notion.config.js` 中的可选项，只在库不公开时需要），也不使用 `NOTION_TOKEN`（评论插件的 integration 凭据），不新建。
4. **榜单库位于 Notion 配置中心下，已分享到网页，页面状态设为 `Invisible`。** 与文章相同，公开读取无需 key。`Invisible` 对应 `conf/notion.config.js` 中的 `NEXT_PUBLIC_NOTION_PROPERTY_STATUS_INVISIBLE`，表示隐藏发布，不出现在文章列表中。暂时保持该状态。
5. **榜单数据会出现在页面源码中。** Next.js 会把 `getStaticProps` 的返回值写入页面的 `__NEXT_DATA__`，与文章内容的公开程度相同。
6. **配置放在 Notion 配置页。** 榜单库链接 `LEADERBOARD_TABLE_URL`、开关 `LEADERBOARD_ENABLE` 与其他配置项一样，写在 Notion 的 CONFIG 配置表中。优先级沿用项目规则：Notion 配置表 > 环境变量 > `blog.config.js`。
7. 页面默认关闭，由 `LEADERBOARD_ENABLE` 控制；关闭时路由返回 404。

## 2. 对 NotionBlog 方案建议的处理

| NotionBlog 方案中的建议 | NotionNext 侧处理 | 说明 |
| --- | --- | --- |
| Phase 2 先做说明页，不显示数字 | 不采纳 | 授权已不是阻塞项，说明页与表格合并为一期交付 |
| 公开表格须书面授权 | 不采纳 | 国内MIT 为 MIT 许可，无需书面授权，保留署名与许可声明即可。表格与说明页同期交付，前提是字段核对完成 |
| 新路由放 `pages/`，组件放 `components/`，样式跟随主题 | 采纳 | 新增 `pages/leaderboard/index.js` |
| 参考 `pages/dashboard` 的数据加载方式 | 部分采纳 | `dashboard` 通过 `resolvePostProps` 读取文章，榜单需要另写读取层；只沿用 `getStaticProps` + `revalidate` 的写法 |
| ISR 每日刷新（`revalidate: 86400`） | 采纳，附条件 | 静态导出模式（`EXPORT`）下 `revalidate` 无效，榜单只随构建更新 |
| 展示 `generated_at`、`limit` 类元信息 | 采纳 | 页头显示 `Synced At` 与 `Index Version` |
| 不用 iframe，不抓取网页 | 采纳 | 无变化 |
| LiveBench / Epoch 的表格、成本视图、高亮 | 采纳 | 设计细节见 NotionBlog 方案第 6 节 |

## 3. 现状（已核对）

- 框架：Next.js 15（`package.json` 中为 `^15.5.24`），包管理使用 yarn（有 `yarn.lock`），`jest.config.js` 与 `__tests__/` 已存在。
- 路由：`pages/[prefix]/[slug]` 是文章动态路由。已有两个非文章页面 `pages/dashboard/[[...index]].js` 与 `pages/archive/index.js`，都用 `DynamicLayout` + `getStaticProps`，可作为参照。
- 主题布局：`DynamicLayout` 按 `layoutName` 查找主题布局，找不到时回退到其他主题（`themes/theme.js` 的 `resolveThemeLayout`）。`LayoutDashboard` 只存在于 4 个主题中，新增布局名需要验证回退效果。
- 配置：`conf/*.config.js` 由 `blog.config.js` 合并。开关写法参考 `conf/post.config.js` 中的 `ORIGINALITY_PROOF_*`。
- Notion 访问：文章内容通过 `notion-client` 读取，`fetchNotionPageBlocks` 为统一入口；`NOTION_TOKEN_V2` 为可选项，用于读取私有页面（`conf/notion.config.js`）。评论插件（`pages/api/notion-comments.js`）通过 `@notionhq/client` 写入，使用 `NOTION_TOKEN`，与读取无关。
- 配置表：`lib/db/notion/getNotionConfig.js` 读取 CONFIG 页中的配置数据库，其中已有用 `notion-utils`（`getTextContent`、`getDateValue`）解析数据库行的先例，榜单库可沿用。
- 工作区：`themes/heo/components/PostHeader.js` 与 `themes/heo/config.js` 有未提交改动，与本方案无关。实施时不要把它们混入榜单相关提交。

## 4. 设计

### 4.1 路由与开关

- 路由：`/leaderboard`，文件 `pages/leaderboard/index.js`。
- 静态路由优先于 `[prefix]` 动态路由，所以不会被文章路由覆盖。但若 Notion 中已有 slug 为 `leaderboard` 的文章，会被遮蔽，发布前需检查。
- 配置：配置项写在 Notion CONFIG 表中（见第 1 节第 6 条）。`conf/leaderboard.config.js` 只保留默认值，经 `blog.config.js` 合并。

配置项（与其他配置一样，在 Notion 配置页中填写）：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `LEADERBOARD_ENABLE` | `false` | 开关；关闭时路由返回 404 |
| `LEADERBOARD_TABLE_URL` | 空 | 榜单库（配置中心下的子页面，已分享到网页）的 Notion 链接，形如 `https://www.notion.so/…-<32位页面ID>`；页面 ID 由 `notion-utils` 的 `parsePageId` 解析 |
| `LEADERBOARD_REVALIDATE_SECOND` | `86400` | ISR 刷新间隔（秒） |

读取方式示意（与 `dashboard` 相同，`NOTION_CONFIG` 来自全局数据）：

```js
const enable = siteConfig('LEADERBOARD_ENABLE', false, NOTION_CONFIG)
const tableUrl = siteConfig('LEADERBOARD_TABLE_URL', '', NOTION_CONFIG)
```

- 不需要新的环境变量，也不需要读库凭据（库已分享到网页）。

### 4.2 读取层

- 文件：
  - `lib/db/leaderboard/getLeaderboardRows.js`：用 `parsePageId(LEADERBOARD_TABLE_URL)` 得到页面 ID，调用 `fetchNotionPageBlocks(pageId, 'leaderboard')`，从返回的 `collection` / `collection_query` 中取行。
  - `lib/db/leaderboard/mapping.js`：纯函数，负责属性解析（用 `notion-utils` 的 `getTextContent`、`getDateValue`）、`null` 保持为空值（不转为 0）、Rank 校验。纯函数用 jest 单测，不需要真实 Notion。
- 过滤与排序在代码中完成，不依赖 Notion 视图的筛选设置：只保留 `Active` 为 true 的行，再按 `Rank` 升序。
- 实施时必须验证：`collection_query` 能返回全部 100 行，没有被默认视图截断。若被截断，改用 notion-client 的 `getCollectionData` 并指定 `limit`。
- 字段与 NotionBlog 第 5 节一致：`Name`（title）、`Rank`、`Creator`、`Intelligence Index`、`Input Price`、`Output Price`、`Median Output TPS`、`Median TTFT (s)`、`AA Model ID`、`Index Version`、`Active`、`Synced At`。属性名从 Notion 库的 schema 读取，并与 `mapping.js` 中的常量对齐。
- 校验（建议值）：
  - Rank 应为 1 到 N 的连续整数，否则视为异常；
  - `Synced At` 距今超过 36 小时，页头显示“数据可能过期”；
  - 行数为 0 时显示占位状态。
- 价格列标题保持“价格（单位待确认）”，直到国内MIT 确认单位。

### 4.3 缓存与失败策略

- 正常路径：`getStaticProps` 读取派生表（`fetchNotionPageBlocks` 已带缓存），`revalidate` 取 `LEADERBOARD_REVALIDATE_SECOND`（默认 86400）。
- ISR 再生成失败：`getStaticProps` 抛错，Next.js 保留上一次成功生成的页面（实施时用当前 Next 版本验证）。
- 构建期读取失败：不让整站构建失败。渲染占位状态“数据暂不可用”，`revalidate` 设为 300 秒，页面加 `noindex`。这是建议方案，待确认（见第 8 节）。
- 静态导出（`EXPORT`）：`revalidate` 不生效，榜单只在构建时更新。与 `dashboard` 相同，需在部署说明中写明。
- 紧急下线：先关闭 `LEADERBOARD_ENABLE` 并重新部署，`getStaticProps` 返回 `notFound`。若要立即生效，可调用已有的 `pages/api/revalidate.js` 刷新该路径（实施时确认它能否指定路径）。

### 4.4 页面内容

说明页内容：

- 标题、一段介绍（这是什么、数据来自哪、更新频率）；
- 署名：`Source: 国内MIT`，附 MIT 许可声明，来源链接待补充；
- 导流：国内MIT 榜单外链（链接待补充）；
- 不含 Notion 库中的任何数字或模型名。

表格内容：

- 列：Rank、Name、Creator、Intelligence Index、Input/Output Price、Median Output TPS、Median TTFT；默认按 Rank 排序；
- 交互：按综合分、价格、速度排序；前 5 名高亮；可按厂商过滤；
- 页头：`Index Version`、`Synced At`；页脚：署名、许可声明与来源链接；
- 撤销：开关关闭即可下线（见 4.3）。

### 4.5 文件布局（拟定）

```
conf/leaderboard.config.js                  默认值（配置主要在 Notion 配置页）
pages/leaderboard/index.js                  路由、getStaticProps（读取派生表）
components/Leaderboard/LeaderboardIntro.js  说明页内容
components/Leaderboard/LeaderboardTable.js  表格（排序用客户端状态）
components/Leaderboard/SortChips.js         排序按钮（综合分、价格、速度、首字延迟）
components/Leaderboard/FilterBar.js         搜索框与厂商下拉
components/Leaderboard/LeaderboardCards.js  小屏卡片视图
components/Leaderboard/Attribution.js       署名，两期共用
lib/db/leaderboard/getLeaderboardRows.js    读库页面、取行
lib/db/leaderboard/mapping.js               属性解析与校验，纯函数
__tests__/leaderboard/mapping.test.js       单测
```

### 4.6 布局回退

- 页面使用 `DynamicLayout`。实施前需确认 `LayoutBase` 是否会渲染 `children`。
- 若不渲染，改用主题中已有的通用布局（如 `LayoutArchive`），并把内容通过 props 传入。
- 实施前抽样检查几个主题（包括默认主题）的布局文件，确认回退结果。

### 4.7 参考项目与 UI 融合

参考项目（2026-11-10 核对）：

| 项目 | 可借鉴 | 不采用 | 许可 |
| --- | --- | --- | --- |
| [EvanZhouDev/ai-model-index](https://github.com/EvanZhouDev/ai-model-index) | 多榜单按类别切换（`aa-intelligence`、`aa-coding`、`aa-math`、`gpqa` 等）；每个榜单只保留前 30；payload 内附 `generated_at`、`limit`、`source`（名称与链接）；刷新避开整点（07:17 UTC）。字段名（如 `artificial_analysis_coding_index`、`artificial_analysis_math_index`）可直接用于类别扩展 | 以公开 JSON（`raw.githubusercontent.com`）分发派生榜单，不在本方案范围内（本方案只做页面渲染，不提供数据下载）。仓库内没有前端（只有 `src/sync.mjs`、`data/`、workflow），UI 无可参考 | 仓库未声明许可证，只参考结构，不复制代码 |
| [Leev1s/aa-mcp](https://github.com/Leev1s/aa-mcp) | 排序键设计（`intelligence`、`price`、`speed`、`ttft`、`coding`、`math`）；快照 diff 的“最近变化”；分数变化低于 0.01 视为噪声 | MCP 工具形态 | MIT，可参考设计；本方案不计划复用代码 |
| [Open LLM Leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard)（Hugging Face Space） | 综合分（平均分）为默认排序、分项为次要列；类型、精度、参数规模作过滤；按名称搜索 | 无 | **未核实。** 本机无法访问 huggingface.co，下述信息来自记忆，需打开 Space 复核 |

UI 规格：

**信息层级**
- 首屏顺序：页头（标题、一句话说明、`Synced At`、`Index Version`）→ 排序与搜索条 → 表格。
- 综合分（Intelligence Index）是唯一主指标，加粗并使用主题强调色；其余指标为次要列，灰色小字。
- 前 5 名高亮（见 NotionBlog 方案）。第 1–3 名使用数字徽标，不用 emoji，避免与主题风格冲突。

**排序与过滤**
- 排序按钮（借鉴 aa-mcp 的排序键）：综合分（默认）、价格、输出速度、首字延迟。点击表头与按钮的结果一致。
- 搜索框：按模型名与厂商过滤。Top 100 数据量小，在客户端完成。
- 厂商下拉：选项从数据中生成，不硬编码。
- 类别切换（借鉴 ai-model-index）：一期只有综合智能一个榜单。URL 预留 `?board=intelligence` 参数，将来有编码、数学数据时再开启。这需要 NotionBlog 增加对应列（见第 8 节）。

**表格**
- 可排序表头使用 `<button>`，并设置 `aria-sort`；表格带 `<caption>`，便于屏幕阅读器使用。
- 空值显示“—”，悬停提示“未测量”，与 NotionBlog 中 `null` 的语义一致；不显示 0。
- 价格列标题保持“价格（单位待确认）”，确认单位后再改。
- 首列（Rank + 名称）固定，横向滚动时仍可见。
- 小屏（低于 `md` 断点）切换为卡片列表：默认显示 Rank、名称、厂商、综合分；点击展开其余指标。

**数字格式**（建议值，实施时可调整）
- 综合分保留 1 位小数；价格保留 2 位小数；输出速度保留 1 位小数；首字延迟保留 2 位小数（单位：秒）。

**状态**
- 静态页直接渲染，不需要加载态；排序与过滤在客户端即时完成。
- 数据超过 36 小时未更新：页头显示黄色提示条“数据可能不是最新”。
- 无数据或读取失败：显示第 4.3 节的占位状态。

**视觉**
- 使用 Tailwind 3.4（NotionNext 已在使用），颜色取主题已有的 CSS 变量和 `dark:` 类，不引入新色板。
- 亮色与暗色模式都要验收。

**不做**
- 公开 JSON 分发（ai-model-index 的做法）。
- iframe 嵌入第三方页面。
- 复制参考仓库的代码。
- 图表：LiveBench 式的质量-成本散点图不在本期范围，等价格单位确认后再排期。

## 5. 验收

- 说明页：
  - 开关关闭时 `/leaderboard` 返回 404；
  - 开关开启后页面可访问，署名与外链正确；
  - `yarn build` 通过。
- 表格：
  - 单测覆盖 null 值、缺失列、Rank 不连续、分页；
  - `yarn build` 与 jest 通过；
  - 页面字段与派生表一致；
  - 关闭开关后页面下线（或经 revalidate 返回 404）。

## 6. 阶段计划

### Phase 0：前置确认

- [x] 确认 `LayoutBase` 是否渲染 `children`，并查明导航入口在哪里配置。（已确认：27 个主题均渲染；导航来自 Notion 菜单，开关开启时由 `lib/db/leaderboard/menu.js` 追加入口）
- [ ] 确认榜单库已“分享到网页”，页面状态为 `Invisible`。
- [ ] 确认榜单库位于配置中心下，链接已写入配置页的 `LEADERBOARD_TABLE_URL`。
- [ ] 确认国内MIT 的版权声明与来源链接（用于页面署名）。

### Phase 1：榜单页面（说明与表格，一期交付）

- [x] 新增 `conf/leaderboard.config.js`，`LEADERBOARD_ENABLE` 默认 `false`。
- [x] 新增 `pages/leaderboard/index.js` 与 `LeaderboardIntro.js`、`Attribution.js`。
- [x] 开关开启时显示导航入口。
- [ ] 在 Notion 配置页新增 `LEADERBOARD_ENABLE` 与 `LEADERBOARD_TABLE_URL`，验证 100 行完整读取。
- [x] 读取层 `lib/db/leaderboard/getLeaderboardRows.js` 与 `mapping.js`，附单测。
- [x] `LeaderboardTable.js`：排序、前 5 高亮、页头与页脚。
- [x] `SortChips.js`、`FilterBar.js`、`LeaderboardCards.js`：按第 4.7 节实现排序、搜索、小屏卡片。
- [x] 亮色与暗色模式、移动端宽度各验收一次（开发预览，固定假数据，见设计文档第 13 节）。
- [ ] 验证 ISR、失败策略、紧急下线。
- [ ] 按第 5 节验收。

## 7. 风险

| 风险 | 应对 |
| --- | --- |
| 未核对的数据进入 `__NEXT_DATA__`，提前暴露 | 派生表字段核对通过后再接入读取层；验收时查看源码 |
| 榜单库页面状态被改为可见，出现在文章列表或导航中 | 上线前检查状态为 `Invisible`；列为上线检查项 |

| `collection_query` 截断，行数不足 100 | 实施时验证行数；截断时改用 `getCollectionData` 指定 `limit` |
| 静态导出模式不自动刷新 | 部署说明中写明；需重新构建 |
| slug 冲突（文章 slug 为 `leaderboard`） | 发布前检查 Notion 文章 slug |
| 构建期 Notion 故障拖垮整站构建 | 占位状态策略（第 4.3 节） |
| NotionBlog 改了列名，NotionNext 读取失败 | 字段名集中在 `mapping.js`；两边改字段时同步更新 |
| 价格单位错误 | 确认前不标注单位 |
| 数据接口路径不一致：NotionBlog 用 `/api/v2/language/models/free`；ai-model-index 与 aa-mcp 都用 `/api/v2/data/llms/models` | NotionBlog 已成功写入 100 行，暂不视为故障。同步前做一次 dry-run 对比两个端点的字段与模型数，确认 `free` 端点为国内MIT 实际使用的路径；字段名以 `evaluations`、`model_creator` 为准，两边一致 |

## 8. 待确认

1. 公开读取：榜单库已分享到网页、页面状态 `Invisible`，读取不需要凭据。需在部署环境中实际验证可读取。
2. 构建期读取失败：占位状态（建议）还是让构建失败。
3. `LayoutBase` 渲染方式与导航入口位置（实施时确认）。
4. 是否启用广告组件（与 NotionBlog 方案第 9 节相同）。
5. 国内MIT 的版权声明文本与来源链接，用于页面署名。
6. 价格字段的币种与单位。
7. 数据接口核对：NotionBlog 用 `/api/v2/language/models/free`，两个参考项目用 `/api/v2/data/llms/models`。需要做一次 dry-run 对比后确定（见第 7 节风险）。
8. 是否增加编码、数学等类别列（类别切换）。需要修改 NotionBlog 派生表结构。
