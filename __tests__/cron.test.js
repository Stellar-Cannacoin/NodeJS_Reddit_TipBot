require('dotenv').config()

const { collectKarma } = require('../libs/cron')

/**
 * Test CRON
 */
test('collectKarma', () => {
    return collectKarma().then(async (data) => {
        expect(data).toBe(true)
    });
});