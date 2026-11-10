import { appendLeaderboardMenu, LEADERBOARD_PATH } from '@/lib/db/leaderboard/menu'

describe('appendLeaderboardMenu', () => {
  const menu = [{ id: 'home', name: '首页', href: '/' }]

  it('returns the menu unchanged when the switch is off', () => {
    expect(appendLeaderboardMenu(menu, { LEADERBOARD_ENABLE: false })).toBe(menu)
  })

  it('appends a leaderboard entry when the switch is on', () => {
    const result = appendLeaderboardMenu(menu, { LEADERBOARD_ENABLE: true })

    expect(result).toHaveLength(2)
    expect(result[1]).toMatchObject({
      name: '榜单',
      href: LEADERBOARD_PATH,
      icon: 'fas fa-trophy',
      show: true
    })
    expect(menu).toHaveLength(1)
  })

  it('uses the configured menu name', () => {
    const result = appendLeaderboardMenu(menu, {
      LEADERBOARD_ENABLE: true,
      LEADERBOARD_MENU_NAME: 'Leaderboard'
    })
    expect(result[1].name).toBe('Leaderboard')
  })

  it('does not duplicate an entry that already points to the leaderboard', () => {
    const existing = [...menu, { id: 'manual', name: '榜单', href: LEADERBOARD_PATH }]
    expect(appendLeaderboardMenu(existing, { LEADERBOARD_ENABLE: true })).toBe(existing)
  })
})
