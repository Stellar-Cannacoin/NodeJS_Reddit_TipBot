require('dotenv').config()

const axios = require('axios')
const cron = require('node-cron');

const reddit = require('./libs/reddit')
const { calculateRewardPerUser } = require('./libs/reward')
const { storeDailyScore, fetchRewardRecords, distributeReward, fetchRewardStats } = require('./libs/db')

const fs = require('fs');
const moment = require('moment');
const { paymentListener } = require('./libs/stellar');
const { logger } = require('./libs/util');
const fileName = './data/runtime.json'
const runtimeFile = require(fileName)

logger('Tipbot is starting')

/**
 * Collect user's karma every 24 hours
 */
cron.schedule('59 23 * * *', async () => {
    logger("Daily cronjob started")

    axios.get(process.env.FETCH_URL)
    .then (async ({ data }) => {
        data.data.children.map(async item => {
            let post_date = moment(item.created_utc).format('DD.MM.Y')
            let current_date = moment(new Date()).format('DD.MM.Y')
            if (post_date != current_date) {
                return
            }
            let post = {
                id: item.data.id, 
                title: item.data.title,
                score: item.data.score,
                user: item.data.author,
            }

            if (post.user == "[deleted]") {
                return
            }
            storeDailyScore(post)

            let comments = await reddit.getComments(post.id);
            comments.map(comment => {
                let upvotes = comment.ups-comment.downs
                if (upvotes > 1) {
                    let commentmeta = {
                        score: upvotes,
                        user: comment.author.name
                    }
                    if (commentmeta.user == "[deleted]") {
                        return
                    }
                    storeDailyScore(commentmeta)
                }
            })
        })
    })
})
logger('Daily CRON scheduled')


/**
 * Monthly payout rutine
 */
cron.schedule('0 0 1 * *', async () => {
    logger("Monthly cronjob started")

    let { karma } = await fetchRewardStats()
    let records = await fetchRewardRecords()
    let reward = calculateRewardPerUser(karma)

    records.map(record => {
        distributeReward(record.user, reward, "CANNACOIN")
    })

    runtimeFile.count++
    runtimeFile.lastrun = new Date()
    
    fs.writeFile(fileName, JSON.stringify(runtimeFile), function writeJSON(err) {
        if (error) { 
            return logger(`Error. ${error}`)
        }
    })
    logger("Ran monthly payout")

    reddit.createSubmission(`Monthly CANNACOIN distribution 💚💨`, `Our monhtly CANNACOIN distribution have taken place. This month we've paid out ${reward} CANNACOIN for a total of ${karma} Reddit Karma\n`)
    logger("Posted to Reddit")
})
logger('Monthly CRON scheduled')

/**
 * Set user flairs every 4th hour
 */
cron.schedule('0 */4 * * *', async () => {
    let records = await fetchRewardRecords()
    records.map((record, index) => {
        setTimeout(function () {
            let balance = record?.balances?.CANNACOIN
            if (!balance) {
                balance = "0"
            }
            reddit.setUserFlair(record.user, `🪙 ${balance} CANNACOIN`)
        }, 1000*index);
    })
})
logger('Balance listener running')

/**
 * Message Stream job
 */
cron.schedule('* * * * *', async () => {
    reddit.messageStream()
})

/**
 * Stellar payment listener
 */
logger('Payment listener running')
paymentListener()

logger('TipBot is running')
