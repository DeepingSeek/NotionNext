# 文档站配置手册：docs.lunalight.top（gitbook）

- 目标：主站 `https://lunalight.top` 保持 heo 主题不变；新增 `https://docs.lunalight.top` 使用 gitbook 主题。
- 方式：一个 Vercel 项目、一次部署；内容仍然来自 Notion。
- 前置：[DOMAIN_MIGRATION.md](DOMAIN_MIGRATION.md) 中 `lunalight.top` 已在 Vercel 验证通过（阶段 A 完成）。
- 代码改动：[next.config.js](next.config.js) 中的 `LOCALE_DOMAINS`（仅当 `NOTION_PAGE_ID` 含 `docs:` 前缀时生效）。
- **执行顺序**：第 4 步（推送代码）→ 第 6.1 步（Vercel 添加域名，取 CNAME）→ 第 6.2 步（Spaceship 添加 DNS）→ 第 5 步（修改 `NOTION_PAGE_ID`）→ 第 7 步（重新部署）→ 第 8 步（验证）。

---

## 0. 原理与最终结构

```text
同一个 Vercel 项目、同一次构建
├─ lunalight.top / www.lunalight.top  → 默认语言 → 主库（heo 主题）
└─ docs.lunalight.top                 → docs 语言 → 文档库（gitbook 主题）

NOTION_PAGE_ID = 32d70d5879c883dfbadc81e39bca06f0,docs:6e670d5879c8839d844901b7745ea333
主库 Notion Config 表：THEME = heo
文档库 Notion Config 表：THEME = gitbook，LINK = https://docs.lunalight.top
```

要点：
- `docs:` 前缀会被识别为一种语言（locale），`next.config.js` 把 `docs` 绑定到 `docs.lunalight.top`。
- 每个数据库的主题由它自己的 Notion Config 表决定，所以两个站可以用不同主题。
- 前缀必须是小写 `docs`，与 `next.config.js` 中 `LOCALE_DOMAINS` 的 key 一致。改用其它前缀时两处都要改。

---

## 1. 开始前检查

- [ ] `lunalight.top` 已在 Vercel 显示 Valid Configuration。
- [ ] 确认线上 `NOTION_PAGE_ID` 已设置，并取得主库 ID（以及英文库 ID，如果有）。
  - Vercel 把 `NOTION_PAGE_ID` 设为 Sensitive 变量（列表里是锁图标），创建后**无法再看到明文**，列表里没有值是正常现象。
  - 判断是否已设置：打开你的主站，如果显示的是你自己的博客内容，说明已设置。如果变量为空，代码会回落到 `blog.config.js` 里的官方演示库，显示的是演示内容。
  - 主库 ID 从 Notion 主库页面的地址取（方法同第 2 步第 4 条）。英文库 ID 同样从对应的 Notion 页面取。
  - 注意：`blog.config.js` 的默认值是官方演示库，不是你的库，不要以它为准。
- [ ] `docs.lunalight.top` 没有绑定在其他 Vercel 项目上，DNS 中也没有旧记录。有的话先删除。
- [ ] 主库的 Notion Config 表存在（当前 heo 主题正在使用）。

---

## 2. 文档库（文章中心）

本手册使用的文档库是你已创建好的「文章中心」页面，**文档库 ID 为：**

```text
6e670d5879c8839d844901b7745ea333
```

该 ID 取自地址 `https://app.notion.com/p/6e670d5879c8839d844901b7745ea333?v=...`：紧跟在 `/p/` 后面的 32 位字符。`?v=` 后面的是视图 ID，不要用。

已确认 Share to web 已开启，公开地址为 `https://lapis-map-6df.notion.site/6e670d5879c8839d844901b7745ea333`（匿名访问返回 200）。

如果以后要重新创建文档库，可以按以下方式准备，并把新页面的 ID 替换到本手册和环境变量中：

