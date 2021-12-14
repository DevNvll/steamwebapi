import {Steam} from '../lib';
import dotenv from 'dotenv';
import {SteamPlayerBans} from '../lib/types/SteamPlayerBans';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const api =  new Steam(process.env.STEAM_API_KEY);

const testData = {
    a: {vanityId: 'Pho3niX90', steamId: '76561198007433923', name: 'Pho3niX90'},
    b: {vanityId: 'kingdomrust', steamId: '76561199044451528', name: 'KingdomRust.com'}
}


const testAppId = 252490;

it('constructor test', async () => {
    expect(api).toBeDefined();
    // @ts-ignore
    expect(() => new Steam()).toThrow(TypeError);
})

it('should resolve vanity', async () => {
    const vanityResponse = await api.resolveId(testData.a.vanityId);
    const steamResponse = await api.resolveId(testData.a.steamId);
    expect(vanityResponse).toBe(testData.a.steamId)
    expect(steamResponse).toBe(testData.a.steamId)

    api.resolveId(null).catch(err => expect(err.message).toBe('ID not provided.'))
    api.resolveId('null/*-/-*').catch(err => expect(err.message).toBe('ID not found.'))
})

it('getNewsForApp()', async () => {
    const response = await api.getNewsForApp(testAppId);
    expect(response).toBeDefined()

    api.getNewsForApp(null).catch(err => expect(err.message).toBe('AppID not provided.'));
    api.getNewsForApp(74545454687846).catch(err => expect(err.message).toBe('Game not found.'))
})

it('getGlobalAchievementPercentagesForApp()', async () => {
    const response = await api.getGlobalAchievementPercentagesForApp(testAppId);
    expect(response).toBeDefined()

    api.getGlobalAchievementPercentagesForApp(null).catch(err => expect(err.message).toBe('AppID not provided.'));
    api.getGlobalAchievementPercentagesForApp(74545454687846).catch(err => expect(err.message).toBe('Game not found.'))
})

it('getGlobalStatsForGame()', async () => {
    const response = await api.getGlobalStatsForGame(testAppId, 1, [
        'bullet_fired'
    ]);
    expect(response).toBeDefined()

    await api.getGlobalStatsForGame(null, 0, null).catch(err => expect(err.message).toBe('AppID not provided.'));
    await api.getGlobalStatsForGame(74545454687846, 0, null).catch(err => expect(err.message).toBe('Count must be larger than 1'));
    await api.getGlobalStatsForGame(74545454687846, 1, null).catch(err => expect(err.message).toBe('You must provide an array of achievement names.'));
    await api.getGlobalStatsForGame(74545454687846, 1, ['bullet_fired']).catch(err => expect(err.message).toBe('Game not found.'));
})

it('getPlayerSummary()', async () => {
    const response = await api.getPlayerSummary(testData.a.vanityId);
    expect(response).toBeDefined()
    expect(response.steamid).toEqual(testData.a.steamId);
    await api.getPlayerSummary(null).catch(err => expect(err.message).toBe('ID not provided.'));
})

it('getPlayersSummary()', async () => {
    const response = await api.getPlayersSummary([testData.a.steamId, testData.b.steamId]);
    expect(response).toBeDefined();
    expect(response.players.length).toEqual(2);


    api.getPlayersSummary(null).catch(err => expect(err.message).toBe('IDs not provided.'));
    api.getPlayersSummary([]).catch(err => expect(err.message).toBe('IDs not provided.'));

    const arr1 = response.players[0];
    const arr2 = response.players[1];
    expect([testData.a.steamId, testData.b.steamId].includes(arr1.steamid)).toEqual(true);
    expect([arr1.personaname, arr2.personaname].includes(testData.a.name)).toEqual(true);

    expect([testData.a.steamId, testData.b.steamId].includes(arr2.steamid)).toEqual(true);
    expect([arr1.personaname, arr2.personaname].includes(testData.b.name)).toEqual(true);
})

it('getOwnedGames()', async () => {
    const response = await api.getOwnedGames(testData.a.vanityId);
    expect(response).toBeDefined()

    const testApp = response.filter(x => x.appid === testAppId);
    expect(testApp.length).toEqual(1);

    expect(testApp.shift().playtime_forever).toBeGreaterThan(248296)
})

