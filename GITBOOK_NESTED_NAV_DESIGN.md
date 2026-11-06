# gitbook 二级目录导航：需求与设计（方案2，未实现）

> Written for：后续实现该功能的开发者（你本人或协作者）。
> 状态：**已实现一版（仅本地，未提交、未部署）**。决策见第 12 节，实现记录见第 14 节。

---

## 1. 背景与现状

gitbook 左侧导航当前只支持一级分类，代码位置如下：

| 位置 | 现状 |
|---|---|
| [NavPostList.js](themes/gitbook/components/NavPostList.js) `groupArticles` | 按 `category` 单层分组，结果是扁平的 `groups` 数组 |
| [NavPostList.js](themes/gitbook/components/NavPostList.js) `getDefaultOpenIndexByPath` | 只找到包含当前文章的那一个一级分组的索引 |
| [NavPostItem.js](themes/gitbook/components/NavPostItem.js) | 单层折叠渲染：一个分类标题 + 文章列表 |
| [pages/[prefix]/[slug]/[...suffix].js](pages/[prefix]/[slug]/[...suffix].js) | URL 支持多段路径，但导航不显示层级 |
| [pages/category/[category]/index.js](pages/category/[category]/index.js) | 分类页为单段路由，分类名不能含 `/` |

限制：
- `category` 是 Notion 单选，值为完整字符串。`一级 > 二级` 当前会被显示成一个名为 `一级 > 二级` 的扁平文件夹。
- 不能使用 `/` 作为分隔符，否则分类页路由失效。

---

## 2. 目标

| 编号 | 目标 |
|---|---|
| G1 | 左侧导航支持二级目录：`一级 > 二级` 显示为一级文件夹下的二级文件夹，可折叠。 |
| G2 | 对不含分隔符的扁平分类（方案1的数据）保持完全兼容，显示与改动前一致。 |
| G3 | PC 侧栏与移动端抽屉（PageNavDrawer）使用同一套逻辑，显示一致。 |
| G4 | 当前文章所在的整条路径（一级、二级）自动展开。 |
| G5 | "最新文章"红点在折叠的父级文件夹上也要显示。 |
| G6 | 不修改 URL、不修改 Notion 数据库结构（不新增属性）、不影响其它主题。 |

## 3. 非目标

- 不实现五级及以上目录（最大层级由 `GITBOOK_NAV_MAX_DEPTH` 控制，默认 4，见第 7 节）。
- 不把搜索结果改为树形，搜索仍为平铺列表。
- 不新增 Notion 属性。不改变 `slug` 的生成规则。

---

## 4. 数据约定

与 [DOCS_CONTENT_SPEC.md](DOCS_CONTENT_SPEC.md) 保持一致：

- 分隔符：` > `（`>` 两侧各一个空格）。解析时对每段做 `trim`，所以无空格的 `>` 也能解析。
- 解析规则：`"一级 > 二级".split(分隔符).map(s => s.trim()).filter(Boolean)`。
- 超过最大层级（`GITBOOK_NAV_MAX_DEPTH`）的部分：并入最后一级的名称，并在开发环境打印一次 `console.warn`。
- 分隔符为可配置项（第 7 节），但**不得为 `/`**，实现时需要校验并回退到默认值。

---

## 5. 算法与渲染规范

### 5.1 构建树（替代 `groupArticles`）

输入：`filteredNavPages`（保持 Notion 顺序）。输出：根节点的有序 `entries`。

```text
节点 = { name, entries: [], id }
entries 元素 = { type: 'folder', node } 或 { type: 'post', post }

buildNavTree(posts):
  root = 节点(name='')
  for post in posts（按顺序）:
    segments = 解析(post.category)            // 无分类则为 []
    if segments 为空:
      把 post 归入 root 下的"无名组"（与现状一致，首次出现时创建）
      continue
    node = root
    for seg in segments:
      child = node.entries 中 name==seg 的 folder（不存在则在末尾创建）
      node = child
    node.entries 末尾追加 { type:'post', post }
```

要点：
- 文件夹与平铺文章按**首次出现的位置**插入 `entries`，与现状（`groups` 按首次出现排列）一致。
- 同名文件夹在同一父节点下合并（与现状 `AUTO_SORT` 的行为一致）。
- 无分类文章归入其所在层级的一个"无名组"，渲染为平铺文章，位置为首次出现的位置。

### 5.2 渲染

