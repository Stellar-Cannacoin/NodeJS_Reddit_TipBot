require('dotenv').config()

const { collectKarma, karmaPayout } = require('../libs/cron')

/**
 * Test CRON
 */
// test('collectKarma', () => {
//     return collectKarma().then(async (data) => {
//         expect(data).toBe(true)
//     });
// });

test('payoutKarma', () => {
    return karmaPayout().then(async (data) => {
        expect(data).toBe(true)
    });
})