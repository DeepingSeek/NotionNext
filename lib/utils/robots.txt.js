import fs from 'fs'
import { normalizeSiteUrl } from '../sitemap-utils'

/**
 * 生成 robots.txt 内容（无前导空格，避免部分解析器忽略指令行）
 * @param {string} link 站点规范域名，例如 https://www.lunalight.top
 * @returns {string}
 */
export function buildRobotsTxt(link) {
  const LINK = normalizeSiteUrl(link)
  return [
    '# *',
    'User-agent: *',
    'Allow: /',
    '',
    '# Host',
    `Host: ${LINK}`,
    '',
    '# Sitemaps',
    `Sitemap: ${LINK}/sitemap.xml`,
    ''
  ].join('\n')
}

export function generateRobotsTxt(props) {
  const { siteInfo } = props
  const content = buildRobotsTxt(siteInfo?.link)
  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('./public/robots.txt', content)
  } catch (error) {
    // 在vercel运行环境是只读的，这里会报错；
    // 但在vercel编译阶段、或VPS等其他平台这行代码会成功执行
  }
}