- `NavPostItem` 改为递归组件：文件夹渲染为可折叠标题，子 `entries` 递归渲染。
- 层级缩进沿用现有的 `ml-3 border-l` 样式，每层增加一次缩进。
- 文件夹标题样式与现有一级标题一致；二级标题可使用更小的字号或更浅的字重，需视觉确认。

### 5.3 展开与收起

- 点击文件夹：展开或收起该文件夹。
- `GITBOOK_EXCLUSIVE_COLLAPSE`：作用于**同一父节点下的兄弟文件夹**（即同一层级互斥）。点击某个文件夹展开时，同级其它文件夹及其子孙会被收起（与原有行为一致）。
- 路由变化时，展开**当前文章所在的整条路径**（替代 `getDefaultOpenIndexByPath`，返回祖先节点 id 的列表）。找不到当前文章时，展开第一个一级文件夹。
- `GITBOOK_FOLDER_HOVER_EXPAND`：对所有层级生效。

### 5.4 红点（最新文章）

- 文件夹收起时，若其任一后代文章 `isLatest`，显示红点（与现有 `groupHasLatest` 逻辑一致，递归判断）。

---

## 6. 交互与一致性

- PC 侧栏与移动端抽屉（PageNavDrawer）复用同一个 `NavPostList` 与 `NavPostItem`，不分叉实现。
- 无障碍：文件夹标题使用 `aria-expanded` 标示展开状态（建议，实现时确认）。
- 搜索：搜索结果仍为平铺列表。建议每条结果显示 `一级 > 二级` 作为副标题（待确认，见第 10 节）。

---

## 7. 配置项（新增）

在 [themes/gitbook/config.js](themes/gitbook/config.js) 中新增，读取方式与现有 `GITBOOK_*` 一致（`siteConfig(key, default, CONFIG)`），因此可在 Notion Config 表中覆盖：

| 配置名 | 默认值 | 说明 |
|---|---|---|
| `GITBOOK_CATEGORY_SEPARATOR` | `>` | 分类层级分隔符。不得为 `/`。 |
| `GITBOOK_NAV_MAX_DEPTH` | `4` | 导航最大层级。超出部分并入最后一级名称。 |

---

## 8. 涉及文件（预计）

| 文件 | 改动 |
|---|---|
| `themes/gitbook/components/NavPostList.js` | `groupArticles` → `buildNavTree`；`getDefaultOpenIndexByPath` → 祖先路径集合 |
| `themes/gitbook/components/NavPostItem.js` | 递归渲染 |
| `themes/gitbook/config.js` | 新增两个配置项 |
| `themes/gitbook/components/PageNavDrawer.js` | 如需传递新参数则改动，否则不动 |
| `__tests__/` | 新增 `buildNavTree` 与祖先路径的单元测试 |
| 文档 | 按 [DOCUMENTATION_POLICY](docs/DOCUMENTATION_POLICY.md) 同步更新 gitbook 主题说明（`docs/user-guide/themes/gitbook.md`） |

预计改动规模：约 150–250 行，集中在 gitbook 主题内，不影响其它主题。

---

## 9. 测试与验收

### 9.1 单元测试

| 用例 | 期望 |
|---|---|
| 全部为扁平分类（无 `>`） | 结果与现状 `groupArticles` 的分组一致 |
| 两级分类 `A > B` | `A` 为根下文件夹，`B` 为 `A` 下的文件夹 |
| 一级与两级混合（`A`、`A > B`） | `A` 下既有直接文章也有子文件夹 |
| 无分类文章 | 归入无名组，平铺，位置正确 |
| 首尾与中间空格不同（`A>B`、`A > B`、` A >  B `） | 解析为同一路径 |
| 超过最大层级 | 超出部分并入最后一级，仅一次告警 |
| 分隔符配置为 `/` | 回退到默认 `>`，并告警 |
| 祖先路径展开 | 当前文章所在的一级、二级全部展开 |
| 红点冒泡 | 收起的一级文件夹在后代有 `isLatest` 时显示红点 |

### 9.2 人工验收（使用方案1录入的样例文档库）

- [ ] 一级文件夹数量、名称、顺序与 Notion 视图一致。
- [ ] 二级文件夹在对应一级下，文章归属正确。
- [ ] 点击展开与收起正常；同级互斥生效（`GITBOOK_EXCLUSIVE_COLLAPSE = true` 时）。
- [ ] 打开某篇二级文章，其一级、二级自动展开。
- [ ] 移动端抽屉显示一致。
- [ ] 搜索结果正常显示。
- [ ] 红点显示正确。

