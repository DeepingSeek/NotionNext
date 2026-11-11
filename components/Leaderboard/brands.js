/**
 * 厂商（Creator）到品牌 logo 与品牌色的映射；logo 复用首页品牌图标（themes/heo/config.js 的 HEO_GROUP_ICONS）
 * 未配置的厂商不显示 logo，也不参与顶尖模型高亮
 */
const BRANDS = {
  Anthropic: { logo: '/images/heo/claude-color.webp', color: '#D97757' },
  OpenAI: { logo: '/images/heo/openai.webp', color: '#10A37F' },
  Google: { logo: '/images/heo/google-color.webp', color: '#4285F4' },
  Meta: { logo: '/images/heo/meta-color.webp', color: '#0866FF' },
  DeepSeek: { logo: '/images/heo/deepseek-color.webp', color: '#4D6BFE' },
  Alibaba: { logo: '/images/heo/qwen-color.webp', color: '#615CED' },
  SpaceXAI: { logo: '/images/heo/grok.webp', color: '#475569' }
}

export function getBrand(creator) {
  return BRANDS[creator] || null
}

function withAlpha(hex, alpha) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 品牌色底纹；用 backgroundImage 叠在单元格原有背景之上，固定列（sticky）也能保持颜色，且亮暗模式通用
 */
export function getBrandTint(brand, strong = false) {
  if (!brand) return undefined
  const color = withAlpha(brand.color, strong ? 0.12 : 0.06)
  return { backgroundImage: `linear-gradient(${color}, ${color})` }
}
