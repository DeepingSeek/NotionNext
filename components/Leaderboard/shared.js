import { formatMetric } from '@/lib/db/leaderboard/mapping'

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black'

export const METRICS = {
  intelligence: { label: '综合分', digits: 1 },
  inputPrice: { label: '输入价格（美元 / 百万 tokens）', digits: 2 },
  outputPrice: { label: '输出价格（美元 / 百万 tokens）', digits: 2 },
  outputTps: { label: '输出速度（TPS）', digits: 1 },
  ttft: { label: '首字延迟（秒）', digits: 2 }
}

/**
 * 空值显示“—”，并提供“未测量”的悬停提示与屏幕阅读器文本，不显示 0
 */
export function Metric({ value, digits }) {
  const text = formatMetric(value, digits)
  if (text !== null) return text
  return (
    <span title='未测量'>
      —<span className='sr-only'>未测量</span>
    </span>
  )
}

export function BrandLogo({ brand }) {
  if (!brand) return null
  return (
    <img
      src={brand.logo}
      alt=''
      width={20}
      height={20}
      loading='lazy'
      className='h-5 w-5 shrink-0 object-contain'
    />
  )
}

export function RankBadge({ rank, circled = true }) {
  if (circled && rank <= 3) {
    return (
      <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-dark text-xs font-bold text-white dark:border dark:border-gray-100 dark:bg-transparent dark:text-gray-100'>
        {rank}
      </span>
    )
  }
  return <span className='font-semibold tabular-nums text-dark dark:text-gray-200'>{rank}</span>
}
