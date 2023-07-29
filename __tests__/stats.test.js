const { showDataset } = require("../libs/cron");
const { fetchRewardPostStatsMonth } = require("../libs/db");

test('showDataset', () => {
    return showDataset().then(async (data) => {
        console.log(data)
        expect(data.total_karma > 0).toBe(true)
    });
})

// test('showDataset', () => {
//     return fetchRewardPostStatsMonth('06').then(async (data) => {
//         console.log(data)
//         expect(data.total_karma > 0).toBe(true)
//     });
// })