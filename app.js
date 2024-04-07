require('dotenv').config()

const cron = require('node-cron')

const reddit = require('./libs/reddit')
const { fetchRewardRecords, fetchUsers, recordPost } = require('./libs/db')

const { paymentListener } = require('./libs/stellar')
const { logger } = require('./libs/util');
const { collectKarma, karmaPayout } = require('./libs/cron')
const { transferFunds } = require('./libs/dist')

logger('Tipbot is starting')

/**
 * Collect user's karma every 24 hours
 */
// 0 */4 * * * <- every 4th hour
// */60 * * * * <- every hour
// cron.schedule('0 */4 * * *', async () => {
cron.schedule('*/90 * * * *', async () => {
    logger("Collecting karma")
    collectKarma()
})
logger('Daily CRON scheduled')

/**
 * Monthly payout routine
 */
cron.schedule('0 12 1 * *', async () => {
    karmaPayout()
    .then(result => {
        logger('Completed payout')
    })
    .catch(error => {
        logger(error)
    })
})
logger('Monthly CRON scheduled')

/**
 * Clear all messages at startup
 */
try {
    reddit.markAllMessagesAsRead()
    logger('Marked all messages as read')
} catch (error) {
    logger(error)
}

/**
 * Set user flairs every 24th hour
 */
cron.schedule('0 1 * * *', async () => {
    let records = await fetchUsers()
    records.map((record, index) => {
        setTimeout(function () {
            reddit.checkFlairUpdate(record.user, true)
            .catch(error => {
                console.log("error setting routine flairs", error)
            })
        }, 5000*index)
    })
})

/**
 * Message Stream job
 */
cron.schedule('*/2 * * * *', async () => {
    logger("Checking messages")
    try {
        reddit.messageStream()
    } catch (error) {
        logger(error)
    }
    
})

/**
 * Stellar payment listener
 */
logger('Payment listener running')
paymentListener()

logger('TipBot is running')