1. 复制整个博客中心（官方模板 `https://www.notion.so/tanghh/287869a92e3d4d598cf366bd6994755e`，或你自己的博客中心），不要只复制配置页。
2. 把复制出来的页面改名，例如「文章中心」。
3. 右上角 **Share** → 开启 **Share to web**（与主库的分享设置保持一致，允许匿名读取）。这一步复制时不会自动带过去。
4. 页面 ID 的取法：地址形如 `https://www.notion.so/<空间名>/<标题>-<32位ID>?v=...` 或 `https://app.notion.com/p/<32位ID>?v=...`，取对应的 32 位字符，带不带横杠都可以。

---

## 3. 配置两个 Notion 库

### 3.1 文档库内容要求

属性名保持模板默认的英文小写，不要改成中文。改了就必须在环境变量里同步设置 `NEXT_PUBLIC_NOTION_PROPERTY_*`。

| 属性 | 要求 |
|---|---|
| `title` | 文章标题 |
| `slug` | 访问路径。文档首页必须有一篇 `slug` 为 `about` 的页面 |
| `type` | `Post`（文章）、`Page`（单页，如 about）、`Config`（配置页，只保留一个） |
| `status` | 要展示的内容设为 `Published`；`Invisible` 为隐藏发布；其它值不展示 |
| `category` | 决定左侧一级目录（gitbook 按分类分组） |
| `date` | 日期 |

- 至少建一篇 `slug=about`、`type=Page`、`status=Published` 的关于页，否则文档首页找不到。
- 文档库**根页面**的标题、描述、图标、封面，会作为 docs 站的站点标题、描述、头像和封面显示。

### 3.2 文档库 Config 表（写入 docs 站的配置）

打开文档库里 `type = Config` 的页面，在表格中按「配置名 / 配置值」添加：

| 配置名 | 配置值 | 是否必填 | 说明 |
|---|---|---|---|
| `THEME` | `gitbook` | **必填** | 不填会回落到 Vercel 环境变量 `NEXT_PUBLIC_THEME`，docs 站会变成 heo |
| `LINK` | `https://docs.lunalight.top` | **必填** | 不填时 canonical、sitemap 会用主站地址 |
| `AUTHOR` | 你的名字 | 建议 | 作者名 |
| `CONTACT_EMAIL` | 你的邮箱 | 建议 | 联系方式 |
| `GITBOOK_INDEX_PAGE` | `about` | 可选 | 默认就是 `about`，与关于页 slug 保持一致即可 |
| `THEME_SWITCH` | `false` | 可选 | 关闭右上角主题切换，避免访客在 docs 站切到其它主题 |

### 3.3 主库 Config 表（固定 heo）

在主库的 Config 表里确认或添加一行：

| 配置名 | 配置值 |
|---|---|
| `THEME` | `heo` |

这样主站的主题只由 Notion 决定，不依赖 Vercel 环境变量。`LINK` 确认为 `https://lunalight.top/`（DOMAIN_MIGRATION 第 6 项已改）。

可选：主库 `HEO_NOTICE_BAR` 中指向文档的那一条链接，改为 `https://docs.lunalight.top/`。DOMAIN_MIGRATION 第 12 项当时指向主站，是因为 docs 子域当时停用。

---

## 4. 提交代码改动

本次改动只涉及 `next.config.js`。没有 `docs:` 前缀时它不产生任何效果。

```bash
cd F:/VsCodeProject/NotionNext
git diff next.config.js
git add next.config.js
git commit -m "feat: bind docs locale to docs.lunalight.top"
git push origin main
```

注意：**提交信息不要包含 `[skip-version]`**。[vercel.json](vercel.json) 的 `ignoreCommand` 检测到它会跳过本次构建。

推送会触发一次自动部署。此时 `NOTION_PAGE_ID` 还没有 `docs:`，结果与之前一致。

---

## 5. 设置 Vercel 环境变量

