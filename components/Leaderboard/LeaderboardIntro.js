import { formatSyncedAt } from '@/lib/db/leaderboard/mapping'
import { IconAlertTriangle } from '@tabler/icons-react'

const LeaderboardIntro = ({ sourceName, syncedAt, indexVersion, stale, rankIssue }) => (
  <header>
    <h1 className='text-3xl font-bold text-dark dark:text-white lg:text-4xl'>
      {sourceName} 榜单 Top 100
    </h1>
    <p className='mt-3 max-w-3xl text-base leading-relaxed text-body-color dark:text-gray-400'>
      汇总{sourceName}的模型综合智能指数、价格、输出速度与首字延迟，默认按综合分排序。数据定期同步。
    </p>
    <dl className='mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm'>
      <div className='flex gap-2'>
        <dt className='text-body-color dark:text-gray-400'>同步时间（北京时间）</dt>
        <dd className='font-medium tabular-nums text-dark dark:text-gray-200'>
          {formatSyncedAt(syncedAt) || '—'}
        </dd>
      </div>
      <div className='flex gap-2'>
        <dt className='text-body-color dark:text-gray-400'>指数版本</dt>
        <dd className='font-medium tabular-nums text-dark dark:text-gray-200'>{indexVersion ?? '—'}</dd>
      </div>
    </dl>
    {stale && (
      <p
        role='status'
        className='mt-4 flex items-start gap-2 rounded-lg bg-warning/20 px-4 py-3 text-sm text-dark dark:bg-warning/15 dark:text-gray-100'>
        <IconAlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
        数据可能不是最新，同步时间已超过 36 小时。
      </p>
    )}
    {rankIssue && (
      <p
        role='status'
        className='mt-4 flex items-start gap-2 rounded-lg bg-warning/20 px-4 py-3 text-sm text-dark dark:bg-warning/15 dark:text-gray-100'>
        <IconAlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
        排名数据存在缺号或重复，列表可能不完整。
      </p>
    )}
  </header>
)

export default LeaderboardIntro
