import { getBrand, getBrandTint } from './brands'
import { BrandLogo, FOCUS_RING, METRICS, Metric, RankBadge } from './shared'

const DETAIL_FIELDS = ['inputPrice', 'outputPrice', 'outputTps', 'ttft']
const TOP_HIGHLIGHT_RANK = 5

/**
 * 小屏卡片：默认显示排名、logo、名称、厂商、综合分；展开查看其余指标。使用原生 details，无需额外脚本。
 */
const LeaderboardCards = ({ rows }) => (
  <ol aria-label='模型列表' className='space-y-3 lg:hidden'>
    {rows.map(row => {
      const brand = getBrand(row.creator)
      const top = Boolean(brand) && row.rank <= TOP_HIGHLIGHT_RANK
      return (
        <li key={row.id}>
          <details
            className='rounded-xl border border-gray-200 p-4 dark:border-gray-800'
            style={brand ? { ...getBrandTint(brand, top), borderLeft: `4px solid ${brand.color}` } : undefined}>
            <summary
              className={`flex min-h-11 cursor-pointer list-none items-center gap-3 rounded [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}>
              <RankBadge rank={row.rank} circled={top} />
              <BrandLogo brand={brand} />
              <div className='min-w-0 flex-1'>
                <div className='truncate font-medium text-dark dark:text-gray-100'>{row.name}</div>
                {row.creator && (
                  <div className='truncate text-xs text-body-color dark:text-gray-400'>{row.creator}</div>
                )}
              </div>
              <div className='shrink-0 text-right'>
                <div className='text-xs text-body-color dark:text-gray-400'>{METRICS.intelligence.label}</div>
                <div className='font-semibold tabular-nums text-dark dark:text-white'>
                  <Metric value={row.intelligence} digits={METRICS.intelligence.digits} />
                </div>
              </div>
            </summary>
            <dl className='mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-200 pt-4 text-sm dark:border-gray-800'>
              {DETAIL_FIELDS.map(field => (
                <div key={field}>
                  <dt className='text-xs text-body-color dark:text-gray-400'>{METRICS[field].label}</dt>
                  <dd className='tabular-nums text-dark dark:text-gray-200'>
                    <Metric value={row[field]} digits={METRICS[field].digits} />
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </li>
      )
    })}
  </ol>
)

export default LeaderboardCards
