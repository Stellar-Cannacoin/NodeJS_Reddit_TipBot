const { botLogger, readRuntimeValues, storeRuntimeValues } = require("../libs/db");



// test('insertLog', () => {
//     let document = {
//         type: "reward",
//         karma: 250000,
//         users: 100,
//         totalamount: 1000000,
//         payout: 4
//     }
//     return botLogger(document).then(async (data) => {
//         expect(data.acknowledged).toBe(true)
//     });
// });

test('Read runtime values', () => {
    return readRuntimeValues().then(async (data) => {
        console.log("current count", data)
        expect(data.count > 0).toBe(true)
    });
});

// test('Store runtime values', () => {
//     return storeRuntimeValues(5, 4).then(async (data) => {
//         console.log("result:", data)
//         expect(data.acknowledged).toBe(true)
//     });
// });