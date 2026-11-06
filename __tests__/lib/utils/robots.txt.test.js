import { buildRobotsTxt } from '@/lib/utils/robots.txt'

describe('buildRobotsTxt', () => {
  it('uses the canonical link for Host and Sitemap', () => {
    const txt = buildRobotsTxt('https://www.lunalight.top/')

    expect(txt).toContain('Host: https://www.lunalight.top')
    expect(txt).toContain('Sitemap: https://www.lunalight.top/sitemap.xml')
    expect(txt).not.toContain('docs.lunalight.top')
  })

  it('has no leading whitespace on directive lines', () => {
    const lines = buildRobotsTxt('https://www.lunalight.top').split('\n')

    lines.forEach(line => {
      expect(line).toBe(line.trimStart())
    })
    expect(lines).toContain('User-agent: *')
    expect(lines).toContain('Allow: /')
  })
})
