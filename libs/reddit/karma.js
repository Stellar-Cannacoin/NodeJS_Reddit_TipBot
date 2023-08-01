require('dotenv').config()
const { fetchRewardPostStats, fetchRewardRecordsCurrent } = require('../db')
const { calculateRewardPerUser, getTotalPayoutReward } = require('../reward')

const showDataset = async () => {
    return new Promise(async resolve => {
        let { karma } = await fetchRewardPostStats()
        let records = await fetchRewardRecordsCurrent()
        let reward = calculateRewardPerUser(karma)

        let payload = {
            total_karma: parseInt(karma),
            total_users: records.length,
            payout_per_karma: reward,
            total_payout: getTotalPayoutReward() //parseFloat((karma)*reward).toFixed(7)
        }
       
        resolve(payload)
    })
}

module.exports = {
    showDataset
}