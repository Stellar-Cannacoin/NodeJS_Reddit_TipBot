require('dotenv').config()

const logger = (message) => {
    console.log(`[${process.env.REDDIT_USERNAME}]:`, message)
    return message
}

module.exports = {
    logger
}