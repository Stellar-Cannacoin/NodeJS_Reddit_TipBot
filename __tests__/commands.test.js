const { getBotCommand, getWalletAddress } = require("../libs/reddit");


test('commandSend', () => {
    expect(getBotCommand('send 10 u/Stellar__TipBot')).toBe('send');
});

test('commandSendGetUser', () => {
    expect(getWalletAddress(`send 10 u/${process.env.REDDIT_USERNAME}`)).toBe(`u/${process.env.REDDIT_USERNAME}`);
    
});

test('commandSendGetWalletr', () => {
    expect(getWalletAddress(`send 10 ${process.env.WALLET_PUBLIC}`)).toBe(process.env.WALLET_PUBLIC);
});