Vercel → 项目 → **Settings** → **Environment Variables**。

**编辑现有的 `NOTION_PAGE_ID`，不要新建同名变量**（重复会导致冲突）。它当前的作用范围是 `Production and Preview`，保持不变即可。

编辑方式：在该变量行点击 **⋯** → **Edit**，把 Value 整体替换为下面的格式（因为原值看不到，必须完整重填）。逗号为英文逗号，不要有空格：

```text
32d70d5879c883dfbadc81e39bca06f0,docs:6e670d5879c8839d844901b7745ea333
```

如果线上原本有英文库（如 `en:`），必须一并填上，否则英文站会失效：

```text
32d70d5879c883dfbadc81e39bca06f0,en:<英文库ID>,docs:6e670d5879c8839d844901b7745ea333
```

规则：
- 第一个 ID 必须是主库，且不带前缀（它是默认语言）。
- `docs:` 必须是小写，与 `LOCALE_DOMAINS` 一致。
- 保存后需要重新部署（第 7 步）才会生效。

---

## 6. 绑定域名与 DNS

### 6.1 Vercel 添加域名

Vercel → 项目 → **Settings** → **Domains** → 输入 `docs.lunalight.top` → **Add**。

Vercel 会给出需要的记录。记下它给出的 **CNAME 值**（项目专属，形如 `xxx.vercel-dns-0xx.com`，不要用通用地址）。

添加后，`docs.lunalight.top` 默认指向本项目的 **Production 部署**（即 main 分支最新一次成功部署），**不是重定向**。它和 `lunalight.top` 是同一份部署，由 Next.js 的 i18n domains 按域名区分为 heo 主站和 gitbook 文档站。不要在这里设置 Redirect，否则 docs 站会跳转走。

### 6.2 Spaceship 添加 DNS 记录

**必须在 6.1 之后做**：Vercel 给出的 CNAME 值是添加 DNS 记录时需要填的内容。

入口：`https://www.spaceship.com/zh/application/advanced-dns-application/manage/lunalight.top/`

1. 打开上面的地址，进入 `lunalight.top` 的 Advanced DNS 管理页面。
2. 先检查记录列表：如果已经有主机记录为 `docs` 的旧记录（例如之前停用的 docs 子域），先删除或修改它，避免冲突。
3. 添加记录：

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| CNAME | `docs` | `fededb2c252ec933.vercel-dns-017.com.`（与当前 `www` 的 CNAME 值相同，末尾的点保持原样或省略均可） |

注意：`www` 的 CNAME 值是本项目专属的，`docs` 可以直接使用同一个值，因为 Vercel 按 Host 头区分域名。如果 6.1 中 Vercel 给出的值与它不同，以 Vercel 面板显示的为准。

4. 保存后回到 Vercel 等待 `docs.lunalight.top` 显示 **Valid Configuration**，SSL 证书会自动签发。DNS 生效可能需要几分钟到数小时。
5. 验证：`nslookup docs.lunalight.top` 应返回 Vercel 的 CNAME。

---

## 7. 重新部署

Vercel → **Deployments** → 最新一次 → **⋯** → **Redeploy**，取消勾选 **Use existing Build Cache**，确保新的 `next.config.js` 和环境变量都生效。

构建时间会比之前长一些（多了一个语言的预渲染）。构建失败时，见第 11 节。

---

## 8. 验证

Windows PowerShell 中请用 `curl.exe`，避免被识别为 `Invoke-WebRequest`。

```bash
curl -I https://lunalight.top/           # 期望 200
curl -I https://docs.lunalight.top/      # 期望 200
curl -I https://docs.lunalight.top/about # 期望 200
nslookup docs.lunalight.top              # 期望返回 Vercel 给出的 CNAME
```

