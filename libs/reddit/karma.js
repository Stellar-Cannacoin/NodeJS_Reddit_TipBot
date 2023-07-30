require('dotenv').config()
const { fetchRewardPostStats, fetchRewardRecordsCurrent } = require('../db')

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
    showDataset
}