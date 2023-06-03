require('dotenv').config()

const { fetchRewardStats, fetchRewardRecords } = require('../libs/db');
const { calculateRewardPerUser } = require('../libs/reward');

/**
 * Test CRON
 */
test('fetchRewardStats', () => {
    return fetchRewardStats().then(async (data) => {
        expect(Number.isInteger(data.karma)).toBe(true)
    });
});
test('fetchRewardRecords', () => {
    return fetchRewardRecords().then(async (data) => {
        expect(Array.isArray(data)).toBe(true)
    });
});

test('calculateRewardPerUser', () => {
    expect(calculateRewardPerUser(250000)).toBe(4);
});