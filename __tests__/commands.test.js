const { getBotCommand, getWalletAddress, executeCommand } = require("../libs/reddit");

test('commandTipUserComment', () => {
    expect(getBotCommand(`!canna 10`)).toBe('!canna');
});

test('commandDeposit', () => {
    expect(getBotCommand(`deposit`)).toBe('deposit');
});

test('commandHelp', () => {
    expect(getBotCommand(`help`)).toBe('help');
});

test('commandSend', () => {
    expect(getBotCommand('send 10 u/Stellar__TipBot')).toBe('send');
});

test('commandSendGetUser', () => {
    expect(getWalletAddress(`send 10 u/${process.env.REDDIT_USERNAME}`)).toBe(`u/${process.env.REDDIT_USERNAME}`);
});

test('commandSendGetWallet', () => {
    expect(getWalletAddress(`send 10 ${process.env.WALLET_PUBLIC}`)).toBe(process.env.WALLET_PUBLIC);
});

test('commandLeaderboard', () => {
    expect(getBotCommand(`leaderboard`)).toBe('leaderboard');
});