require('dotenv').config()
const rewardArray = require('./data/rewards.json')
const runtimeCount = require('./data/runtime.json')


const calculateRewardPerUser = (upvotes) => {
    /**
     * Calculation:
     * Amount payed out each month to each member will follow this formula:
     * Total upvotes divided by the Canna reward for that month. This will tell us how many Canna each upvote is worth.
     * Ex. 1000000 canna divide by 250k upvotes would equal 4 canna per upvote.
    */
   return rewardArray[runtimeCount.count]/upvotes
}

module.exports = {
    calculateRewardPerUser
}