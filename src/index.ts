import {SteamServer} from './types/SteamServer';
import {SteamAppIdPlayers} from './types/SteamAppIdPlayers';
import {SteamUserBadge} from './types/SteamUserBadge';
import {SteamPlayerSummary} from './types/SteamPlayerSummary';
import {SteamOwnedGame} from './types/SteamOwnedGame';
import {SteamPlayedGame} from './types/SteamPlayedGame';
import {SteamPlayerBans} from './types/SteamPlayerBans';
import {SteamAchievement} from './types/SteamAchievement';
import {SteamFriend} from './types/SteamFriend';

const fetch = require('node-fetch');
const appendQuery = require('append-query');

const API_URL = 'http://api.steampowered.com/';

export class Steam {
    token;

    constructor(token) {
        if (!token) {
            throw new Error('No token found! Supply it as argument.')
        } else {
            this.token = token;
        }
    }

    request(endpoint): Promise<any> {
        //const requestUrl = appendQuery(API_URL + endpoint, {key: token})
        return fetch(appendQuery(API_URL + endpoint, {key: this.token})).then(res => res.json())
    }

    /***
     * Transforms a vanity SteamId into a Steam64Id
     * @param vanity
     */
    async resolveId(vanity: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (!vanity) {
                return reject(new Error('ID not provided.'));
            }
            if (('' + vanity).match(/^7656119[0-9]{10}$/i)) {
                resolve(vanity);
            } else {
                const {response} = await this.request(
                    'ISteamUser/ResolveVanityURL/v0001?vanityurl=' + vanity
                )
                if (!response || Object.keys(response).length === 0 || response.success === 42) {
                    return reject(new Error('ID not found.'));
                }
                resolve(response.steamid)
            }
        });
    }

    async getNewsForApp(appid: number, count = 3, maxLength = 300) {
        return new Promise(async (resolve, reject) => {
            if (!appid) {
                return reject(new Error('AppID not provided.'));
            }
            const {appnews} = await this.request(
                `ISteamNews/GetNewsForApp/v0002?appid=${appid}&count=${count}&maxlength=${maxLength}&format=json`
            )
            if (!appnews) {
                return reject(new Error('Game not found.'))
            }
            resolve(appnews.newsitems)
        })
    }

    async getGlobalAchievementPercentagesForApp(appid: number): Promise<SteamAchievement[]> {
        return new Promise(async (resolve, reject) => {
            if (!appid) {
                return reject(new Error('AppID not provided.'))
            }
            const {achievementpercentages} = await this.request(
                `ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002?gameid=${appid}`
            )
            if (!achievementpercentages || Object.keys(achievementpercentages).length === 0) {
                return reject(new Error('Game not found.'))
            }
            resolve(achievementpercentages.achievements)
        });
    }

    async getGlobalStatsForGame(appid: number, count = 1, achievements: string[] = []): Promise<any> {
        return new Promise(async (resolve, reject) => {
            if (!appid) {
                return reject(new Error('AppID not provided.'));
            }
            if (count < 1) {
                return reject(new Error('Count must be larger than 1'));
            }

            if (!achievements || achievements.length === 0) {
                return reject(new Error('You must provide an array of achievement names.'));
            }

            let achievementsList = {};

            achievements.forEach((achiev, index) => {
                achievementsList = {
                    ...achievementsList,
                    [`name[${index}]`]: achiev
                }
            });

            const URLWithAchievements = appendQuery(
                `ISteamUserStats/GetGlobalStatsForGame/v0001?appid=${appid}&count=${count}`,
                achievementsList
            )
            const {response} = await this.request(URLWithAchievements)
            if (!response || Object.keys(response).length === 0 || response.result == 20) {
                return reject(new Error('Game not found.'));
            }
            resolve(response.globalstats);
        });
    }

    /***
     * Accepts both vanity id and steam64Ids
     * @param id
     */
    async getPlayerSummary(id: string): Promise<SteamPlayerSummary> {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            const {response} = await this.request(
                `ISteamUser/GetPlayerSummaries/v0002?steamids=${id}`
            )
            resolve(response?.players.shift());
        });
    }

    /***
     * Accepts ONLY steam64Ids
     * @param ids
     */
    async getPlayersSummary(ids: string[]): Promise<SteamPlayerSummary[]> {
        return new Promise(async (resolve, reject) => {
            if (!ids || ids.length < 1) {
                return reject(new Error('IDs not provided.'));
            }
            const {response} = await this.request(
                `ISteamUser/GetPlayerSummaries/v0002?steamids=${ids.join(',')}`
            )
            resolve(response.players);
        })
    }

    async getOwnedGames(id: string, include_free_games = false, include_appinfo = false): Promise<SteamOwnedGame[]> {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            const {response} = await this.request(
                appendQuery(
                    `IPlayerService/GetOwnedGames/v1?steamid=${id}&format=json&include_played_free_games=${
                        include_free_games ? 1 : 0
                    }&include_appinfo=${include_appinfo ? 1 : 0}`,
                    {}
                )
            )
            resolve(response.games);
        });
    }

    async getRecentlyPlayedGames(id: string): Promise<SteamPlayedGame[]> {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            const {response} = await this.request(
                `IPlayerService/GetRecentlyPlayedGames/v0001?steamid=${id}&format=json`
            )
            resolve(response.games);
        });
    }

    async getPlayerBans(id: string): Promise<SteamPlayerBans> {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            const {players} = await this.request(
                `ISteamUser/GetPlayerBans/v1?steamids=${id}`
            )
            resolve(players.shift());
        });
    }

    async getPlayerAchievements(id: string, appid: number, onlyAchieved = false) {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            if (!appid) {
                return reject(new Error('AppID not provided.'));
            }
            const {playerstats} = await this.request(
                `ISteamUserStats/GetPlayerAchievements/v0001?steamid=${id}&appid=${appid}`
            )
            if (onlyAchieved) {
                resolve(playerstats.achievements.filter(
                    achievement => achievement.achieved === 1
                ))
            }
            if (!playerstats.success)
                return reject(new Error('Profile not found or private'));
            resolve(playerstats.achievements);
        })
    }

    async getUserStatsForGame(id: string, appid) {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            if (!appid) {
                reject(new Error('AppID not provided.'));
            }
            this.request(`ISteamUserStats/GetUserStatsForGame/v0002?steamid=${id}&appid=${appid}`)
                .then(response => {
                    resolve(response.playerstats.stats)
                })
                .catch(() => {
                    reject(new Error('Profile not found or private'))
                })
        })
    }

    async getFriendList(id: string): Promise<SteamFriend[]> {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            const response = await this.request(
                `ISteamUser/GetFriendList/v0001?steamid=${id}&relationship=friend`
            )
            console.log(response)
            if (!response.friendslist) return reject(new Error('Profile not found or private'));
            console.log(JSON.stringify(response.friendslist.friends))
            resolve(response.friendslist.friends);
        });
    }

    /***
     * Gets the players steam level, returns -1 if private or not found.
     * @param id
     */
    async getUserLevel(id: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            const {response} = await this.request(
                `IPlayerService/GetSteamLevel/v1?steamid=${id}`
            )

            if (!response || Object.keys(response).length === 0)
                resolve(-1);

            resolve(response.player_level);
        });
    }

    async isPlayingSharedGame(id: string, appid: number) {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            if (!appid) {
                return reject(new Error('AppID not provided.'));
            }
            const {response} = await this.request(
                `IPlayerService/IsPlayingSharedGame/v0001?steamid=${id}&appid_playing=${appid}`
            )
            if (!response.success)
                return reject(new Error('Profile not found or private'))
            resolve(response.lender_steamid)
        })
    }

    async getSchemaForGame(appid: number) {
        return new Promise(async (resolve, reject) => {
            if (!appid) {
                return reject(new Error('AppID not provided.'))
            }
            const {game} = await this.request(
                `ISteamUserStats/GetSchemaForGame/v2?appid=${appid}`
            )
            return resolve(game);
        })
    }

    async getAppList() {
        const {applist} = await this.request('ISteamApps/GetAppList/v2')
        return applist.apps
    }

    async getAppInfo(appid: number) {
        return new Promise(async (resolve, reject) => {
            if (!appid) {
                return reject(new Error('AppID not provided.'));
            }
            const app = await fetch(
                'http://store.steampowered.com/api/appdetails?appids=' + appid
            ).then(res => res.json())
            if (!app[appid].success) {
                return reject(new Error('App not found.'))
            }
            resolve(app[appid]);
        });
    }

    async getUserBadges(id: string): Promise<SteamUserBadge[]> {
        return new Promise(async (resolve, reject) => {
            id = await this.resolveId(id).catch(reject) || '';
            const {response} = await this.request(
                `IPlayerService/GetBadges/v1?steamid=${id}`
            );

            if (!response || Object.keys(response).length == 0) {
                return reject(new Error('Profile not found or private'));
            }
            resolve(response.badges);
        });
    }

    async getNumberOfCurrentPlayers(appid: number): Promise<SteamAppIdPlayers> {
        return new Promise(async (resolve, reject) => {
            if (!appid) {
                reject(new Error('AppID not provided.'))
            }

            const {response} = await this.request(
                `ISteamUserStats/GetNumberOfCurrentPlayers/v1?appid=${appid}`
            )
            resolve(<SteamAppIdPlayers>response);
        })
    }

    /***
     * See https://developer.valvesoftware.com/wiki/Master_Server_Query_Protocol#Filter for filter info
     * @param filter
     * @param limit
     */
    async getServerList(filter: string, limit?: number): Promise<SteamServer[]> {
        return new Promise(async (resolve, reject) => {
            if (!filter || filter.length === 0) {
                return reject(new Error('Filter not provided.'));
            }

            let url = `IGameServersService/GetServerList/v1?filter=${filter}`;
            if (limit) {
                url = appendQuery(url, {limit: limit});
            }

            const {response} = await this.request(url);
            if (!response || Object.keys(response).length === 0 || !response.servers) {
                return reject(new Error('Response from steam invalid.'));
            }

            resolve(response.servers as SteamServer[]);
        });
    }
}