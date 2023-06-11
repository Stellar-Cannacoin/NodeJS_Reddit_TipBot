const { showDataset } = require("../libs/cron")

test('showDataset', () => {
    return showDataset().then(async (data) => {
        console.log(data)
        expect(data.total_karma > 0).toBe(true)
    });
})