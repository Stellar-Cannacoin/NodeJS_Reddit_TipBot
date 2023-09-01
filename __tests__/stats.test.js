// const { showDataset } = require("../libs/cron");
const { fetchRewardPostStatsMonth } = require("../libs/db");
const { showDataset } = require("../libs/reddit/karma");
const { getTotalPayoutReward } = require("../libs/reward");

test('showDataset', () => {
    return showDataset().then(async (data) => {
        console.log(data)
        expect(data.total_karma > 0).toBe(true)
    });
})

// test('currentPayout', () => {
//     expect(getTotalPayoutReward() > 1200000).toBe(true);
//     // return getTotalPayoutReward().then(async (data) => {
//     //     console.log("payout", data)
//     // })
// })

// test('showDataset', () => {
//     return fetchRewardPostStatsMonth('06').then(async (data) => {
//         console.log(data)
//         expect(data.total_karma > 0).toBe(true)
//     });
// })