require('dotenv').config()

const axios = require('axios')

const reddit = require('./reddit')
const { calculateRewardPerUser } = require('./reward')
const { fetchRewardRecords, fetchRewardStats, botLogger, fetchRewardPostStats, recordPost, fetchRewardRecordsUsers, fetchRewardRecordsCurrent, fetchRewardPostStatsMonth, distributeReward, fetchRewardPostStatsCron } = require('./db')

const fs = require('fs');
const { logger } = require('./util');
const fileName = './data/runtime.json'
const runtimeFile = require(fileName)

const karmaPayout = async () => {
    return new Promise(async (resolve, reject) => {
        logger("Monthly cronjob started")

        let karma_users = await fetchRewardStats() // Fallback: Will be removed
        let { karma } = await fetchRewardPostStatsCron()
        // let { karma } = await fetchRewardPostStatsMonth()
        
        let records = await fetchRewardRecords()
        let records_users = await fetchRewardRecordsUsers() // Fallback: Will be removed
        let reward = calculateRewardPerUser(karma+karma_users.karma)

        /**
         * Will be removed from next 
         * push on out
         */
        let conrecords = records.concat(records_users)
        
        /**
         * Swap out 'conrecords' for 'records'
         */
        let continueRun = false
        // const payout = await conrecords.map((user, i) => {
        //     return new Promise(resolve => {
        //         setTimeout(async () => {
        //             // if (user._id.toLowerCase() == "himbad") {
        //             //     continueRun = true
        //             // }
        //             // if (!continueRun) {
        //             //     console.log("skipping")
        //             //     return
        //             // }
        //             if (Math.floor(reward*user.score) <= 0) {
        //                 console.log("no canna paid out")
        //                 return
        //             }
        //             // console.log("continuing")
        //             // return
        //             await distributeReward(user._id.toLowerCase(), Math.floor(reward*user.score), 'CANNACOIN')
        //             try {
        //                 await reddit.createMessage(user._id.toLowerCase(), 'Karma for CANNA', `You received ${Math.floor(reward*user.score)} CANNACOIN for your karma this month!`)
        //             } catch (error) {
        //                 console.log("Hit rate limit", user._id.toLowerCase())
        //             }
                    
        //             // await reddit.createDistMessage("Canna_Tips", "Karma distribution", `send ${Math.floor(reward*user.score)} u/${user._id.toLowerCase()}`)
        //             logger(`${user._id.toLowerCase()}: Paid out: ${Math.floor(reward*user.score)}`)
        //             resolve(true)
        //             // console.log("SKIPPING")

        //         }, i * 25000)
        //     })
        // })

        // /**
        //  * Wait for payout Promise
        //  * in order for the code to run correctly
        //  */
        // Promise.all(payout).then((response) => {
            runtimeFile.count++
            runtimeFile.lastrun = new Date()
            
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
                /**
                 * Create submission to subreddit
                 */
                reddit.createSubmission(
                    `Monthly CANNACOIN distribution 💚 💨`,
                    `- Total karma: __${(karma+karma_users.karma)}__\n\n`+
                    `- Total payout: __${(karma+karma_users.karma)*reward}__\n\n`+
                    `- Karma ^((CANNACOIN)^): __${reward}__ \n\n`+
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
        // });
    })
}

const collectKarma = async () => {
    return new Promise(async (resolve, reject) => {
        logger(`Daily cronjob started https://old.reddit.com/r/${process.env.SUBREDDIT}/new/.json`)
        axios.get(`https://old.reddit.com/r/${process.env.SUBREDDIT}/new/.json`)
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
                        console.log("POST ID:", post.id)
                        let comments = await reddit.getPostComments(post.id);
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
                }, 2000*index);
            }))
            
            resolve(data.data.children)
            
        })
        .catch(error => {
            console.log(error)
            reject(error)
        })
    })
}

const showDataset = async () => {
    return new Promise(async resolve => {
        let { karma } = await fetchRewardPostStats()
        // let { karma } = await fetchRewardPostStatsMonth('06')
        
        // let karma_users = await fetchRewardStats()
        let records = await fetchRewardRecordsCurrent()
        let reward = calculateRewardPerUser(karma)
        // console.log("Karma & payout stats", karma_users.karma)
        // console.log("Karma:", karma)
        // console.log("Users:", records.length)
        // console.log("Karma worth:", reward)
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