const Steam = require('../lib')

const api = new Steam(process.env.STEAM_API_KEY)

it('should resolve vanity', async () => {
  const response = await api.resolveId('cmdline')
  expect(response).toBe('76561198052893297')
})

it('getNewsForApp()', async () => {
  const response = await api.getNewsForApp('440')
  expect(response).toBeDefined()
})

it('getGlobalAchievementPercentagesForApp()', async () => {
  const response = await api.getGlobalAchievementPercentagesForApp('440')
  expect(response).toBeDefined()
})

it('getGlobalStatsForGame()', async () => {
  const response = await api.getGlobalStatsForGame('17740', 1, [
    'global.map.emp_isle'
  ])
  expect(response).toBeDefined()
})

it('getPlayerSummary()', async () => {
  const response = await api.getPlayerSummary('cmdline')
  expect(response).toBeDefined()
})

it('getOwnedGames()', async () => {
  const response = await api.getOwnedGames('cmdline')
  expect(response).toBeDefined()
})

it('getRecentlyPlayedGames()', async () => {
  const response = await api.getRecentlyPlayedGames('cmdline')
  expect(response).toBeDefined()
})

it('getPlayerBans()', async () => {
  const response = await api.getPlayerBans('cmdline')
  expect(response).toBeDefined()
})

it('getPlayerAchievements()', async () => {
  api
    .getPlayerAchievements('cmdline', '270880')
    .then(response => {
      expect(response).toBeDefined()
    })
    .catch(err => {
      expect(err.message).toBe('Profile not found or private')
    })
})

it('getUserStatsForGame()', async () => {
  //the only endpoint that gives an Internal Server Error when the profile is private --'
  api
    .getUserStatsForGame('cmdline', '270880')
    .then(response => {
      expect(response).toBeDefined()
    })
    .catch(err => {
      expect(err).toBe('Profile not found or private')
    })
})

it('getFriendList()', async () => {
  api
    .getFriendList('cmdline')
    .then(response => {
      expect(response).toBeDefined()
    })
    .catch(err => {
      expect(err.message).toBe('Profile not found or private')
    })
})

it('isPlayingSharedGame()', async () => {
  api
    .isPlayingSharedGame('cmdline', 440)
    .then(response => {
      expect(response).toBeDefined()
    })
    .catch(err => {
      expect(err.message).toBe('Profile not found or private')
    })
})

it('getSchemaForGame()', async () => {
  const response = await api.getSchemaForGame(440)
  expect(response).toBeDefined()
})

it('getAppList()', async () => {
  const response = await api.getAppList()
  expect(response).toBeDefined()
})

it('getAppInfo()', async () => {
  const response = await api.getAppInfo(440)
  expect(response).toBeDefined()
})

it('getUserLevel()', async () => {
  const response = await api.getUserLevel('cmdline')
  expect(response).toBeGreaterThan(41)
})

it('getUserBadges()', async () => {
  const response = await api.getUserBadges('cmdline')
  expect(response).toBeDefined()
  expect(response).toBeInstanceOf(Array)
})

it('getNumberOfCurrentPlayers()', async () => {
  const response = await api.getNumberOfCurrentPlayers(440)
  expect(response).toBeDefined()
})
