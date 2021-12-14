export interface SteamServer {
    addr: string;
    gameport: number;
    steamid: string;
    name: string;
    appid: number;
    gamedir: string;
    version: string;
    product: string;
    region: number;
    players: number;
    max_players: number;
    bots: number;
    map: string;
    secure: boolean;
    dedicated: boolean;
    os: string;
    gametype: string;
}