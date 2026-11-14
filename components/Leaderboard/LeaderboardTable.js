import { SORT_SPECS } from '@/lib/db/leaderboard/mapping'
import { getBrand, getBrandTint } from './brands'
import { BrandLogo, FOCUS_RING, METRICS, Metric, RankBadge } from './shared'

const COLUMNS = [
  { id: 'rank', label: '排名' },
  { id: 'name', label: '模型' },
  { id: 'intelligence', ...METRICS.intelligence, sortKey: 'intelligence', field: 'intelligence' },
  { id: 'inputPrice', ...METRICS.inputPrice, sortKey: 'price', field: 'inputPrice' },
  { id: 'outputPrice', ...METRICS.outputPrice, field: 'outputPrice' },
  { id: 'outputTps', ...METRICS.outputTps, sortKey: 'speed', field: 'outputTps' },
  { id: 'ttft', ...METRICS.ttft, sortKey: 'ttft', field: 'ttft' }
]

const TOP_HIGHLIGHT_RANK = 5

/**
 * 宽屏表格；窄屏由 LeaderboardCards 展示，切换点为 lg
 */
const LeaderboardTable = ({ rows, sortKey, onSortChange }) => (
  <div className='-mx-4 hidden overflow-x-auto px-4 lg:mx-0 lg:block lg:px-0'>
    <table className='leaderboard-table w-full min-w-[52rem] border-collapse text-sm'>
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
                title={column.title}
                aria-sort={isSortable ? (isActive ? direction : 'none') : undefined}
                className={`py-3 font-semibold whitespace-nowrap ${isNumeric ? 'px-3 text-center' : 'pr-3'} ${stickyClass}`}>
                {isSortable ? (
                  <button
                    type='button'
                    onClick={() => onSortChange(column.sortKey)}
                    className={`inline-flex min-h-11 items-center gap-1 rounded ${FOCUS_RING} ${
                      isActive
                        ? 'font-bold text-dark underline underline-offset-4 dark:text-white'
                        : 'hover:text-dark dark:hover:text-gray-200'
                    }`}>
                    <span className='flex flex-col items-center leading-tight'>
                      <span className='inline-flex items-center gap-1'>
                        {column.label}
                        {isActive && (
                          <span aria-hidden='true'>{direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </span>
                      {column.unit && <span className='text-xs font-normal text-body-color'>{column.unit}</span>}
                    </span>
                  </button>
                ) : (
                  <span className='flex flex-col items-center leading-tight'>
                    {column.label}
                    {column.unit && <span className='text-xs font-normal text-body-color'>{column.unit}</span>}
                  </span>
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
          return (
            <tr key={row.id} className='border-b border-gray-200 dark:border-gray-800'>
              <td className='sticky left-0 z-0 w-14 bg-white py-3 pr-3 align-middle dark:bg-gray-950' style={tint}>
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
                className='py-3 px-3 text-center align-middle font-semibold tabular-nums text-dark dark:text-white'
                style={tint}>
                <Metric value={row.intelligence} digits={METRICS.intelligence.digits} />
              </td>
              <td
                className='py-3 px-3 text-center align-middle tabular-nums text-dark dark:text-gray-200'
                style={tint}>
                <Metric value={row.inputPrice} digits={METRICS.inputPrice.digits} />
              </td>
              <td
                className='py-3 px-3 text-center align-middle tabular-nums text-dark dark:text-gray-200'
                style={tint}>
                <Metric value={row.outputPrice} digits={METRICS.outputPrice.digits} />
              </td>
              <td
                className='py-3 px-3 text-center align-middle tabular-nums text-dark dark:text-gray-200'
                style={tint}>
                <Metric value={row.outputTps} digits={METRICS.outputTps.digits} />
              </td>
              <td
                className='py-3 px-3 text-center align-middle tabular-nums text-dark dark:text-gray-200'
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
