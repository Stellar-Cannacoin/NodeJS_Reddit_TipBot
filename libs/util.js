require('dotenv').config()

const logger = (message) => {
    console.log(`[${process.env.REDDIT_USERNAME}]:`, message)
    return message
}

/**
 * 
 * @param {Double} n Number
 * @returns Boolean (true/false)
 */
const isNegative = (n) => {
    return n < 0;
}

module.exports = {
    logger,
    isNegative
}