require('dotenv').config()

const { collectKarma, collectKarma2 } = require('../libs/cron');
const { fetchRewardStats, fetchRewardRecords } = require('../libs/db');
const { getSubredditPosts } = require('../libs/reddit');
const { calculateRewardPerUser, getTotalPayoutReward } = require('../libs/reward');

/**
 * Test CRON
 */
// test('fetchRewardStats', () => {
//     return fetchRewardStats().then(async (data) => {
//         console.log("Total karma:", data.karma)
//         expect(Number.isInteger(data.karma)).toBe(true)
//     });
// });
// test('fetchRewardRecords', () => {
//     return fetchRewardRecords().then(async (data) => {
//         console.log("Total users:", data.length)
//         expect(Array.isArray(data)).toBe(true)
//     });
// });

// test('calculateRewardPerUser', async () => {
//     let { karma } = await fetchRewardStats()
//     console.log("Payout per user:", await calculateRewardPerUser(karma))
//     expect(await calculateRewardPerUser(karma) > 0).toBe(true);
// });

// test('collectKarma', async () => {
//     let response = await collectKarma()
//     console.log({ response })
//     expect(Array.isArray(response)).toBe(true);
// });

test('collectKarma', async () => {
    let response = await collectKarma()
    console.log({ response })
    expect(response).toBe(true);
});
