require('dotenv').config()

const axios = require('axios')
const cron = require('node-cron');

const reddit = require('./reddit')
const { calculateRewardPerUser } = require('./reward')
const { storeDailyScore, fetchRewardRecords, distributeReward, fetchRewardStats, botLogger } = require('./db')

const fs = require('fs');
const moment = require('moment');
const { logger } = require('./util');
const blacklist = require('./data/blacklist.json')
const fileName = './data/runtime.json'
const runtimeFile = require(fileName)

const karmaPayout = async () => {
    return new Promise(async (resolve, reject) => {
        logger("Monthly cronjob started")

        let { karma } = await fetchRewardStats()
        let records = await fetchRewardRecords()
        let reward = calculateRewardPerUser(karma)

        records.map(record => {
            // console.log(record.user, reward*record.score)
            distributeReward(record.user, reward*record.score, "CANNACOIN")
        })

        // return;

        runtimeFile.count++
        runtimeFile.lastrun = new Date()
        console.log("karma",runtimeFile)
        
        fs.writeFile(fileName, JSON.stringify(runtimeFile), function writeJSON(error) {
            if (error) { 
                logger(`Error. ${error}`)
                return reject(error)
            }
        })
        logger("Ran monthly payout")
        botLogger({
            type: "reward",
            karma: karma,
            users: records.length,
            totalamount: reward*records.length,
            payout: reward
        }).then(data => {
            reddit.createSubmission(`Monthly CANNACOIN distribution 💚💨`, `Our monhtly CANNACOIN distribution have taken place. This month we've paid out ${reward} CANNACOIN for a total of ${karma} Reddit Karma\n`)
            logger("Posted to Reddit")
            resolve(true)
        }).catch(error => {
            reject(error)
        })
    })
}

const collectKarma = async () => {
    return new Promise(async (resolve, reject) => {
    logger(`Daily cronjob started https://old.reddit.com/r/${process.env.SUBREDDIT}/new/.json`)
        try {
            axios.get(`https://old.reddit.com/r/${process.env.SUBREDDIT}/new/.json`)
            .then (async ({ data }) => {
                data.data.children.map(async (item, index) => {
                    let post_date = moment(item.data.created_utc*1000).format('DD.MM.Y')
                    let current_date = moment(new Date()).format('DD.MM.Y')

                    if (post_date != current_date) {
                        logger("Outdated")
                        return
                    }

                    if (item.data.banned_by != null || item.data.removed_by != null) {
                        return
                    }

                    if (item.data.num_comments > 0) {
                        console.log(`Found ${item.data.num_comments} comments`)
                    }

                    

                    if (blacklist[item.data.author]) {
                        return
                    }

                    let post = {
                        id: item.data.id, 
                        title: item.data.title,
                        score: item.data.score,
                        user: item.data.author,
                        ups: item.data.ups,
                        downs: item.data.downs
                    }

                    if (post.user == "[deleted]") {
                        return
                    }
                    storeDailyScore(post)
                    setTimeout(async function () {
                        try {
                            let comments = await reddit.getComments(post.id);

                            if (!Array.isArray(comments)) {
                                return
                            }
                            comments.map(comment => {
                                let upvotes = comment.ups-comment.downs
                                if (upvotes > 1) {
                                    let commentmeta = {
                                        score: upvotes,
                                        user: comment.author.name
                                    }
                                    if (commentmeta.user == "[deleted]") {
                                        return false
                                    }
                                    storeDailyScore(commentmeta)
                                    return true
                                }
                            })
                            return true
                        } catch (error) {
                            console.log(error)
                        }
                    }, 2000*index);
                })
                resolve(true)
            })
            .catch(error => {
                console.log(error)
            })
        } catch (error) {
            logger(`Failed`)
            console.log(error)
            resolve(false)
        }
    })
}

module.exports = {
    collectKarma,
    karmaPayout
}