# 域名迁移记录：moonbright.eu.cc → lunalight.top

- 日期：2026-10-29
- 站点：NotionNext，部署在 Vercel
- 旧域名：`moonbright.eu.cc`，保留并做 301 跳转
- 新域名：`lunalight.top`（Spaceship 购买），作为规范域名
- 状态：DNS 已在 Spaceship 配置，待 Vercel 验证
- DNS 托管：Spaceship（方案 A，已选定）

## 1. 域名配置的读取优先级

站点地址 `LINK` 的读取顺序（见 [lib/config.js](lib/config.js)）：

1. Notion 配置表中的 `LINK`（优先级最高）
2. Vercel 环境变量 `NEXT_PUBLIC_LINK`（必须是完整 URL，含 `https://`）
3. [blog.config.js](blog.config.js#L21) 中的默认值

sitemap、robots.txt、RSS、canonical 与 CORS 都读取 `LINK`，`LINK` 正确后这些内容会自动跟随新域名。

## 2. 需要修改的位置

| # | 位置 | 当前值 | 改为 | 说明 |
|---|---|---|---|---|
| 1 | Spaceship DNS | 无 | 已添加 Vercel 面板给出的 A 与项目专属 CNAME 记录 | 见阶段 A |
| 2 | Vercel Domains | `moonbright.eu.cc` | 新增 `lunalight.top`、`www.lunalight.top`；旧域名改为重定向 | 见阶段 A、B |
| 3 | [blog.config.js](blog.config.js#L21) | `https://moonbright.eu.cc` | `https://lunalight.top` | 代码默认值 |
| 4 | [README.md](README.md#L5) 第 5、8、60、67 行 | `moonbright.eu.cc` | `lunalight.top` | 站点地址、sitemap 地址、绑定说明 |
| 5 | Vercel 环境变量 `NEXT_PUBLIC_LINK` | 待检查 | `https://lunalight.top` | 设置后需重新部署 |
| 6 | Notion 配置表 `LINK` 字段 | 已改为 `https://lunalight.top/` | `https://lunalight.top` | 已通过 Notion MCP 更新，优先级最高 |
| 7 | GitHub Secrets `URL` | `moonbright.eu.cc` | `https://lunalight.top` | 供 [pushUrl.yml](.github/workflows/pushUrl.yml) 向百度、Bing 推送 |
| 8 | 百度资源平台 | 旧站点 | 新增 `https://lunalight.top` 站点 | 验证码对应 `NEXT_PUBLIC_SEO_BAIDU_SITE_VERIFICATION`，推送 token 对应 `BAIDU_TOKEN` |
| 9 | Google Search Console | 旧属性 | 新增新域名属性 | 若用 URL 前缀验证，更新 `NEXT_PUBLIC_SEO_GOOGLE_SITE_VERIFICATION` |
| 10 | Bing 网站管理员工具 | 无 | 新增站点并生成 API Key | 对应 GitHub Secrets `BING_API_KEY` |
| 11 | 第三方服务后台 | 旧域名 | 新域名 | 仅处理实际启用的服务，见阶段 D |
| 12 | Notion 配置表 `HEO_HERO_TITLE_3`、`HEO_NOTICE_BAR` | `moonbright.eu.cc` | `lunalight.top` | 已更新；公告栏两条链接均指向 `https://lunalight.top/`（原 docs 子域已停用） |

以下位置读取 `LINK`，无需手动修改：sitemap（[pages/sitemap.xml.js](pages/sitemap.xml.js)）、robots.txt（[lib/utils/robots.txt.js](lib/utils/robots.txt.js)）、RSS（[pages/api/rss.js](pages/api/rss.js)）、CORS（[lib/middleware/security.js](lib/middleware/security.js)）、canonical（[components/SEO.js](components/SEO.js)）。

## 3. 操作步骤

顺序很重要：先让新域名可用，再切换 `LINK`。

### 阶段 A：解析新域名（不影响旧站）

- [x] A1 确认域名状态正常，并选定 DNS 托管方案：Spaceship（见文末附录）。
- [ ] A2 在所选 DNS 托管处删除默认的 parking 或转发记录（如有），避免与 Vercel 记录冲突。
- [ ] A3 Vercel 进入 Project → Settings → Domains，添加 `lunalight.top` 与 `www.lunalight.top`，将 `www` 设为重定向到 `lunalight.top`。
- [x] A4 已在 Spaceship 直接配置 DNS 记录，上线前需与 Vercel 面板逐项核对：

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| A | @ | Vercel 面板显示的 IPv4 地址（常见为 76.76.21.21） |
| CNAME | www | Vercel 面板显示的项目专属 CNAME（形如 xxx.vercel-dns-017.com，不是通用地址） |

- [ ] A5 等待 Vercel 显示 Valid Configuration 且 SSL 证书签发完成；如要求 TXT 验证，按提示添加。

### 阶段 B：切换规范域名（A5 完成后再做）

- [ ] B1 修改 [blog.config.js](blog.config.js#L21) 与 [README.md](README.md)，提交并推送。
- [ ] B2 Vercel Settings → Environment Variables 中将 `NEXT_PUBLIC_LINK` 设为 `https://lunalight.top`（Production）。
- [x] B3 Notion 配置表 `LINK` 已改为 `https://lunalight.top/`（已通过 Notion MCP 更新）。
- [ ] B4 Vercel Deployments 中 Redeploy 最新版本（`NEXT_PUBLIC_` 变量在构建时注入，只改变量不会生效）。
- [ ] B5 Vercel Domains 中将 `moonbright.eu.cc` 设为永久重定向到 `https://lunalight.top`。旧域名的 DNS 记录保持不变。

### 阶段 C：搜索引擎与推送

- [ ] C1 Google Search Console 新增新域名属性。推荐「网域」属性（通过 DNS TXT 验证，不依赖页面 meta 标签）；若使用 URL 前缀属性，则需更新验证码环境变量。提交 `https://lunalight.top/sitemap.xml`。
- [ ] C2 旧站已在 GSC 验证时，使用「地址更改」工具从旧属性迁移到新属性。
- [ ] C3 百度资源平台新增 `https://lunalight.top` 站点，完成验证并提交 sitemap；如使用 meta 验证，更新 `NEXT_PUBLIC_SEO_BAIDU_SITE_VERIFICATION` 后重新部署。
- [ ] C4 Bing 网站管理员工具新增站点并验证，生成 API Key。
- [ ] C5 GitHub 仓库 Settings → Secrets and variables → Actions 中更新 `URL`；按需更新 `BAIDU_TOKEN`、`BING_API_KEY`；在 Actions 页面手动运行 `pushUrl` 验证。

### 阶段 D：第三方服务（仅处理实际启用的项）

| 服务 | 需要做的事 | 配置位置 |
|---|---|---|
| Webmention 评论 | 更新 hostname | 环境变量 `NEXT_PUBLIC_WEBMENTION_HOSTNAME`（见 [conf/comment.config.js](conf/comment.config.js)） |
| Waline 评论（自建服务端） | 允许域名加入新域名 | 服务端 `SECURE_DOMAINS` |
| Artalk / Cusdis 评论 | 允许域名或站点加入新域名 | 对应服务端或后台 |
| Algolia 搜索 | Search API Key 若设置了 Referrer 限制，加入新域名 | Algolia 后台 |
| Gitalk（GitHub OAuth 登录） | OAuth App 的回调地址改为新域名 | GitHub Developer settings |
| 百度统计、Google Analytics、Ackee | 添加新域名或数据流 | 各统计后台 |
| Google AdSense | 在网站列表中添加新域名 | AdSense 后台 |
| Clerk 登录（仅配置了 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 时） | 添加生产域名并按提示配置 DNS | Clerk 后台 |

## 4. 验证清单

- [ ] `nslookup lunalight.top` 解析到 Vercel 提供的地址
- [ ] 浏览器打开 `https://lunalight.top`，HTTPS 正常，页面可访问
- [ ] `curl.exe -I https://moonbright.eu.cc` 返回 301 或 308，`Location` 指向 `https://lunalight.top`
- [ ] 访问旧域名下的文章路径，跳转后路径保持不变
- [ ] `https://lunalight.top/sitemap.xml` 中所有 `<loc>` 都是新域名
- [ ] `https://lunalight.top/robots.txt` 中 Sitemap 地址为新域名
- [ ] `https://lunalight.top/rss.xml` 中的链接为新域名
- [ ] 查看页面源码，`<link rel="canonical">` 为新域名
- [ ] 评论、搜索、统计加载正常
- [ ] GitHub Actions 中 `pushUrl` 运行成功，百度与 Bing 返回推送成功

## 5. 注意事项

- `LINK` 指向的域名必须已可访问，否则 sitemap 与 canonical 会指向失效地址。
- 旧域名 `moonbright.eu.cc` 的 DNS 记录不要删除，它需要继续指向 Vercel 才能完成跳转。
- 百度、Bing 推送要求 `site` 参数已在对应平台验证，否则推送会失败。
- 搜索引擎完成重新收录通常需要数周，期间保持 301 跳转，不要中断。

---

## 附录：DNS 托管方案

已选定：方案 A（Spaceship 直接管理 DNS）。DNS 是“域名 → Vercel 服务器”的指路表。域名注册商仍是 Spaceship，DNS 托管不会转移域名。

### 方案 A：Spaceship 管理 DNS（当前采用）

1. Spaceship 域名管理页面进入 DNS 记录（Manage DNS / Advanced DNS），按 Vercel 面板显示的值添加：
   - 类型 `A`，主机 `@`，值为 Vercel 面板给出的 IPv4 地址
   - 类型 `CNAME`，主机 `www`，值为 Vercel 面板给出的项目专属 CNAME
2. 费用：以 Spaceship 后台实际显示为准；如出现付费提示，再改用方案 B。

### 方案 B：Cloudflare 管理 DNS（备选，未采用）

仅在方案 A 出现付费或无法使用时考虑。改用需要修改 nameserver，且不可在两处同时维护记录。使用时 Cloudflare 记录必须为灰色（DNS only）。

### 注意

- 记录值必须以 Vercel 面板显示为准。CNAME 为项目专属地址，不要复用通用地址或其他项目的记录。
- 在 Notion、Vercel、GitHub 中填写网址时只填纯 URL，例如 `https://lunalight.top`，不要带空格、引号、反引号或中文标点。
- 旧域名 moonbright.eu.cc 的 DNS 原在 Cloudflare，保持现状，但需确认其记录仍指向 Vercel；如为橙色代理，建议改为灰色（DNS only），否则旧域名的 301 跳转可能失效。

---

## 附录 B：操作记录

| 日期 | 操作 | 位置 | 结果 |
|---|---|---|---|
| 2026-10-29 | 检查 NotionNext 仓库中的旧域名引用 | blog.config.js、README.md 及全仓库搜索 | 已改的两处之外，仅剩占位符（DEPLOYMENT.md）和注释示例（next.config.js），无需改动 |
| 2026-10-29 | 更新 Notion 配置中心 `LINK` | CONFIG-TABLE，行 `35c70d5879c88394882d01f72243a8b2` | 配置值改为 `https://lunalight.top/`（原为 Markdown 链接格式，现为纯文本） |
| 2026-10-29 | 更新 Notion `HEO_HERO_TITLE_3` | CONFIG-TABLE，行 `3dc70d5879c8809ab39cc05bcac930e0` | 配置值改为 `lunalight.top` |
| 2026-10-29 | 更新 Notion `HEO_NOTICE_BAR` | CONFIG-TABLE，行 `3dc70d5879c8808393d5d8caed0e5e29` | 欢迎链接与文档链接均改为 `https://lunalight.top/`（用户确认 docs 子域未在使用） |

待跟进：

- `HEO_NOTICE_BAR` 按原始 JSON 字符串写入，尚未在网页上核对公告栏渲染效果。
- 仓库中的 `blog.config.js` 与 `README.md` 改动尚未提交推送，推送前需先完成阶段 A、B 的验证。