浏览器检查：
- [ ] `lunalight.top` 首页仍是 heo 主题，文章页、分类、标签正常。
- [ ] `docs.lunalight.top` 是 gitbook 布局：左侧分类目录，首页为 about 页。
- [ ] docs 站内点击目录与文章，地址始终在 `docs.lunalight.top` 下，不会跳回主站。
- [ ] docs 站的标题、描述、图标与文档库根页面的设置一致。
- [ ] 两个站的 https 证书有效，`www.lunalight.top` 仍跳转到主域名。

---

## 9. 回滚

1. Vercel 环境变量 `NOTION_PAGE_ID` 删除 `,docs:6e670d5879c8839d844901b7745ea333`，然后重新部署。主站不受影响。
2. Vercel Domains 删除 `docs.lunalight.top`；Spaceship DNS 删除 docs 的 CNAME。
3. `next.config.js` 的改动可以保留（没有 `docs:` 前缀时无效）。要撤销就 `git revert` 对应提交。

---

## 10. 注意事项

- **环境变量对两个站都生效。** Vercel 中设置过的 `NEXT_PUBLIC_THEME`、`NEXT_PUBLIC_LINK`、`NEXT_PUBLIC_THEME_SWITCH` 等，在 docs 库没有对应 Config 项时会被 docs 站继承。站点差异项（THEME、LINK、THEME_SWITCH）因此都应写在各自的 Notion Config 表里。`NEXT_PUBLIC_THEME_SWITCH` 一旦在 Vercel 设置，会覆盖两个站的 THEME_SWITCH。
- **Notion 修改不是即时生效。** 按缓存时间（`NEXT_REVALIDATE_SECOND`）刷新。着急时可以重新部署。
- **多语言与静态导出互斥。** 启用多语言后，不能再用 `yarn export` 或 Cloudflare 静态部署。
- **预渲染列表只取主库的 slug。** 文档库独有的页面首次访问时按需生成，功能正常，只是首访稍慢。
- **docs 域名上仍能访问其它语言路径**（如 `/zh`），语言切换菜单也会列出其它语言。不影响使用；要收紧需要另外改代码。
- `lunalight.top/docs` 按 Next.js 路由机制理论上仍可访问，以实际为准。

---

## 11. 常见问题

| 现象 | 原因与处理 |
|---|---|
| docs 站显示 heo 主题 | 文档库 Config 缺少 `THEME = gitbook`；或 `NOTION_PAGE_ID` 没有 `docs:` 前缀；或没有重新部署 |
| `docs.lunalight.top` 显示主站内容 | `next.config.js` 未推送，或 Vercel Domains 中没有该域名；检查 commit 与 Domains 页面 |
| docs 首页或文章 404 | 文档库没有 `slug = about` 的页面；内容 `status` 不是 `Published`；前缀不对 |
| 前缀写成 `Docs` 或 `DOCS` | 不会报错，但 `docs.lunalight.top` 不会绑定到 docs 语言。前缀必须是小写 `docs` |
| Vercel 列表里看不到 `NOTION_PAGE_ID` 的值 | 正常。它是 Sensitive 变量，只能编辑替换，不能查看 |
| 主站突然显示演示内容 | `NOTION_PAGE_ID` 被误清空或填错，代码回落到了 `blog.config.js` 的演示库。重新 Edit 填入正确的值并重新部署 |
| `NOTION_PAGE_ID` 格式错误 | 检查是否有空格，以及第一个 ID 是否是主库（不带前缀） |
| 构建失败，报 i18n 相关错误 | 检查 `NOTION_PAGE_ID` 格式，以及 `next.config.js` 是否已推送 |
| Vercel 没有开始构建 | 提交信息包含 `[skip-version]`，`ignoreCommand` 跳过了构建。去 Deployments 手动 Redeploy |
| Notion 修改没有生效 | 缓存未过期，重新部署即可 |
| Domains 一直是 Invalid Configuration | CNAME 值不对或未生效。核对 6.1 中 Vercel 给出的值，等待 DNS 传播 |
