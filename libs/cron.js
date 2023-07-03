require('dotenv').config()

const axios = require('axios')

const reddit = require('./reddit')
const { calculateRewardPerUser } = require('./reward')
const { fetchRewardRecords, fetchRewardStats, botLogger, fetchRewardPostStats, recordPost, fetchRewardRecordsUsers, fetchRewardRecordsCurrent } = require('./db')

const fs = require('fs');
const { logger } = require('./util');
const fileName = './data/runtime.json'
const runtimeFile = require(fileName)

const karmaPayout = async () => {
    return new Promise(async (resolve, reject) => {
        logger("Monthly cronjob started")

        let karma_users = await fetchRewardStats() // Fallback: Will be removed
        let { karma } = await fetchRewardPostStats()
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
        const payout = conrecords.map((user, i) => {
            return new Promise(resolve => {
                setTimeout(async () => {
                    await reddit.createDistMessage("Canna_Tips", "Karma distribution", `send ${Math.floor(reward*user.score)} u/${user._id.toLowerCase()}`)
                    logger(`${user._id.toLowerCase()}: Paid out: ${Math.floor(reward*user.score)}`)
                    resolve(true)

                }, i * 15000)
            })
        })

        /**
         * Wait for payout Promise
         * in order for the code to run correctly
         */
        Promise.all(payout).then((response) => {
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
        });
    })
}

const collectKarma = async () => {
    return new Promise(async (resolve, reject) => {
        logger(`Daily cronjob started https://old.reddit.com/r/${process.env.SUBREDDIT}/new/.json`)
        axios.get(`https://old.reddit.com/r/${process.env.SUBREDDIT}/new/.json`)
        .then(({data}) => {
            data.data.children.map(async (item, index) => {
                let post = {
                    id: item.data.id, 
                    title: item.data.title,
                    score: item.data.score,
                    user: item.data.author.toLowerCase(),
                    ups: item.data.ups,
                    downs: item.data.downs,
                    ts: new Date(item.data.created*1000)
                }
                if (!post.user.includes("AutoModerator") || !post.user.includes("Canna_Tips") || !post.user.includes("Burnsivxx")) {
                    recordPost(post)
                }
                

                setTimeout(async function () {
                    try {
                        let comments = await reddit.getComments(post.id);

                        if (!Array.isArray(comments)) {
                            return
                        }
                        comments.map(comment => {
                            
                            let upvotes = comment.ups-comment.downs

                            let post = {
                                id: comment.id,
                                parent_id: item.data.id,
                                title: comment.body,
                                score: upvotes,
                                user: comment.author.name,
                                ups: comment.ups,
                                downs: comment.downs,
                                ts: new Date(comment.created*1000)
                            }
                            if (!post.user.includes("AutoModerator") || !post.user.includes("Canna_Tips") || !post.user.includes("Burnsivxx")) {
                                return false
                            }
                            if (post.user == "[deleted]") {
                                return false
                            }
                            recordPost(post)
                            return true
                        })
                        return true
                    } catch (error) {
                        console.log(error)
                    }
                }, 2000*index);
            })
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
        let karma_users = await fetchRewardStats()
        let records = await fetchRewardRecordsCurrent()
        let reward = calculateRewardPerUser(karma+karma_users.karma)
        // console.log("Karma & payout stats", karma_users.karma)
        // console.log("Karma:", karma)
        // console.log("Users:", records.length)
        // console.log("Karma worth:", reward)
        let payload = {
            total_karma: (karma+karma_users.karma),
            total_users: records.length,
            payout_per_karma: reward,
            total_payout: parseFloat((karma+karma_users.karma)*reward).toFixed(7)
        }
       
        resolve(payload)
    })
}

module.exports = {
    collectKarma,
    karmaPayout,
    showDataset
}