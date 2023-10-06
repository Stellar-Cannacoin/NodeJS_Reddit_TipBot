require('dotenv').config()
const rewardArray = require('../data/rewards.json')
const { readRuntimeValues } = require('./db')

/**
 * 
 * @param {Int} upvotes Total karma earned
 * @returns {Float} How much each karma is worth
 */
const calculateRewardPerUser = async (upvotes) => {
    /**
     * Calculation:
     * Amount payed out each month to each member will follow this formula:
     * Total upvotes divided by the Canna reward for that month. This will tell us how many Canna each upvote is worth.
     * Ex. 1000000 canna divide by 250k upvotes would equal 4 canna per upvote.
    */
   return new Promise(async (resolve, reject) => {
        let runtime = await readRuntimeValues()
        return resolve(rewardArray[runtime.count]/upvotes)
    })
    
}

/**
 * 
 * @returns {Int} Total payout for the month
 */
const getTotalPayoutReward = () => {
    return new Promise(async (resolve, reject) => {
        let runtime = await readRuntimeValues()
        return resolve(rewardArray[runtime.count])
    })
    const runtimeCount = require('../data/runtime.json')
    return rewardArray[runtimeCount.count]
}

module.exports = {
    calculateRewardPerUser,
    getTotalPayoutReward
}