### 9.3 回归

- [ ] 主站 `lunalight.top`（heo）不受影响。
- [ ] 扁平分类的文档站显示与改动前一致（改动前后截图对比）。
- [ ] `yarn build` 通过，lint 通过。

---

## 10. 风险

| 风险 | 缓解 |
|---|---|
| 分类名写法不一致（如 `A>B` 与 `A > B`）导致拆成两棵树 | `trim` 解析；规划表与录入检查（见 DOCS_CONTENT_SPEC.md） |
| 嵌套折叠的高度动画（`Collapse`）计算错误 | 增加手工验收用例；必要时调整 `onHeightChange` |
| Notion 选项名中的 ` > ` 无法保存或被转义 | 上线前在文档库中实测一次（见 DOCS_CONTENT_SPEC.md 第 7 节） |
| `/category` 索引页显示完整分类名（如 `快速开始 > 安装`） | 见开放问题 2 |

---

## 11. 实施步骤（启动后执行）

1. 确认第 12 节的开放问题。
2. 按 DOCS_CONTENT_SPEC.md 录入样例文档库，并完成第 3 节的检查。
3. 实现 `buildNavTree` 与解析函数，补充单元测试。
4. 改造 `NavPostItem` 为递归渲染；改造祖先路径展开逻辑。
5. 在预览环境部署并完成第 9.2 节的人工验收。
6. 更新 gitbook 主题文档，提交。

---

## 12. 决策（已确认，2026-11-05）

1. **分隔符**：` > `（`>`，两侧各一个空格；解析时去空格）。
2. **`/category` 索引页**：只列一级分类，数量为其下所有分类（含二级及以下）的文章数之和。点击一级仍进入 `/category/一级名`，该页包含所有子分类的文章（沿用原有 `includes` 匹配）。
3. **搜索结果**（简单方案）：搜索时改为平铺列表，每条文章上方显示完整分类路径（如 `快速开始 > 安装`）。
4. **最大层级**：4 级。超出部分并入第四级名称。
5. **Hover 展开**（简单方案）：`GITBOOK_FOLDER_HOVER_EXPAND` 对所有层级生效，与原开关行为一致。

---

## 13. 启动条件

- 方案1的样例文档已录入完成，并通过 DOCS_CONTENT_SPEC.md 第 6 节检查清单。
- 第 12 节的开放问题已确认。
- Notion 中 ` > ` 分类名已实测可正常保存。

---

## 14. 实现记录（一版，2026-11-05）

| 文件 | 内容 |
|---|---|
| [themes/gitbook/navTree.js](themes/gitbook/navTree.js) | 纯函数：分隔符与层级校验、`parseCategory`、`buildNavTree`、`findActiveFolderIds`、`collectFolderIds`、`hasLatestPost`、`summarizeTopLevel` |
| [themes/gitbook/components/NavPostList.js](themes/gitbook/components/NavPostList.js) | 使用树结构；展开状态改为文件夹 id 列表；排他折叠；搜索时平铺显示分类路径 |
| [themes/gitbook/components/NavPostItem.js](themes/gitbook/components/NavPostItem.js) | 递归渲染文件夹；无名组渲染为平铺文章；红点沿子孙冒泡 |
| [themes/gitbook/config.js](themes/gitbook/config.js) | 新增 `GITBOOK_CATEGORY_SEPARATOR`（默认 `>`）、`GITBOOK_NAV_MAX_DEPTH`（默认 4） |
| [themes/gitbook/index.js](themes/gitbook/index.js) | `LayoutCategoryIndex` 只列一级分类 |
| [__tests__/themes/gitbook/navTree.test.js](__tests__/themes/gitbook/navTree.test.js) | 单元测试，覆盖解析、建树、祖先路径、分类汇总 |

与原实现的差异：
- 排他折叠：点击同级文件夹会收起当前文章所在的路径（与原行为一致）。路由变化时会重新展开当前路径。
- 无分类文章：仍归入一个无名组，位置为首次出现的位置（与原行为一致）。
- 找不到当前文章时，默认展开第一个一级文件夹（原实现展开索引 0，可能是无名组）。

待验证：
- Notion 中 ` > ` 分类名的保存与显示（见 DOCS_CONTENT_SPEC.md 第 7 节）。
- 样例文档库的端到端显示（需部署预览或本地构建后人工检查）。
