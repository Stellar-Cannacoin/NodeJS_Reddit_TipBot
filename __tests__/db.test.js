const { botLogger } = require("../libs/db");



test('insertLog', () => {
    let document = {
        type: "reward",
        karma: 250000,
        users: 100,
        totalamount: 1000000,
        payout: 4
    }
    return botLogger(document).then(async (data) => {
        expect(data.acknowledged).toBe(true)
    });
});