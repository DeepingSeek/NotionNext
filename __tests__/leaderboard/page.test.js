import LeaderboardPage, { getStaticProps } from '@/pages/leaderboard/index'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { getLeaderboardBoard } from '@/lib/db/leaderboard/getLeaderboardRows'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/lib/db/SiteDataApi', () => ({
  fetchGlobalAllData: jest.fn()
}))

jest.mock('@/lib/db/leaderboard/getLeaderboardRows', () => ({
  getLeaderboardBoard: jest.fn(),
  createUnavailableBoard: () => ({
    status: 'unavailable',
    rows: [],
    syncedAt: null,
    indexVersion: null,
    stale: false,
    rankIssue: false,
    invalidRows: 0
  })
}))

const okBoard = {
  status: 'ok',
  rows: [
    {
      id: 'r1',
      modelId: 'aa-1',
      name: 'Alpha',
      rank: 1,
      creator: 'OpenCo',
      intelligence: 60,
      inputPrice: 1,
      outputPrice: 2,
      outputTps: 100,
      ttft: 0.5,
      indexVersion: 4,
      syncedAt: '2026-11-10T11:00:00.000Z'
    }
  ],
  syncedAt: '2026-11-10T11:00:00.000Z',
  indexVersion: 4,
  stale: false,
  rankIssue: false,
  invalidRows: 0
}

const globalData = (config = {}) => ({
  NOTION_CONFIG: config,
  siteInfo: { title: 'Test' }
})

describe('leaderboard getStaticProps', () => {
  beforeEach(() => {
    fetchGlobalAllData.mockReset()
    getLeaderboardBoard.mockReset()
  })

  it('returns notFound when the switch is off and does not read the table', async () => {
    fetchGlobalAllData.mockResolvedValue(globalData({ LEADERBOARD_ENABLE: false }))

    const result = await getStaticProps({ locale: 'zh-CN' })

    expect(result).toEqual({ notFound: true, revalidate: 86400 })
    expect(getLeaderboardBoard).not.toHaveBeenCalled()
  })

  it('returns board props with full width when enabled', async () => {
    fetchGlobalAllData.mockResolvedValue(
      globalData({
        LEADERBOARD_ENABLE: true,
        LEADERBOARD_TABLE_URL: 'https://www.notion.so/x-0123456789abcdef0123456789abcdef',
        LEADERBOARD_REVALIDATE_SECOND: 3600
      })
    )
    getLeaderboardBoard.mockResolvedValue(okBoard)

    const result = await getStaticProps({ locale: 'zh-CN' })

    expect(getLeaderboardBoard).toHaveBeenCalledWith(
      'https://www.notion.so/x-0123456789abcdef0123456789abcdef'
    )
    expect(result.props).toMatchObject({
      fullWidth: true,
      leaderboard: okBoard,
      sourceName: '国内MIT',
      sourceUrl: '',
      licenseNotice: '',
      showAttribution: false
    })
    expect(result.revalidate).toBe(3600)
  })

  it('shows attribution in props only when the switch is on', async () => {
    fetchGlobalAllData.mockResolvedValue(
      globalData({ LEADERBOARD_ENABLE: true, LEADERBOARD_SHOW_ATTRIBUTION: true })
    )
    getLeaderboardBoard.mockResolvedValue(okBoard)

    const result = await getStaticProps({ locale: 'zh-CN' })

    expect(result.props.showAttribution).toBe(true)
  })

  it('falls back to a placeholder and a short revalidate when reading fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    fetchGlobalAllData.mockResolvedValue(globalData({ LEADERBOARD_ENABLE: true }))
    getLeaderboardBoard.mockRejectedValue(new Error('network'))

    const result = await getStaticProps({ locale: 'zh-CN' })

    expect(result.props.leaderboard.status).toBe('unavailable')
    expect(result.revalidate).toBe(300)
    errorSpy.mockRestore()
  })

  it('uses a short revalidate when the table is not configured', async () => {
    fetchGlobalAllData.mockResolvedValue(globalData({ LEADERBOARD_ENABLE: true }))
    getLeaderboardBoard.mockResolvedValue({ ...okBoard, status: 'unavailable', rows: [] })

    const result = await getStaticProps({ locale: 'zh-CN' })

    expect(result.revalidate).toBe(300)
  })
})

describe('LeaderboardPage', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ isReady: true, pathname: '/leaderboard', query: {}, replace: jest.fn() })
  })

  const baseProps = {
    NOTION_CONFIG: {},
    sourceName: '国内MIT',
    sourceUrl: 'https://example.com/source',
    licenseNotice: 'MIT License 声明'
  }

  it('hides attribution by default', () => {
    render(<LeaderboardPage {...baseProps} leaderboard={okBoard} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI 模型排行榜')
    expect(screen.queryByText(/指数版本/)).toBeNull()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '国内MIT' })).toBeNull()
    expect(screen.queryByText('MIT License 声明')).toBeNull()
  })

  it('renders attribution with a source link when enabled', () => {
    render(<LeaderboardPage {...baseProps} showAttribution leaderboard={okBoard} />)

    const link = screen.getByRole('link', { name: '国内MIT' })
    expect(link).toHaveAttribute('href', 'https://example.com/source')
    expect(screen.getByText('MIT License 声明')).toBeInTheDocument()
  })

  it('renders a placeholder instead of the table when data is unavailable', () => {
    render(
      <LeaderboardPage
        {...baseProps}
        leaderboard={{ ...okBoard, status: 'unavailable', rows: [] }}
      />
    )

    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('数据暂不可用，请稍后再试。')).toBeInTheDocument()
  })
})
