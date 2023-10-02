require('dotenv').config()
const rewardArray = require('../data/rewards.json')

/**
 * 
 * @param {Int} upvotes Total karma earned
 * @returns {Float} How much each karma is worth
 */
const calculateRewardPerUser = (upvotes) => {
    /**
     * Calculation:
     * Amount payed out each month to each member will follow this formula:
     * Total upvotes divided by the Canna reward for that month. This will tell us how many Canna each upvote is worth.
     * Ex. 1000000 canna divide by 250k upvotes would equal 4 canna per upvote.
    */

    /**
     * TODO: Redo this to read from database instead of reading from
     * the JSON file. If you want to use a JSON file, you'd need to reload the 
     * server after every update
     */
    const runtimeCount = require('../data/runtime.json')
    return rewardArray[runtimeCount.count]/upvotes
}

/**
 * 
 * @returns {Int} Total payout for the month
 */
const getTotalPayoutReward = () => {
    const runtimeCount = require('../data/runtime.json')
    return rewardArray[runtimeCount.count]
}

module.exports = {
    calculateRewardPerUser,
    getTotalPayoutReward
}