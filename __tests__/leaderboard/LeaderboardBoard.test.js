import LeaderboardBoard from '@/components/Leaderboard/LeaderboardBoard'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}))

const row = (overrides) => ({
  id: overrides.name,
  modelId: '',
  creator: 'Vendor',
  intelligence: null,
  inputPrice: null,
  outputPrice: null,
  outputTps: null,
  ttft: null,
  indexVersion: 4,
  syncedAt: null,
  ...overrides
})

const ROWS = [
  row({ name: 'Alpha', rank: 1, creator: 'OpenCo', intelligence: 60, inputPrice: 3, outputTps: 90, ttft: 0.6 }),
  row({ name: 'Beta', rank: 2, creator: 'Acme', intelligence: 55, inputPrice: 0.5, outputTps: 150, ttft: 0.3 }),
  row({ name: 'Gamma', rank: 3, creator: 'Acme', intelligence: 50, inputPrice: null, outputTps: null, ttft: null }),
  row({ name: 'Delta', rank: 4, creator: '', intelligence: null, inputPrice: 1, outputTps: 120, ttft: 0.9 }),
  row({ name: 'Epsilon', rank: 5, creator: 'OpenCo', intelligence: 40, inputPrice: 2, outputTps: 60, ttft: 1.1 })
]

const bodyRowNames = () => {
  const table = screen.getByRole('table')
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map(tr => within(tr).getAllByRole('cell')[1].querySelector('.font-medium').textContent)
}

const sortChip = name =>
  within(screen.getByRole('group', { name: '排序方式' })).getByRole('button', { name })

describe('LeaderboardBoard', () => {
  let replace

  beforeEach(() => {
    replace = jest.fn()
    useRouter.mockReturnValue({
      isReady: true,
      pathname: '/leaderboard',
      query: {},
      replace
    })
  })

  it('sorts by intelligence by default and renders empty metrics as dashes', () => {
    render(<LeaderboardBoard rows={ROWS} />)

    expect(bodyRowNames()).toEqual(['Alpha', 'Beta', 'Gamma', 'Epsilon', 'Delta'])
    expect(sortChip('综合分')).toHaveAttribute('aria-pressed', 'true')

    const table = screen.getByRole('table')
    const deltaRow = within(table).getAllByRole('row').find(tr => tr.textContent.includes('Delta'))
    expect(within(deltaRow).getAllByText('—').length).toBeGreaterThan(0)
    expect(within(deltaRow).getAllByText('未测量').length).toBeGreaterThan(0)
  })

  it('switches sort from the chips and writes the state to the URL', () => {
    render(<LeaderboardBoard rows={ROWS} />)

    fireEvent.click(sortChip('价格'))

    expect(bodyRowNames()).toEqual(['Beta', 'Delta', 'Epsilon', 'Alpha', 'Gamma'])
    expect(replace).toHaveBeenCalledWith(
      { pathname: '/leaderboard', query: { sort: 'price' } },
      undefined,
      { shallow: true, scroll: false }
    )
  })

  it('sets aria-sort on the active sortable header and changes it from the header', () => {
    render(<LeaderboardBoard rows={ROWS} />)

    const table = screen.getByRole('table')
    const headers = within(table).getAllByRole('columnheader')
    const intelligenceHeader = headers.find(th => th.textContent.includes('综合分'))
    const speedHeader = headers.find(th => th.textContent.includes('输出速度'))
    expect(intelligenceHeader).toHaveAttribute('aria-sort', 'descending')
    expect(speedHeader).toHaveAttribute('aria-sort', 'none')

    fireEvent.click(within(speedHeader).getByRole('button'))

    expect(speedHeader).toHaveAttribute('aria-sort', 'descending')
    expect(bodyRowNames()[0]).toBe('Beta')
  })

  it('filters by search text across model names and vendors', () => {
    render(<LeaderboardBoard rows={ROWS} />)

    fireEvent.change(screen.getByLabelText('搜索模型或厂商'), { target: { value: 'acme' } })

    expect(bodyRowNames()).toEqual(['Beta', 'Gamma'])
    expect(replace).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: { q: 'acme' } }),
      undefined,
      expect.any(Object)
    )
  })

  it('filters by vendor and shows an empty state with a reset action', () => {
    render(<LeaderboardBoard rows={ROWS} />)

    fireEvent.change(screen.getByLabelText('厂商'), { target: { value: 'OpenCo' } })
    expect(bodyRowNames()).toEqual(['Alpha', 'Epsilon'])

    fireEvent.change(screen.getByLabelText('搜索模型或厂商'), { target: { value: 'no-such-model' } })
    expect(screen.getByText('没有匹配的模型')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }))
    expect(screen.getByLabelText('搜索模型或厂商')).toHaveValue('')
    expect(screen.getByLabelText('厂商')).toHaveValue('')
    expect(bodyRowNames()).toHaveLength(5)
  })

  it('restores state from the URL once the router is ready', () => {
    useRouter.mockReturnValue({
      isReady: true,
      pathname: '/leaderboard',
      query: { sort: 'ttft', vendor: 'Acme', theme: 'simple' },
      replace
    })

    render(<LeaderboardBoard rows={ROWS} />)

    expect(sortChip('首字延迟')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('厂商')).toHaveValue('Acme')
    expect(bodyRowNames()).toEqual(['Beta', 'Gamma'])
  })
})
