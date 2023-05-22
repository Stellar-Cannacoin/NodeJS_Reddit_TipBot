require('dotenv').config()

const axios = require('axios')
const cron = require('node-cron');

// const { CommentStream } = require("snoostorm")
// const Snoowrap = require('snoowrap')
// const Snoostorm = require('snoostorm')
const reddit = require('./libs/reddit')
const { calculateRewardPerUser } = require('./libs/reward')
const { storeDailyScore, fetchRewardRecords, resetScore, tipUser, distributeReward, fetchRewardStats, getUserBalance, updateBalance } = require('./libs/db')

const fs = require('fs');
const moment = require('moment');
const { depositToWallet, withdrawToWallet, paymentListener } = require('./libs/stellar');
const fileName = './data/runtime.json'
const runtimeFile = require(fileName)
    


// const r = new Snoowrap({
// 	userAgent: 'some-description',
// 	clientId: process.env.APP_ID,
// 	clientSecret: process.env.API_SECRET,
// 	username: process.env.REDDIT_USERNAME,
// 	password: process.env.REDDIT_PASSWORD
// })

// const stream = new CommentStream(r, { subreddit: "stashapp", results: 25 })

// stream.on("item", comment => {
//     console.log(comment)
// })


/**
 * Run cronjob every 24 hour
 * Fetch JSON from /new
 * Check timestamp @date
 * Insert row into db
 * 
 * if endOfMonth
 * Run payout
 * Post to subreddit that payouts are being made /w info about moving funds in 30 days
 */

console.log('[Reddit TipBot]:', 'Started')

cron.schedule('59 23 * * *', async () => {
    console.log("Daily:", "Cronjob started")

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
console.log('[Reddit TipBot]:', 'Daily CRON scheduled')

cron.schedule('0 0 1 * *', async () => {
    console.log("Monthly:", "Cronjob started")

    let { karma } = await fetchRewardStats()
    let records = await fetchRewardRecords()
    let reward = calculateRewardPerUser(karma)

    records.map(record => {
        distributeReward(record.user, reward, "CANNACOIN")
    })
    console.log("Ran monthly payout")

    runtimeFile.count++
    runtimeFile.lastrun = new Date()
    
    fs.writeFile(fileName, JSON.stringify(runtimeFile), function writeJSON(err) {
        if (err) { 
            return console.log(err)
        }
    })
    reddit.createSubmission(`Monthly CANNACOIN distribution 💚💨`, `Our monhtly CANNACOIN distribution have taken place. This month we've paid out ${reward} CANNACOIN for a total of ${karma} Reddit Karma\n`)
})
console.log('[Reddit TipBot]:', 'Monthly CRON scheduled')

cron.schedule('0 */4 * * *', async () => {
    console.log()
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
console.log('[Reddit TipBot]:', 'Balance listener running')

/**
 * Message Stream job
 */
cron.schedule('* * * * *', async () => {
    console.log("Checking messages")
    reddit.messageStream()
})

/**
 * Stellar payment listener
 */
paymentListener()
console.log('[Reddit TipBot]:', 'Payment listener running')


console.log('[Reddit TipBot]:', 'Running')
