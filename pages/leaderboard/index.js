import Attribution from '@/components/Leaderboard/Attribution'
import LeaderboardBoard from '@/components/Leaderboard/LeaderboardBoard'
import LeaderboardIntro from '@/components/Leaderboard/LeaderboardIntro'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import {
  createUnavailableBoard,
  getLeaderboardBoard
} from '@/lib/db/leaderboard/getLeaderboardRows'
import Head from 'next/head'

const DEFAULT_REVALIDATE_SECOND = 86400
// 数据不可用时缩短刷新间隔，尽快恢复
const UNAVAILABLE_REVALIDATE_SECOND = 300

const PLACEHOLDER_TEXT = {
  empty: '暂无数据，请稍后再来。',
  unavailable: '数据暂不可用，请稍后再试。'
}

const LeaderboardPlaceholder = ({ status }) => (
  <div
    role='status'
    className='rounded-xl border border-dashed border-gray-300 p-8 text-center text-body-color dark:border-gray-700 dark:text-gray-400'>
    {PLACEHOLDER_TEXT[status] || PLACEHOLDER_TEXT.unavailable}
  </div>
)

/**
 * 榜单页面；数据来自 NotionBlog 同步的派生表，配置见 conf/leaderboard.config.js
 * 外层主题布局由 _app.js 的 GLayout 统一提供，页面只输出内容
 */
const LeaderboardPage = props => {
  const { leaderboard, sourceName, sourceUrl, licenseNotice, showAttribution } = props
  const status = leaderboard.status

  return (
    <>
      <Head>
        {status === 'unavailable' ? <meta name='robots' content='noindex' /> : null}
      </Head>
      <main className='w-full'>
        <LeaderboardIntro
          sourceName={sourceName}
          syncedAt={leaderboard.syncedAt}
          indexVersion={leaderboard.indexVersion}
          stale={leaderboard.stale}
          rankIssue={leaderboard.rankIssue}
        />
        <div className='mt-8'>
          {status === 'ok' ? (
            <LeaderboardBoard rows={leaderboard.rows} />
          ) : (
            <LeaderboardPlaceholder status={status} />
          )}
        </div>
        {showAttribution ? (
          <Attribution
            sourceName={sourceName}
            sourceUrl={sourceUrl}
            licenseNotice={licenseNotice}
          />
        ) : null}
      </main>
    </>
  )
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'leaderboard-index', locale })
  const config = props.NOTION_CONFIG

  const revalidate =
    Number(siteConfig('LEADERBOARD_REVALIDATE_SECOND', DEFAULT_REVALIDATE_SECOND, config)) ||
    DEFAULT_REVALIDATE_SECOND

  if (siteConfig('LEADERBOARD_ENABLE', false, config) !== true) {
    return {
      notFound: true,
      revalidate: process.env.EXPORT ? undefined : revalidate
    }
  }

  let leaderboard
  try {
    leaderboard = await getLeaderboardBoard(
      siteConfig('LEADERBOARD_TABLE_URL', '', config)
    )
  } catch (error) {
    // 构建期读取失败不让整站构建失败，渲染占位状态
    console.error('[leaderboard] 读取榜单失败:', error)
    leaderboard = createUnavailableBoard()
  }

  return {
    props: {
      ...props,
      // 榜单页没有文章，声明全宽以隐藏侧边栏，让表格有足够宽度
      fullWidth: true,
      leaderboard,
      sourceName: siteConfig('LEADERBOARD_SOURCE_NAME', '', config),
      sourceUrl: siteConfig('LEADERBOARD_SOURCE_URL', '', config),
      licenseNotice: siteConfig('LEADERBOARD_LICENSE_NOTICE', '', config),
      showAttribution: siteConfig('LEADERBOARD_SHOW_ATTRIBUTION', false, config) === true
    },
    revalidate: process.env.EXPORT
      ? undefined
      : leaderboard.status === 'unavailable'
        ? UNAVAILABLE_REVALIDATE_SECOND
        : revalidate
  }
}

export default LeaderboardPage
