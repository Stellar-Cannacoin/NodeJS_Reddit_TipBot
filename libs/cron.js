require('dotenv').config()

const axios = require('axios')
const cron = require('node-cron');

const reddit = require('./reddit')
const { calculateRewardPerUser } = require('./reward')
const { fetchRewardRecords, distributeReward, fetchRewardStats, botLogger, fetchRewardPostStats, recordPost } = require('./db')

const fs = require('fs');
const { logger } = require('./util');
const { withdrawToWallet } = require('./withdraw');
const { createDistributionTransaction, submitDistributionTransaction } = require('./stellar');
const fileName = './data/runtime.json'
const runtimeFile = require(fileName)

const karmaPayout = async () => {
    return new Promise(async (resolve, reject) => {
        logger("Monthly cronjob started")

        let karma_users = await fetchRewardStats()
        let { karma } = await fetchRewardPostStats()
        let records = await fetchRewardRecords()
        let reward = calculateRewardPerUser(karma+karma_users.karma)
        // console.log({
        //     karma_total: karma+karma_users.karma,
        //     karma_posts: karma,
        //     karma_users: karma_users.karma,
        //     reward_per_karma: reward
        // })
        // console.log(records)
        // return
        let transactions = await createDistributionTransaction(records, reward, "GDGK2GOKOIXLPU7DONRDWFSQ6R3SNQ7U2KYIBLXHU42HTBTPQUMKVVR7")
        // console.log(StellarObject)
        let blockTransactions = []
        const chunkSize = 100;
        for (let i = 0; i < transactions.length; i += chunkSize) {
            const chunk = transactions.slice(i, i + chunkSize);
            console.log("block length:",chunk.length)
            blockTransactions.push(chunk)
        }
        // console.log(blockTransactions)
        await Promise.all(blockTransactions.map(transaction => {
            // console.log(transaction)
            submitDistributionTransaction(transaction)
            .then(data => {
                console.log("Paid out")
                return data
            })
            .catch(error => {
                console.log("Failed to pay out")
                return error
            })
        }))
        // return
        // records.map(record => {
        //     console.log(record._id, reward*record.score)
        //     // withdrawToWallet(record._id, reward*record.score, "")
        //     // distributeReward(record.user, reward*record.score, "CANNACOIN")
        // })

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
        axios.get(`https://old.reddit.com/r/${process.env.SUBREDDIT}/new/.json`)
        .then(({data}) => {
            data.data.children.map(async (item, index) => {
                let post = {
                    id: item.data.id, 
                    title: item.data.title,
                    score: item.data.score,
                    user: item.data.author,
                    ups: item.data.ups,
                    downs: item.data.downs,
                    ts: new Date(item.data.created*1000)
                }
                if (post.user != "AutoModerator" || post.user != "Canna_Tips" || post.user != "Burnsivxx") {
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
                            if (post.user == "AutoModerator" || post.user == "Canna_Tips" || post.user != "Burnsivxx") {
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
        let records = await fetchRewardRecords()
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