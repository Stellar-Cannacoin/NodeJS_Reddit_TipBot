const { getWalletAddress, getAmountFromCommand, getBotCommand } = require('../libs/commands')

test('getWalletAddress', () => {
    expect(getWalletAddress('send 10 u/jest')).toBe(`u/jest`);
});

test('getWalletAddressStellar', () => {
    expect(getWalletAddress('send 10 GCFXHS4GXL6BVUCXBWXGTITROWLVYXQKQLF4YH5O5JT3YZXCYPAFBJZB')).toBe(`GCFXHS4GXL6BVUCXBWXGTITROWLVYXQKQLF4YH5O5JT3YZXCYPAFBJZB`);
});


test('getAmountFromCommand', () => {
    expect(getAmountFromCommand('send 10 u/test')).toBe('10');
});

test('getAmountFromCommand', () => {
    expect(getAmountFromCommand('send all GBP6NLT4XPWZLPSLJ54AWPMVKA6R6X44RGJFVPYDAWLZ4PJNDVQJA2GC')).toBe('all');
});

test('getBotCommand', () => {
    expect(getBotCommand('!canna 1 u/test')).toBe('!canna');
    expect(getBotCommand('balance')).toBe('balance');
    expect(getBotCommand('deposit')).toBe('deposit');
    expect(getBotCommand('send')).toBe('send');
    expect(getBotCommand('link')).toBe(false);
    expect(getBotCommand('help')).toBe('help');
});