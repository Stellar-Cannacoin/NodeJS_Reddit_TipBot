const { checkAccountTrust } = require("../libs/stellar");

test('check for trust', async () => {
    return checkAccountTrust('CANNACOIN', 'GBLJ4223KUWIMV7RAPQKBA7YGR4I7H2BIV4KIMMXMQWYQBOZ6HLZR3RQ', process.env.WALLET_PUBLIC).then(async (data) => {
        expect(data).toBe(true)
    });
})