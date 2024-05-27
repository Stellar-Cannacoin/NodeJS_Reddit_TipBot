require('dotenv').config()
const Snoowrap = require('snoowrap')
const { logger } = require('../util')

const rInbox = new Snoowrap({
	userAgent: process.env.USER_AGENT,
	clientId: process.env.APP_ID_INBOX,
	clientSecret: process.env.API_SECRET_INBOX,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
})

rInbox.config({ continueAfterRatelimitError: true })

const createMessage = (user, title, text) => {
    if (!user) {
        return
    }
    try {
        return rInbox.composeMessage({
            to: user,
            subject: title,
            text: text+'  \n  \n  [`Commands`](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki) | [`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/YeTRYV6nUv) | [`GitHub`](https://github.com/stellar-Cannacoin)'
        })
    } catch (error) {
        return error
    }
   
}

module.exports = {
    createMessage
}
