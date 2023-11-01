require('dotenv').config()

const { collectKarma, karmaPayout } = require('../libs/cron')

/**
 * Test CRON
 */
// test('collectKarma', () => {
//     return collectKarma().then(async (data) => {
//         expect(Array.isArray(data)).toBe(true)
//     });
// });

test('payoutKarma', async () => {
    return karmaPayout().then(async (data) => {
        expect(data).toBe(true)
    })
})