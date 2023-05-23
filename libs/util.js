require('dotenv').config()

const logger = (message) => {
    return console.log(`[${process.env.REDDIT_USERNAME}]:`, message)
}

module.exports = {
    logger
}