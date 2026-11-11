import { SORT_SPECS } from '@/lib/db/leaderboard/mapping'
import { getBrand, getBrandTint } from './brands'
import { BrandLogo, FOCUS_RING, METRICS, Metric, RankBadge } from './shared'

const COLUMNS = [
  { id: 'rank', label: '排名' },
  { id: 'name', label: '模型' },
  { id: 'intelligence', label: METRICS.intelligence.label, sortKey: 'intelligence', field: 'intelligence' },
  { id: 'inputPrice', label: METRICS.inputPrice.label, sortKey: 'price', field: 'inputPrice' },
  { id: 'outputPrice', label: METRICS.outputPrice.label, field: 'outputPrice' },
  { id: 'outputTps', label: METRICS.outputTps.label, sortKey: 'speed', field: 'outputTps' },
  { id: 'ttft', label: METRICS.ttft.label, sortKey: 'ttft', field: 'ttft' }
]

const TOP_HIGHLIGHT_RANK = 5

/**
 * 宽屏表格；窄屏由 LeaderboardCards 展示，切换点为 lg
 */
const LeaderboardTable = ({ rows, sortKey, onSortChange }) => (
  <div className='-mx-4 hidden overflow-x-auto px-4 lg:mx-0 lg:block lg:px-0'>
    <table className='w-full min-w-[52rem] border-collapse text-sm'>
      <caption className='sr-only'>AI 模型排行榜，按当前排序显示</caption>
      <thead>
        <tr className='border-b border-gray-200 text-left text-body-color dark:border-gray-800 dark:text-gray-400'>
          {COLUMNS.map(column => {
            const isSortable = Boolean(column.sortKey)
            const isActive = isSortable && column.sortKey === sortKey
            const direction = SORT_SPECS[column.sortKey]?.direction === 'asc' ? 'ascending' : 'descending'
            const isNumeric = column.id !== 'rank' && column.id !== 'name'
            const stickyClass =
              column.id === 'rank'
                ? 'sticky left-0 z-10 w-14 bg-white dark:bg-gray-950'
                : column.id === 'name'
                ? 'sticky left-14 z-10 w-56 bg-white dark:bg-gray-950'
                  : ''
            return (
              <th
                key={column.id}
                scope='col'
                aria-sort={isSortable ? (isActive ? direction : 'none') : undefined}
                className={`py-3 font-semibold whitespace-nowrap ${isNumeric ? 'pl-3 text-right' : 'pr-3'} ${stickyClass}`}>
                {isSortable ? (
                  <button
                    type='button'
                    onClick={() => onSortChange(column.sortKey)}
                    className={`inline-flex min-h-11 items-center gap-1 rounded ${FOCUS_RING} ${
                      isActive
                        ? 'font-bold text-dark underline underline-offset-4 dark:text-white'
                        : 'hover:text-dark dark:hover:text-gray-200'
                    }`}>
                    {column.label}
                    {isActive && (
                      <span aria-hidden='true'>{direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const brand = getBrand(row.creator)
          const top = Boolean(brand) && row.rank <= TOP_HIGHLIGHT_RANK
          const tint = getBrandTint(brand, top)
          const rankStyle = brand ? { ...tint, boxShadow: `inset 3px 0 0 ${brand.color}` } : undefined
          return (
            <tr key={row.id} className='border-b border-gray-200 dark:border-gray-800'>
              <td className='sticky left-0 z-0 w-14 bg-white py-3 pr-3 align-middle dark:bg-gray-950' style={rankStyle}>
                <RankBadge rank={row.rank} circled={top} />
              </td>
              <td className='sticky left-14 z-0 w-56 bg-white py-3 pr-4 align-middle dark:bg-gray-950' style={tint}>
                <div className='flex items-center gap-2.5'>
                  <BrandLogo brand={brand} />
                  <div className='min-w-0'>
                    <div className='font-medium text-dark dark:text-gray-100'>{row.name}</div>
                    {row.creator && (
                      <div className='text-xs text-body-color dark:text-gray-400'>{row.creator}</div>
                    )}
                  </div>
                </div>
              </td>
              <td
                className='py-3 pl-3 text-right align-middle font-semibold tabular-nums text-dark dark:text-white'
                style={tint}>
                <Metric value={row.intelligence} digits={METRICS.intelligence.digits} />
              </td>
              <td
                className='py-3 pl-3 text-right align-middle tabular-nums text-dark dark:text-gray-200'
                style={tint}>
                <Metric value={row.inputPrice} digits={METRICS.inputPrice.digits} />
              </td>
              <td
                className='py-3 pl-3 text-right align-middle tabular-nums text-dark dark:text-gray-200'
                style={tint}>
                <Metric value={row.outputPrice} digits={METRICS.outputPrice.digits} />
              </td>
              <td
                className='py-3 pl-3 text-right align-middle tabular-nums text-dark dark:text-gray-200'
                style={tint}>
                <Metric value={row.outputTps} digits={METRICS.outputTps.digits} />
              </td>
              <td
                className='py-3 pl-3 text-right align-middle tabular-nums text-dark dark:text-gray-200'
                style={tint}>
                <Metric value={row.ttft} digits={METRICS.ttft.digits} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export default LeaderboardTable
