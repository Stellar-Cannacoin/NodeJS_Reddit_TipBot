const { getBotCommand, getWalletAddress, executeCommand, getFlairParams, getTipAmount } = require("../libs/reddit");

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

test('commandSendAll', () => {
    expect(getBotCommand('send all GBP6NLT4XPWZLPSLJ54AWPMVKA6R6X44RGJFVPYDAWLZ4PJNDVQJA2GC')).toBe('send');
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

test('commandSend', () => {
    expect(getBotCommand('flair enable karma')).toBe('flair');
});

test('commandSend', () => {
    let flair = getFlairParams('flair enable karma');
    expect(flair.status).toBe('enable');
});

test('commandSend', () => {
    let flair = getFlairParams('flair enable balance');
    expect(flair.type).toBe('balance');
});

test('commandSend', () => {
    let flair = getFlairParams('flair enable karma');
    expect(flair.type).toBe('karma');
});

test('commandSend', () => {
    let flair = getFlairParams('flair disable');
    expect(flair.status).toBe('disable');
});

test('commandCommentTip', () => {
    expect(isNaN(getTipAmount('!canna 420'))).toBe(false);
});


test('commandCommentInvalidTip', () => {
    expect(getTipAmount('!canna 420')).toBe(false);
});

test('commandCommentInvalidTipInvalid', () => {
    console.log(getTipAmount('!canna420'))
    expect(getTipAmount('!canna420')).toBe(false);
});