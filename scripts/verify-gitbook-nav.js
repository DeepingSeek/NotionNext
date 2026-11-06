/**
 * gitbook 左侧导航的嵌套展开验证（真实浏览器，检查裁剪后的可见性）
 *
 * 用法：
 *   node scripts/verify-gitbook-nav.js <文章URL> [--host-map=域名=IP:端口]
 *
 * 示例：
 *   线上：node scripts/verify-gitbook-nav.js https://docs.lunalight.top/article/foundry-agent-types
 *   本地 dev：node scripts/verify-gitbook-nav.js http://docs.lunalight.top:3100/article/foundry-agent-types --host-map=docs.lunalight.top=127.0.0.1:3100
 *
 * 依赖：Playwright（全局或项目内安装），并能启动 Chrome（channel: chrome）。
 * 可用环境变量 PLAYWRIGHT_PATH 指定 playwright 的入口文件路径。
 *
 * 检查步骤：依次点击 入门 → 基础 → 概念解释，每一步断言对应层级及其文章是否“真正可见”。
 * “可见”指：元素有尺寸，且在所有 overflow 裁剪祖先中有实际重叠（修复前嵌套内容会被高度裁掉）。
 */
const args = process.argv.slice(2)
const url = args.find(a => !a.startsWith('--'))
const hostMap = (args.find(a => a.startsWith('--host-map=')) || '').replace('--host-map=', '')

if (!url) {
  console.error('用法：node scripts/verify-gitbook-nav.js <文章URL> [--host-map=域名=IP:端口]')
  process.exit(2)
}

let playwright
try {
  playwright = require(process.env.PLAYWRIGHT_PATH || 'playwright')
} catch (e) {
  console.error('未找到 playwright。请安装：npm i -D playwright，或设置 PLAYWRIGHT_PATH')
  process.exit(2)
}

/** 在页面内判断导航中的文本是否真正可见（考虑 overflow 裁剪） */
const isReallyVisible = text => {
  const el = [...document.querySelectorAll('#posts-wrapper *')].find(
    e => e.childElementCount === 0 && e.textContent.trim() === text
  )
  if (!el) return false
  const r = el.getBoundingClientRect()
  if (r.height === 0 || r.width === 0) return false
  let a = el.parentElement
  while (a) {
    const cs = getComputedStyle(a)
    if (cs.overflow !== 'visible' || cs.overflowY !== 'visible') {
      const ar = a.getBoundingClientRect()
      const overlap = Math.min(r.bottom, ar.bottom) - Math.max(r.top, ar.top)
      if (overlap <= 2) return false
    }
    a = a.parentElement
  }
  return true
}

;(async () => {
  const launchArgs = hostMap ? [`--host-resolver-rules=MAP ${hostMap.split('=')[0]} ${hostMap.split('=')[1]}`] : []
  const browser = await playwright.chromium.launch({ channel: 'chrome', headless: true, args: launchArgs })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const nav = page.locator('#posts-wrapper')
  const folder = name =>
    nav
      .locator('div.cursor-pointer', { has: page.locator('span', { hasText: new RegExp('^' + name + '$') }) })
      .first()
  const visible = text => page.evaluate(isReallyVisible, text)

  const failures = []
  const expectVisible = async (step, text, expected = true) => {
    const got = await visible(text)
    const ok = got === expected
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${step.padEnd(14)} ${text.padEnd(14)} visible=${got}`)
    if (!ok) failures.push(`${step}: ${text} 期望 ${expected}，实际 ${got}`)
  }

  // 初始：只有一级可见
  await expectVisible('initial', '入门')
  await expectVisible('initial', '基础', false)

  await folder('入门').click()
  await page.waitForTimeout(600)
  await expectVisible('click 入门', '基础')

  await folder('基础').click()
  await page.waitForTimeout(600)
  await expectVisible('click 基础', '概念解释')

  await folder('概念解释').click()
  await page.waitForTimeout(600)
  await expectVisible('click 概念解释', '术语与改名对照')

  await browser.close()
  if (failures.length) {
    console.error('\n导航嵌套展开验证失败：\n- ' + failures.join('\n- '))
    process.exit(1)
  }
  console.log('\n导航嵌套展开验证通过')
})().catch(e => {
  console.error('ERR', e.message)
  process.exit(2)
})
