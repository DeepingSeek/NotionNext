import {
  buildBoardQuery,
  filterLeaderboardRows,
  getVendorOptions,
  parseBoardQuery,
  sortLeaderboardRows
} from '@/lib/db/leaderboard/mapping'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import FilterBar from './FilterBar'
import LeaderboardCards from './LeaderboardCards'
import LeaderboardTable from './LeaderboardTable'
import SortChips from './SortChips'
import { FOCUS_RING } from './shared'

/**
 * 排序、搜索、厂商过滤的客户端看板；状态同步到 URL（replace，不产生历史记录）
 */
const LeaderboardBoard = ({ rows }) => {
  const router = useRouter()
  const [state, setState] = useState(() => parseBoardQuery({}))
  const initialized = useRef(false)

  // URL 参数只在首次就绪时读取一次；之后以本地状态为准，避免输入时被异步回写覆盖
  useEffect(() => {
    if (!router.isReady || initialized.current) return
    initialized.current = true
    setState(parseBoardQuery(router.query))
  }, [router.isReady, router.query])

  const update = patch => {
    const next = { ...state, ...patch }
    setState(next)
    router.replace(
      { pathname: router.pathname, query: buildBoardQuery(router.query, next) },
      undefined,
      { shallow: true, scroll: false }
    )
  }

  const vendorOptions = useMemo(() => getVendorOptions(rows), [rows])
  const visibleRows = useMemo(
    () => sortLeaderboardRows(filterLeaderboardRows(rows, state), state.sort),
    [rows, state]
  )

  return (
    <section aria-label='模型排行' className='space-y-4'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
        <SortChips value={state.sort} onChange={sort => update({ sort })} />
        <FilterBar
          query={state.query}
          onQueryChange={query => update({ query })}
          vendor={state.vendor}
          vendorOptions={vendorOptions}
          onVendorChange={vendor => update({ vendor })}
        />
      </div>

      {visibleRows.length > 0 ? (
        <>
          <LeaderboardTable
            rows={visibleRows}
            sortKey={state.sort}
            onSortChange={sort => update({ sort })}
          />
          <LeaderboardCards rows={visibleRows} />
        </>
      ) : (
        <div className='rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700'>
          <p className='text-dark dark:text-gray-200'>没有匹配的模型</p>
          <button
            type='button'
            onClick={() => update({ query: '', vendor: '' })}
            className={`mt-4 min-h-11 rounded-full border border-gray-300 px-4 text-sm font-medium text-dark hover:border-gray-500 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-400 ${FOCUS_RING}`}>
            清除筛选
          </button>
        </div>
      )}
    </section>
  )
}

export default LeaderboardBoard
