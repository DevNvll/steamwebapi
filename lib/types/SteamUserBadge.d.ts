export interface SteamUserBadge {
    appid?: number | null,
    badgeid: number,
    level: number,
    completion_time: number,
    xp: number,
    scarcity: number,
    communityitemid?: number | null,
    border_color?: number | null
}