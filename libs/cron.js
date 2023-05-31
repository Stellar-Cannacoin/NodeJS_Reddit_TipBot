require('dotenv').config()

const axios = require('axios')
const cron = require('node-cron');

const reddit = require('./reddit')
const { calculateRewardPerUser } = require('./reward')
const { storeDailyScore, fetchRewardRecords, distributeReward, fetchRewardStats } = require('./db')

const fs = require('fs');
const moment = require('moment');
const { logger } = require('./util');
const fileName = '../data/runtime.json'
const runtimeFile = require(fileName)

const karmaPayout = async () => {
    logger("Monthly cronjob started")

    let { karma } = await fetchRewardStats()
    let records = await fetchRewardRecords()
    let reward = calculateRewardPerUser(karma)

    records.map(record => {
        distributeReward(record.user, reward, "CANNACOIN")
    })

    runtimeFile.count++
    runtimeFile.lastrun = new Date()
    
    fs.writeFile(fileName, JSON.stringify(runtimeFile), function writeJSON(error) {
        if (error) { 
            return logger(`Error. ${error}`)
        }
    })
    logger("Ran monthly payout")

    reddit.createSubmission(`Monthly CANNACOIN distribution 💚💨`, `Our monhtly CANNACOIN distribution have taken place. This month we've paid out ${reward} CANNACOIN for a total of ${karma} Reddit Karma\n`)
    logger("Posted to Reddit")
}

const collectKarma = async () => {
    logger(`Daily cronjob started ${process.env.FETCH_URL}`)
    try {

    
        axios.get(process.env.FETCH_URL)
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
                // console.log(current_date, post_date)
                let blacklist = require('../data/blacklist.json')

                if (blacklist[item.data.author]) {
                    return
                }

                
                // console.log({
                //     title: item.data.title,
                //     posted: post_date, //moment(item.data.created_utc).format('DD.MM.Y HH:mm:ss'),
                //     comments: item.data.num_comments,
                //     ups: item.data.ups,
                //     downs: item.data.downs
                // })
                // return
                let post = {
                    id: item.data.id, 
                    title: item.data.title,
                    score: item.data.score,
                    user: item.data.author,
                    ups: item.data.ups,
                    downs: item.data.downs
                }
                // console.log(post)
                
                return;

                if (post.user == "[deleted]") {
                    return
                }
                storeDailyScore(post)
                setTimeout(async function () {
                    try {
                        let comments = await reddit.getComments(post.id);
                        console.log("array?", comments)
                    } catch (error) {
                        console.log(error)
                    }
                }, 2000*index);
                
                
                // if (!Array.isArray(comments)) {
                //     return
                // }
                // comments.map(comment => {
                //     let upvotes = comment.ups-comment.downs
                //     if (upvotes > 1) {
                //         let commentmeta = {
                //             score: upvotes,
                //             user: comment.author.name
                //         }
                //         if (commentmeta.user == "[deleted]") {
                //             return
                //         }
                //         storeDailyScore(commentmeta)
                //         return
                //     }
                // })
            })
        })
        .catch(error => {
            console.log(error)
        })
    } catch (error) {
        logger(`Failed`)
        console.log(error)
    }
}

module.exports = {
    collectKarma
}