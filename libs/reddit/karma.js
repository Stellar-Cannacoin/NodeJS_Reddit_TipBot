require('dotenv').config()
const { fetchRewardPostStats, fetchRewardRecordsCurrent } = require('../db')
const { calculateRewardPerUser, getTotalPayoutReward } = require('../reward')

const showDataset = async () => {
    return new Promise(async resolve => {
        try {
            let { karma } = await fetchRewardPostStats()
            if (!karma) {
                karma = 0
            }
            let records = await fetchRewardRecordsCurrent()
            let reward = await calculateRewardPerUser(karma)

            let payload = {
                total_karma: parseInt(karma),
                total_users: records.length,
                payout_per_karma: reward,
                total_payout: await getTotalPayoutReward() //parseFloat((karma)*reward).toFixed(7)
            }
        
            resolve(payload)
        } catch (error) {
            console.log("error", error)
            let payload = {
                total_karma: parseInt(0),
                total_users: 0,
                payout_per_karma: 0,
                total_payout: 0 //parseFloat((karma)*reward).toFixed(7)
            }
            resolve(payload)
        }
    })
}

module.exports = {
    showDataset
}