import {SteamOwnedGame} from './SteamOwnedGame';

export interface SteamPlayedGame extends SteamOwnedGame {
    name: string;
    playtime_2weeks: number;
    img_icon_url: string;
    img_logo_url: string;
}