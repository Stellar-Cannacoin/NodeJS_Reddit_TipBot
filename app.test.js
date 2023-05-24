require('dotenv').config()

const { logger } = require('./libs/util')
const { calculateRewardPerUser } = require('./libs/reward')
const { storeDailyScore, fetchRewardRecords, fetchRewardStats } = require('./libs/db')
const { isValidAddress, depositToWallet, paymentListener } = require('./libs/stellar')
const { messageStream, commentStream, getWalletAddress, getAmountFromCommand, getBotCommand, executeCommand } = require('./libs/reddit')

/**
 * Test utility functions
 */
test('logger', () => {
    expect(logger('jest')).toBe(`jest`);
});

test('calculateRewardPerUser', () => {
    expect(calculateRewardPerUser(250000)).toBe(4);
});


/**
 * Test database functions
 */
test('storeDailyScore', () => {
    return storeDailyScore({ user: 'u/jest', score: 10 }).then(({ acknowledged }) => {
        expect(acknowledged).toBe(true)
    });
});

test('fetchRewardRecords', () => {
    return fetchRewardRecords().then((data) => {
        expect(Array.isArray(data)).toBe(true)
    });
});

test('fetchRewardStats', () => {
    return fetchRewardStats().then(({ karma }) => {
        expect(karma >= 0).toBe(true)
    });
});

/**
 * Test tipbot commands
 */
test('isValidAddress', () => {
    expect(isValidAddress('GCWEPTDTJHVR7OKB7GC7QH3FBYOQEJWMCWEZ3XJLLG7TBW73GR7ZLOEK')).toBe(true);
});
test('depositToWallet', () => {
    expect(depositToWallet('u/jest')).toBe(`Send payment to the address '${process.env.WALLET_PUBLIC}' with the memo 'u/jest'`);
});
test('paymentListener', () => {
    return paymentListener().then((data) => {
        expect(data).toBe(true)
    });
});

/**
 * Test reddit support functions
 */
test('messageStream', () => {
    return messageStream().then((data) => {
        expect(data).toBe(true)
    });
});

test('commentStream', () => {
    return commentStream().then((data) => {
        expect(Array.isArray(data)).toBe(true)
    });
});

test('getWalletAddress', () => {
    expect(getWalletAddress('send 10 u/test')).toBe(`u/test`);
});

test('getAmountFromCommand', () => {
    expect(getAmountFromCommand('send 10 u/test')).toBe('10');
});

test('getBotCommand', () => {
    expect(getBotCommand('!cannatest 1 u/test')).toBe('!cannatest');
    expect(getBotCommand('balance')).toBe('balance');
    expect(getBotCommand('deposit')).toBe('deposit');
    expect(getBotCommand('send')).toBe('send');
    expect(getBotCommand('link')).toBe(false);
    expect(getBotCommand('help')).toBe('help');
});
