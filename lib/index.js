const fetch = require('node-fetch')
const appendQuery = require('append-query')

const API_URL = 'http://api.steampowered.com/'

class Steam {
  constructor(token) {
    if (!token) {
      console.error('No token found! ' + 'Supply it as argument.')
    }
    this.request = endpoint => {
      const requestUrl = appendQuery(API_URL + endpoint, { key: token })
      return fetch(requestUrl).then(res => res.json())
    }
  }

  async resolveId(vanity) {
    if (!vanity) {
      throw new Error('ID not provided.')
    }
    if (('' + vanity).match(/^7656119[0-9]{10}$/i)) {
      return vanity
    } else {
      const { response } = await this.request(
        'ISteamUser/ResolveVanityURL/v0001?vanityurl=' + vanity
      )
      if (response.success === 42) {
        throw new Error('ID not found.')
      }
      return response.steamid
    }
  }

  async getNewsForApp(appid, count = 3, maxLength = 300) {
    if (!appid) {
      throw new Error('AppID not provided.')
    }
    const { appnews } = await this.request(
      `ISteamNews/GetNewsForApp/v0002?appid=${appid}&count=${count}&maxlength=${maxLength}&format=json`
    )
    if (!appnews) {
      throw new Error('Game not found.')
    }
    return appnews.newsitems
  }

  async getGlobalAchievementPercentagesForApp(appid) {
    if (!appid) {
      throw new Error('AppID not provided.')
    }
    const { achievementpercentages } = await this.request(
      `ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002?gameid=${appid}`
    )
    if (!achievementpercentages) {
      throw new Error('Game not found.')
    }
    return achievementpercentages.achievements
  }

  async getGlobalStatsForGame(appid, count = 1, achievements = []) {
    if (!appid) {
      throw new Error('AppID not provided.')
    }
    //I don't even know if this is correct
    if (achievements.length === 0) {
      throw new Error('You must provide an array of achievement names.')
    }

    let achievementsList = {}
    achievements.forEach(achiev => {
      achievementsList = {
        ...achievementsList,
        [`name[${Object.keys(achievements).length - 1}]`]: achiev
      }
    })
    const URLWithAchievements = appendQuery(
      `ISteamUserStats/GetGlobalStatsForGame/v0001?appid=${appid}&count=${count}`,
      achievementsList
    )
    const { response } = await this.request(URLWithAchievements)
    if (!response) {
      throw new Error('Game not found.')
    }
    return response.globalstats
  }

  async getPlayerSummary(id) {
    id = await this.resolveId(id)
    //TODO: accept array of ids
    if (!id) {
      throw new Error('ID not provided.')
    }
    const { response } = await this.request(
      `ISteamUser/GetPlayerSummaries/v0002?steamids=${id}`
    )
    return response
  }

  async getOwnedGames(id, include_free_games = false, include_appinfo = false) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    }
    const { response } = await this.request(
      appendQuery(
        `IPlayerService/GetOwnedGames/v1?steamid=${id}&format=json&include_played_free_games=${
          include_free_games ? 1 : 0
        }&include_appinfo=${include_appinfo ? 1 : 0}`,
        {}
      )
    )
    return response.games
  }

  async getRecentlyPlayedGames(id) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    }
    const { response } = await this.request(
      `IPlayerService/GetRecentlyPlayedGames/v0001?steamid=${id}&format=json`
    )
    return response.games
  }

  async getPlayerBans(id) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    }
    const { players } = await this.request(
      `ISteamUser/GetPlayerBans/v1?steamids=${id}`
    )
    return players[0]
  }

  async getPlayerAchievements(id, appid, onlyAchieved = false) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    } else if (!appid) {
      throw new Error('AppID not provided.')
    }
    const { playerstats } = await this.request(
      `ISteamUserStats/GetPlayerAchievements/v0001?steamid=${id}&appid=${appid}`
    )
    if (onlyAchieved) {
      return data.playerstats.achievements.filter(
        achievement => achievement.achieved === 1
      )
    }
    if (!playerstats.success) throw new Error('Profile not found or private')
    return playerstats.achievements
  }

  async getUserStatsForGame(id, appid) {
    if (!id) {
      throw new Error('ID not provided.')
    } else if (!appid) {
      throw new Error('AppID not provided.')
    }
    id = await this.resolveId(id)
    return new Promise((resolve, reject) => {
      this.request(
        `ISteamUserStats/GetUserStatsForGame/v0002?steamid=${id}&appid=${appid}`
      )
        .then(({ playerstats }) => {
          resolve(playerstats.stats)
        })
        .catch(err => {
          reject('Profile not found or private')
        })
    })
  }

  async getFriendList(id) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    }
    const { friendslist } = await this.request(
      `ISteamUser/GetFriendList/v0001?steamid=${id}&relationship=friend`
    )
    if (!friendslist) throw new Error('Profile not found or private')
    return friendslist.friends
  }

  async getUserLevel(id) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    }
    const { response } = await this.request(
      `IPlayerService/GetSteamLevel/v1?steamid=${id}`
    )
    if (!response) throw new Error('Profile not found or private')
    return response.player_level
  }

  async isPlayingSharedGame(id, appid) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    } else if (!appid) {
      throw new Error('AppID not provided.')
    }
    const { response } = await this.request(
      `IPlayerService/IsPlayingSharedGame/v0001?steamid=${id}&appid_playing=${appid}`
    )
    if (!response.success) throw new Error('Profile not found or private')
    return response.lender_steamid
  }

  async getSchemaForGame(appid) {
    if (!appid) {
      throw new Error('AppID not provided.')
    }
    const { game } = await this.request(
      `ISteamUserStats/GetSchemaForGame/v2?appid=${appid}`
    )
    return game
  }

  async getAppList() {
    const { applist } = await this.request('ISteamApps/GetAppList/v0002')
    return applist.apps
  }

  async getAppInfo(appid) {
    if (!appid) {
      throw new Error('AppID not provided.')
    }
    const app = await fetch(
      'http://store.steampowered.com/api/appdetails?appids=' + appid
    ).then(res => res.json())
    if (!app[appid].success) {
      throw new Error('App not found.')
    }
    return app[appid]
  }

  async getUserBadges(id) {
    id = await this.resolveId(id)
    if (!id) {
      throw new Error('ID not provided.')
    }
    const { response } = await this.request(
      `IPlayerService/GetBadges/v1?steamid=${id}`
    )
    if (!response) throw new Error('Profile not found or private')
    return response.badges
  }
}

module.exports = Steam