it('getRecentlyPlayedGames()', async () => {
    const response = await api.getRecentlyPlayedGames(testData.a.vanityId);
    expect(response).toBeDefined()
})

it('getPlayerBans()', async () => {
    const response = await api.getPlayerBans(testData.a.vanityId);
    expect(response).toBeDefined()
    expect(Object.keys(response).length).toEqual(7);
    expect(response).toEqual(<SteamPlayerBans>{
        SteamId: testData.a.steamId,
        CommunityBanned: false,
        VACBanned: false,
        NumberOfVACBans: 0,
        DaysSinceLastBan: 0,
        NumberOfGameBans: 0,
        EconomyBan: 'none'
    })
})

it('getPlayerAchievements()', async () => {
    const response = api.getPlayerAchievements(testData.a.vanityId, testAppId);
    const achieved = api.getPlayerAchievements(testData.a.vanityId, testAppId, true);
    expect(await response).toBeDefined();
    expect(await achieved).toBeDefined();

    await api.getPlayerAchievements(testData.a.vanityId, null).catch(err => expect(err.message).toBe('AppID not provided.'));
    await api.getPlayerAchievements(testData.a.vanityId, null, true).catch(err => expect(err.message).toBe('AppID not provided.'));
    await api.getPlayerAchievements('76561199225710783', testAppId).catch(err => expect(err.message).toBe('Profile not found or private'));
}, 30000)

it('getUserStatsForGame()', async () => {
    //the only endpoint that gives an Internal Server Error when the profile is private --'
    const response = api.getUserStatsForGame(testData.a.vanityId, testAppId);
    expect(await response).toBeDefined();

    await api.getUserStatsForGame(testData.a.vanityId, null).catch(err => expect(err.message).toBe('AppID not provided.'));
    await api.getUserStatsForGame('76561199225710783', testAppId).catch(err => expect(err.message).toBe('Profile not found or private'));
    /*api
        .getUserStatsForGame(testData.a.vanityId, testAppId)
        .then(response => {
            expect(response).toBeDefined()
        })
        .catch(err => {
            expect(err).toBe('Profile not found or private')
        })*/
});

it('getFriendList()', async () => {
    api
        .getFriendList(testData.a.vanityId)
        .then(response => {
            //TODO console.log(response);
            expect(response).toBeDefined()
        })
        .catch(err => {
            expect(err.message).toBe('Profile not found or private')
        })
});

it('isPlayingSharedGame()', async () => {

    const response = api.isPlayingSharedGame(testData.a.vanityId, testAppId)
    response.catch(err => expect(err.message).toBe('Profile not found or private'));
    const response2 = api.isPlayingSharedGame(testData.a.vanityId, null)
    response2.catch(err => expect(err.message).toBe('AppID not provided.'));

});

it('getSchemaForGame()', async () => {
    const response = await api.getSchemaForGame(testAppId);
    api.getSchemaForGame(null).catch(err => expect(err.message).toBe('AppID not provided.'));
    expect(response).toBeDefined()
});

it('getAppList()', async () => {
    const response = await api.getAppList();
    expect(response).toBeDefined()
}, 30000);

it('getAppInfo()', async () => {
    const response = await api.getAppInfo(testAppId);
    api.getAppInfo(null).catch(err => expect(err.message).toBe('AppID not provided.'));
    api.getAppInfo(76561199225710783).catch(err => expect(err.message).toBe('App not found.'));
    //TODO console.log(response);
    expect(response).toBeDefined()
});

it('getUserLevel()', async () => {
    const response = await api.getUserLevel(testData.a.vanityId);
    expect(response).toBeGreaterThan(41)

    const response2 = await api.getUserLevel('76561198975056915');
    expect(response2).toBe(-1);
});

it('getUserBadges()', async () => {
    const response = await api.getUserBadges(testData.a.vanityId);
    expect(response).toBeDefined();
    expect(response.badges).toBeInstanceOf(Array);
    await api.getUserBadges('0').catch(async err => {
        console.log(err);
        expect(err.message).toBe('Profile not found or private')
    });
});

it('getNumberOfCurrentPlayers()', async () => {
    const response = await api.getNumberOfCurrentPlayers(testAppId).catch(err => expect(err.message).toBe('AppID not provided.'));
    expect(response).toBeDefined();
    const response2 = await api.getNumberOfCurrentPlayers(0).catch(err => expect(err.message).toBe('AppID not provided.'));
});