require('dotenv').config()

const { fetchRewardStats, fetchRewardRecords } = require('../libs/db');
const { calculateRewardPerUser, getTotalPayoutReward } = require('../libs/reward');

/**
 * Test CRON
 */
test('fetchRewardStats', () => {
    return fetchRewardStats().then(async (data) => {
        console.log("Total karma:", data.karma)
        expect(Number.isInteger(data.karma)).toBe(true)
    });
});
test('fetchRewardRecords', () => {
    return fetchRewardRecords().then(async (data) => {
        console.log("Total users:", data.length)
        expect(Array.isArray(data)).toBe(true)
    });
});

test('calculateRewardPerUser', async () => {
    let { karma } = await fetchRewardStats()
    console.log("Payout per user:", calculateRewardPerUser(karma))
    expect(calculateRewardPerUser(karma) > 0).toBe(true);
});