require('dotenv').config()

const axios = require('axios')

const reddit = require('./reddit')
const { calculateRewardPerUser } = require('./reward')
const { fetchRewardRecords, fetchRewardStats, botLogger, fetchRewardPostStats, recordPost, fetchRewardRecordsUsers, fetchRewardRecordsCurrent, fetchRewardPostStatsMonth, distributeReward, fetchRewardPostStatsCron, readRuntimeValues, storeRuntimeValues } = require('./db')

const fs = require('fs');
const { logger } = require('./util');
const { createMessage } = require('./reddit/inbox')

const karmaPayout = async () => {
    return new Promise(async (resolve, reject) => {
        logger("Monthly cronjob started")
        let { karma } = await fetchRewardPostStatsCron()
        let records = await fetchRewardRecords()
        let reward = await calculateRewardPerUser(karma)
        
        let continueNext = false

        /**
         * Filter out users without a current score
         */
        records.filter(user => user.score > 0)
        
        // let continueRun = false
        const payout = await records.map((user, i) => {
            return new Promise(resolve => {
                setTimeout(async () => {
                    if (Math.floor(JSON.stringify(reward)*user.score) <= 0) {
                        return
                    }

                    await distributeReward(user._id.toLowerCase(), Math.floor(reward*user.score), 'CANNACOIN')
                    try {
                        await createMessage(user._id.toLowerCase(), 'Karma for CANNA', `You received ${Math.floor(reward*user.score)} CANNACOIN for your karma this month!`)
                    } catch (error) {
                        logger(`Hit rate limit for user: ${user._id.toLowerCase()}`)
                    }
                    
                    logger(`${user._id.toLowerCase()}: Paid out: ${Math.floor(reward*user.score)}`)
                    resolve(true)

                }, i * 25000)
            })
        })
        

        /**
         * Wait for payout Promise
         * in order for the code to run correctly
         */
        Promise.all(payout).then(async (response) => {
            /**
             * Rewrite this to support database storage instead of 
             * reading/writing to a file, as it would require the entire app to be
             * restarted. This in order to read the new values.
             * 
             * TODO: db.updateRuntime()
             */

            logger("Ran monthly payout")
            botLogger({
                type: "reward",
                karma: karma,
                users: records.length,
                totalamount: reward*records.length,
                payout: reward
            }).then(async data => {
                /**
                 * Store runtime variables into database
                 */
                try {
                    let { count } = await readRuntimeValues()
                    let next = parseInt(count+1)
                    
                    await storeRuntimeValues(count, next)
                } catch (error) {
                    console.log("failed to set runtime variables", error)
                }

                /**
                 * Create submission to subreddit
                 */
                reddit.createSubmission(
                    `Monthly CANNACOIN distribution 💚 💨`,
                    `- Total karma: __${karma}__\n\n`+
                    `- Total payout: __${(karma)*reward}__\n\n`+
                    `- Each Karma is worth ^((CANNACOIN)^): __${reward}__ \n\n`+
                    `- Tipped __${records.length}__ users this month\n\n`+
                    `Our monthly CANNACOIN distribution have taken place, puff puff fam! `+
                    `
                    &nbsp;  
                    `  +
                    `Beep boop, look at me go 🤖`
                )
                logger("Posted to Reddit")
                resolve(true)
            }).catch(error => {
                reject(error)
            })
        });
    })
}

const collectKarmaV1 = async () => {
    return new Promise(async (resolve, reject) => {
        logger(`Daily cronjob started`)
        axios.get(`https://www.reddit.com/r/${process.env.SUBREDDIT}.json`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                "Host": "*.reddit.com"
            }
        })
        .then(async ({data}) => {
            await Promise.all(data.data.children.map(async (item, index) => {
                
                if (item.data.author_is_blocked || item.data.banned_by != null) {
                    return false
                }

                let post = {
                    id: item.data.id, 
                    title: item.data.title,
                    score: item.data.score,
                    user: item.data.author.toLowerCase(),
                    ups: item.data.ups,
                    downs: item.data.downs,
                    ts: new Date(item.data.created*1000)
                }
                if (!post.user.includes("Automoderator") || !post.user.includes("Canna_tips") || !post.user.includes("Burnsivxx")) {
                    await recordPost(post)
                }
                

                setTimeout(async function () {
                    try {
                        let comments = await reddit.getComments(post.id);
                        // console.log(comments)

                        if (!Array.isArray(comments)) {
                            return
                        }
                        await Promise.all( comments.map(async comment => {
                            let upvotes = comment.ups-comment.downs

                            let post = {
                                id: comment.id,
                                parent_id: item.data.id,
                                title: comment.body,
                                score: upvotes,
                                user: comment.author.name.toLowerCase(),
                                ups: comment.ups,
                                downs: comment.downs,
                                ts: new Date(comment.created*1000)
                            }
                            // if (!post.user.includes("automoderator") || !post.user.includes("canna_tips") || !post.user.includes("burnsivxx")) {
                            //     return false
                            // }
                            if (post.user == "[deleted]") {
                                return false
                            }
                            await recordPost(post)
                            return true
                        }))
                        return true
                    } catch (error) {
                        console.log(error)
                    }
                }, 5000*index);
            }))
            
            resolve(data.data.children)
            
        })
        .catch(error => {
            console.log(error)
            reject(error)
        })
    })
}

const collectKarma = async () => {
    return new Promise(async (resolve, reject) => {
        reddit.getSubredditPosts().then(posts => {
            posts.map(async (post) => {
                if (post.author_is_blocked || post.banned_by != null) {
                    return false
                }

                let record = {
                    id: post.id, 
                    title: post.title,
                    score: post.score,
                    user: post.author.name.toLowerCase(),
                    ups: post.ups,
                    downs: post.downs,
                    ts: new Date(post.created*1000)
                }

                if (!post.author.name.includes("Automoderator") || !post.author.name.includes("Canna_tips") || !post.author.name.includes("Burnsivxx")) {
                    await recordPost(record)
                    return true
                }
                return false
                
            })
        })
        .catch(error => {
            return error
        })
        .finally(() => {
            reddit.getSubredditComments().then(posts => {
                posts.map(async (comment) => {
                    if (comment.author.name == "[deleted]") {
                        return false
                    }

                    let record = {
                        id: comment.id, 
                        title: comment.body,
                        score: comment.score,
                        user: comment.author.name.toLowerCase(),
                        ups: comment.ups,
                        downs: comment.downs,
                        ts: new Date(comment.created*1000)
                    }

                    await recordPost(record)
                    return true
                })
            })
            .catch(error => {
                return error
            })
            .finally(() => {
                return resolve(true)
            })
        })
    })
}

const showDataset = async () => {
    return new Promise(async resolve => {
        let { karma } = await fetchRewardPostStats()

        if (!karma) {
            karma = 0
        }

        let records = await fetchRewardRecordsCurrent()
        let reward = calculateRewardPerUser(karma)
        let payload = {
            total_karma: (karma),
            total_users: records.length,
            payout_per_karma: reward,
            total_payout: parseFloat((karma)*reward).toFixed(7)
        }
       
        resolve(payload)
    })
}

module.exports = {
    collectKarma,
    karmaPayout,
    showDataset
}
