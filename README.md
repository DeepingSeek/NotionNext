<div align="center">

# 月明的博客

基于 NotionNext 与 Notion 搭建的个人博客，在线访问：[moonbright.eu.cc](https://moonbright.eu.cc)

<p>
  <a href="https://moonbright.eu.cc">访问博客</a>
  ·
  <a href="https://github.com/DeepingSeek/NotionNext">GitHub 仓库</a>
  ·
  <a href="https://notionnext.tangly1024.com/">NotionNext 文档</a>
</p>
</div>

---

## 项目简介

本项目使用 **Next.js + Notion API** 构建。文章、分类、标签等内容在 Notion 中维护，博客通过 Vercel 部署并自动同步更新。

## 主要功能

- 在 Notion 中写作，自动发布为博客文章
- SEO：自动生成 Sitemap、robots.txt、RSS，支持 Google / 百度站长验证
- 站点统计、评论、全文搜索、暗黑模式
- 支持 PWA 安装

## 本地开发

推荐使用 Node 22 和 Yarn 1。

```bash
yarn            # 安装依赖
yarn dev        # 启动开发服务器，访问 http://localhost:3000
yarn build      # 构建生产版本
yarn export     # 静态导出（会同时生成 sitemap）
```

## 配置说明

站点配置集中在以下文件：

| 文件 | 内容 |
| --- | --- |
| `blog.config.js` | 站点基础信息、作者、关键词、主题等 |
| `conf/analytics.config.js` | 站点统计与 SEO 站长验证 |
| `conf/comment.config.js` | 评论插件 |
| `conf/contact.config.js` | 联系方式 |
| `public/manifest.json` | PWA 名称与描述 |

大部分配置也可以通过环境变量覆盖，参考 [.env.example](./.env.example)。

## SEO 配置

1. **站点信息**：在 Notion 配置表中设置 `TITLE`、`DESCRIPTION`，并在 `blog.config.js` 中确认 `LINK` 为正式域名。
2. **站长验证**：在环境变量中填写验证码
   - `NEXT_PUBLIC_SEO_GOOGLE_SITE_VERIFICATION`
   - `NEXT_PUBLIC_SEO_BAIDU_SITE_VERIFICATION`
3. **Sitemap / robots.txt**：由 `pages/sitemap.xml.js` 与 `lib/utils/robots.txt.js` 自动生成，地址为 `https://moonbright.eu.cc/sitemap.xml`。
4. **提交收录**：在 Google Search Console 与百度搜索资源平台提交上述 Sitemap。

## 部署

1. 复制 Notion 模板并获取页面 ID，填入环境变量 `NOTION_PAGE_ID`。
2. Fork 本仓库，在 Vercel 中导入并部署，Node 版本设置为 22。
3. 在 Vercel 中绑定自定义域名 `moonbright.eu.cc`。

## 致谢

本项目基于 [NotionNext](https://github.com/notionnext-org/NotionNext) 开源项目构建，感谢原作者与贡献者。

## License

本项目基于 MIT 协议开源，详见 [LICENSE](./LICENSE)。


