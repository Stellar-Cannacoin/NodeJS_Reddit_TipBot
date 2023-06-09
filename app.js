require('dotenv').config()

const cron = require('node-cron')

const reddit = require('./libs/reddit')
const { fetchRewardRecords } = require('./libs/db')

const { paymentListener } = require('./libs/stellar')
const { logger } = require('./libs/util');
const { collectKarma, karmaPayout } = require('./libs/cron')
const { transferFunds } = require('./libs/dist')

logger('Tipbot is starting')

/**
 * Collect user's karma every 24 hours
 */
// cron.schedule('59 23 * * *', async () => {
cron.schedule('30 * * * *', async () => {
    collectKarma()
})
logger('Daily CRON scheduled')

/**
 * Monthly payout routine
 */
cron.schedule('0 12 1 * *', async () => {
    karmaPayout()
})
logger('Monthly CRON scheduled')

/**
 * Monthly fund transfer to cover monthly distribution
 */
// cron.schedule('0 0 1 * *', async () => {
//     transferFunds()
//     .then(data => {
//         console.log("Successfully transferred funds")
//     })
//     .catch(error => {
//         console.log("error", error)
//     })
// })
logger('Funds management service running')
/**
 * Set user flairs every 4th hour
 */
// cron.schedule('0 */4 * * *', async () => {
//     let records = await fetchRewardRecords()
//     records.map((record, index) => {
//         setTimeout(function () {
//             let balance = record?.balances?.CANNACOIN
//             if (!balance) {
//                 balance = "0"
//             }
//             reddit.setUserFlair(record.user, `🪙 ${balance} CANNACOIN`)
//         }, 1000*index);
//     })
// })
logger('Balance listener running')

/**
 * Message Stream job
 */
cron.schedule('*/2 * * * *', async () => {
    reddit.messageStream()
})

/**
 * Stellar payment listener
 */
logger('Payment listener running')
paymentListener()

logger('TipBot is running')
