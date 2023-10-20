require('dotenv').config()

const { CommentStream, } = require("snoostorm")
const Snoowrap = require('snoowrap')
const { tipUser, getUserBalance, updateBalance, botLogger, fetchLeaderboard, getUserKarma, updateOptIn, getUserWallet, linkUserWallet, updateUserFlairStatus, backupUserFlair } = require('./db')
const { withdrawToWallet } = require('./withdraw')
const { logger, isNegative } = require('./util')

const r = new Snoowrap({
	userAgent: process.env.USER_AGENT,
	clientId: process.env.APP_ID,
	clientSecret: process.env.API_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
})

r.config({ continueAfterRatelimitError: true })

const rInbox = new Snoowrap({
	userAgent: process.env.USER_AGENT,
	clientId: process.env.APP_ID_INBOX,
	clientSecret: process.env.API_SECRET_INBOX,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
})

rInbox.config({ continueAfterRatelimitError: true })

const rFlair = new Snoowrap({
	userAgent: process.env.USER_AGENT,
	clientId: process.env.APP_ID_FLAIR,
	clientSecret: process.env.API_SECRET_FLAIR,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
})

rFlair.config({ continueAfterRatelimitError: true })

let subreddits = require('../data/subreddits.json')
const { showDataset } = require('./reddit/karma')
const { createMessage } = require('./reddit/inbox')
const { checkAccountTrust } = require('./stellar')

let subredditnames = subreddits.map(sub => sub.subreddit).join('+')

const stream = new CommentStream(r, {
    subreddit: 'stellarcannacoin', //stellarcannacoin',//subredditnames,//process.env.SUBREDDIT,
    limit: 3,
    pollTime: 30000
})

/**
 * Uncomment to use CommentStream
 * You need to also uncomment the 'messageStream' call from `app.js`
 * If not, you will hit rate limits
 */

/**
    // Start inboxStream
    const inboxStream = new CommentStream(r, {
        subreddit: process.env.SUBREDDIT,
        limit: 1,
        pollTime: 10000
    })

    inboxStream.on("item", async message => {
        console.log("message", message)
    })
**/

let runtimeDate = new Date();

const messageStream = async () => {
    try {
        let inbox = await getInbox()
        await new Promise.all(inbox.map(async (message, index) => {
            setTimeout(function () {
                if (message.new) {
                    if (message.dest.toLowerCase() != process.env.REDDIT_USERNAME.toLowerCase()) {
                        return
                    }
                    logger(`Received message`)
                    executeCommand(message)
                    return
                } 
                if (message.replies.length > 0) {
                    message.replies.map(messageReplies => {
                        setTimeout(function () {
                            if (messageReplies.new) {
                                logger("Received message reply")
                                executeCommand(messageReplies)
                            }
                            markMessageAsRead(messageReplies.id)
                            return
                        }, 1500)
                    })
                }
            }, 3000*index);
        }))
        return true
    } catch (error) {
        return false
    }
    
}

const commentStream = async () => {
    try {
        let comments = await getCommentStream()

        comments.map(async comment => {
            r.getComment(comment.id).markAsRead()
            return
        })
        return comments
    } catch (error) {
        return false
    }
    
}

stream.on("item", async comment => {
    if (new Date((comment.created_utc*1000)) < runtimeDate ) {
        return
    }

    if (comment.author.name == process.env.REDDIT_USERNAME) {
        return
    }

    await r.getComment(comment.parent_id).fetch().then(async parentComment => {
        let getRedditCommand = getBotCommand(comment.body)
        switch (getRedditCommand) {
            case '!canna': 
                let getTipAmountComment = getTipAmount(comment.body)
                if (!getTipAmountComment) {
                    createComment(comment, `Invalid command, please see the tipbot help manual if you're unsure about the commands used in comments or private messages.`)
                    return
                }
                try {
                    let { balances } = await getUserBalance(comment.author.name)
                    let tokenbalance = balances?.CANNACOIN || 0
                    if (parseFloat(tokenbalance) < parseFloat(getTipAmountComment) || isNegative(parseFloat(tokenbalance))) {
                        logger("Error. Not enough funds")
                        createMessage(comment.author.name, `Failed to tip`, `Not enough funds. \nYour current balance is ${tokenbalance} CANNACOIN`)
                        return
                    }
                } catch (error) {
                    logger("Error. Not enough funds")
                    createMessage(comment.author.name, `Failed to tip`, `Not enough funds. \nYour current balance is **NaN** CANNACOIN`)
                    return
                }

                if (comment.author.name == parentComment.author.name) {
                    createComment(comment, 'You cannot send a tip to yourself')
                    return
                }
                 
                let balanceA = await getUserBalance(comment.author.name)
                let balanceB = await getUserBalance(parentComment.author.name)

                let tipResponse = await tipUser(comment.author.name, parentComment.author.name, parseFloat(getTipAmountComment), "CANNACOIN")
                
                /**
                 * If you want to disable tips to the bot, uncomment
                 * the tip function from the syntax below
                 */
                if (parentComment.author.name == process.env.REDDIT_USERNAME) {
                    createComment(comment, `Oh no... You shouldn't have! Thank you for the tip!  \n  \n Biip boop`)
                    return
                }
                botLogger({
                    type: "tip",
                    from: comment.author.name,
                    to: parentComment.author.name,
                    amount: getTipAmountComment,
                    ts: new Date()
                })
                if (!tipResponse.upsertedCount) {
                    createComment(comment, `Sent `+'`'+getTipAmountComment+' CANNACOIN` to '+`u/${parentComment.author.name}`)
                    setTimeout(async () => {
                        createMessage(parentComment.author.name, `You received a tip!`, `Someone tipped you ${getTipAmountComment} CANNACOIN.  \nYour sticky-icky balance is ${(parseFloat(balanceB.balances.CANNACOIN)+parseFloat(getTipAmountComment)).toFixed(2)}`)
                    }, 1000)
                    return
                }
                createComment(comment, `Creating a new account and sent `+'`'+getTipAmountComment+' CANNACOIN` to '+`u/${parentComment.author.name}`)
                setTimeout(async () => {
                    createMessage(parentComment.author.name, `You received a tip!`, `Someone tipped you ${getTipAmountComment} CANNACOIN.  \nYour sticky-icky balance is ${(parseFloat(getTipAmountComment)).toFixed(2)}\n  \nWelcome to Stellar Cannacoin! \n  \nCongrats on your first tip! See the links below for commands.`)
                }, 1000)
                updateOptIn(parentComment.author.name, 1)
            break
        }
    });
    return
})

const getComments = (id) => {
    return new Promise(async resolve => {
        try {
            resolve(r.getSubmission(id).comments)
        } catch (error) {
            logger(`Error. ${error}`)

        }
        
    })
}


const getTipAmount = (string) => {
    let regex = /!canna ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?/
    try {
        if (isNaN(string.match(regex)[1])) {
            return false
        }
        return string.match(regex)[1]
    } catch (error) {
        return false
    }
    
}
const getWalletAddress = (string) => {
    let regex = /send ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))? ([A-Za-z0-9\/_-]+)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[3]
}
const getWalletLinkAddress = (string) => {
    // let regex = /send ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))? ([A-Za-z0-9\/]+)/
    // let regex = /send ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))? ([A-Za-z0-9\/_-]+)/
    let regex = /link ([A-Za-z0-9]+)/ // /link ([A-Za-z]+([0-9]+[A-Za-z]+)+)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[1]
}
const getAmountFromCommand = (string) => {
    let regex = /([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[0]
}
const getFlairParams = (string) => {
    let regex = /flair ?([A-Za-z]+)* ?([A-Za-z]+)*/i
    if (!string.match(regex)) {
        console.log("err", string.match(regex))
        return false
    }
    return {
        status: string.match(regex)[1],
        type: string.match(regex)[2]
    }
}
const getBotCommand = (string) => {
    let regex = /(!canna?|balance|Balance|send?|Send?|deposit|Deposit|withdraw|Withdraw|link|Link|flair|Flair|leaderboard|Leaderboard|help|Help|Optin|optin|Optout|optout|Stats|stats)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[0]
}

const getBotCommandFull = (string) => {
    let regex = /(!canna?|balance|Balance|send?|Send?|deposit|Deposit|withdraw|Withdraw|link|Link|leaderboard|Leaderboard|help|Help|Optin|optin|Optout|optout|Stats|stats)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)
}

const executeCommand = async (message) => {
    if (message.author.name == process.env.REDDIT_USERNAME) {
        markMessageAsRead(message.id)
        return false
    }
    if (message.dest.toLowerCase() != process.env.REDDIT_USERNAME.toLowerCase()) {
        return false
    }
    let botCommandRaw = getBotCommand(message.body)

    message.body = message.body.replace(/(\r\n|\n|\r)/gm, "")

    if (!botCommandRaw) {
        replyToMessage(message.id, `Invalid command  \n  \n  \n  **Tipbot help manual**  \nAvailable commands are:\n\n- !canna {amount} (tip a user in the comment section)\n\n\n- balance (get current balance)\n- send {amount} {address} (withdraw funds to external wallet)\n- deposit (despoit funds to account)  \n  \nVisit our [Wiki to know more!](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)`)
        markMessageAsRead(message.id)
        return false
    }

    let botCommand = botCommandRaw.toLowerCase()

    try {
        switch(botCommand) {
            case 'balance':
                let { balances } = await getUserBalance(message.author.name)

                let { score } = await getUserKarma(message.author.name)
                let redditBalance = balances?.CANNACOIN
                if (!balances || !balances.CANNACOIN) {
                    redditBalance = "0"
                }
                setTimeout(() => {
                    replyToMessage(message.id, `Your current tipbot balance is ${parseFloat(redditBalance).toFixed(2)} CANNACOIN  \n\n You've earned ${score} karma so far this month!`)
                    markMessageAsRead(message.id)
                }, 2000)
                checkFlairUpdate(message.author.name, true)
            break

            case 'send':
                let amount = 0;

                let balance = await getUserBalance(message.author.name)
                let tokenbalance = balance?.balances?.CANNACOIN || 0

                if (message.body.includes(' all ')) {
                    console.log("Replacing 'all' with token balance", tokenbalance)
                    amount = tokenbalance
                    message.body = message.body.replace('all', tokenbalance)

                    if (isNegative(tokenbalance)) {
                        updateBalance(message.author.name, 0, "CANNACOIN")
                    }
                } else {
                    amount = getAmountFromCommand(message.body)
                }

                let wallet = getWalletAddress(message.body.toLowerCase())

                if (parseFloat(tokenbalance) < parseFloat(amount)) {
                    replyToMessage(message.id, `Failed to withdraw  \n  \nNot enough funds. \nYour current balance is ${tokenbalance} CANNACOIN`)
                    markMessageAsRead(message.id)
                    return
                }

                if (!wallet || wallet == null) {
                    replyToMessage(message.id, `Something went wrong, invalid user or wallet address. If you're sending to a user, use :'u/username'`)
                    markMessageAsRead(message.id)
                    return
                }
                if (wallet.includes('u/')) {
                    if (message.author.name == wallet.split('u/')[1]) {
                        replyToMessage(message.id, 'You cannot send a tip to yourself')
                        return
                    }
                    try {
                        let { balances } = await getUserBalance(message.author.name)
                        if (balances.CANNACOIN < amount) {
                            replyToMessage(message.id, `Not enough funds. \nYour current balance is ${balances.CANNACOIN} CANNACOIN`)
                            markMessageAsRead(message.id)
                            return
                        }
                    } catch (error) {
                        replyToMessage(message.id, `Not enough funds. \n  User not found`)
                        markMessageAsRead(message.id)
                        return
                    }
                    
                    let balanceA = await getUserBalance(message.author.name)
                    let balanceB = await getUserBalance(wallet.split('u/')[1])

                    if (!balanceA?.balances?.CANNACOIN || amount > balanceA?.balances?.CANNACOIN ) {
                        replyToMessage(message.id, `Not enough funds. \n  User not found`)
                        return
                    }

                    let tipResponse = await tipUser(message.author.name, wallet.split('u/')[1], parseFloat(amount), "CANNACOIN")

                    if (!tipResponse.upsertedCount) {
                        replyToMessage(message.id, `Sent `+'`'+amount+' CANNACOIN` to '+`${wallet}`)
                        createMessage(wallet.split('u/')[1], `You received a tip!`, `Someone tipped you ${amount} CANNACOIN.  \nYour sticky-icky balance is ${parseFloat(balanceB.balances.CANNACOIN)+parseFloat(amount)}\n  \nWelcome to Stellar Cannacoin! \n  \nCongrats on your first tip! See the links below for commands.`)
                        markMessageAsRead(message.id)
                        return
                    }
                    replyToMessage(message.id, `Creating a new account and sent `+'`'+amount+' CANNACOIN` to '+`${wallet}`)
                    createMessage(wallet.split('u/')[1], `You received a tip!`, `Someone tipped you ${amount} CANNACOIN.  \nYour sticky-icky balance is ${amount}`)
                    markMessageAsRead(message.id)
                    return
                }

                if(!await checkAccountTrust('CANNACOIN', 'GBLJ4223KUWIMV7RAPQKBA7YGR4I7H2BIV4KIMMXMQWYQBOZ6HLZR3RQ', wallet.toUpperCase())) {
                    replyToMessage(message.id, `Please add the trust to your wallet before transferring funds out.`)
                    markMessageAsRead(message.id)
                    return
                }
                console.log(`Sending funds to ${wallet.toUpperCase()}`)
                withdrawToWallet(message.author.name, amount, wallet.toUpperCase())
                .then(async data => {
                    if (data) {
                        let amount_negative = -Math.abs(amount)

                        updateBalance(message.author.name, amount_negative, "CANNACOIN")
                        replyToMessage(message.id, `We've started the process of moving ${amount} CANNACOIN to the wallet ${wallet.toUpperCase()}`)
                        markMessageAsRead(message.id)
                        return
                    }
                    replyToMessage(message.id, `Something went wrong, please try again later, failed to run local withdrawal function`)
                    markMessageAsRead(message.id)
                })
                .catch(error => {
                    replyToMessage(message.id, `Something went wrong, please try again later. \n  \nRelated to the Stellar Network`+'```  '+error+'  ```')
                })
            break
            
            case 'deposit':
                replyToMessage(message.id, `Send the desired amount to the address `+'`'+`${process.env.WALLET_PUBLIC}`+'`'+` using the memo `+'`'+`${message.author.name.toLowerCase()}`+'`')
                markMessageAsRead(message.id)
            break
            
            case 'withdraw':
                let amountWithdraw = 0;
                let userWallet = await getUserWallet(message.author.name.toLowerCase())

                let balanceWithdraw = await getUserBalance(message.author.name)
                let tokenbalanceWithdraw = balanceWithdraw?.balances?.CANNACOIN || 0

                if (!userWallet.wallet) {
                    replyToMessage(message.id, 'No wallet linked with account. Please run the `link {wallet}` command in order to link your user with a Stellar address. This will automate the withdrawal process.')
                    markMessageAsRead(message.id)
                    return
                }

                if (message.body.includes(' all ')) {
                    console.log("Replacing 'all' with token balance", tokenbalance)
                    amountWithdraw = tokenbalance
                    message.body = message.body.replace('all', tokenbalance)
                    if (isNegative(tokenbalanceWithdraw)) {
                        updateBalance(message.author.name, 0, "CANNACOIN")
                    }
                } else {
                    amountWithdraw = getAmountFromCommand(message.body)
                }

                if (parseFloat(tokenbalanceWithdraw) < parseFloat(amountWithdraw)) {
                    replyToMessage(message.id, `Failed to withdraw  \n  \nNot enough funds. \nYour current balance is ${tokenbalanceWithdraw} CANNACOIN`)
                    markMessageAsRead(message.id)
                    return
                }

                console.log("Wallet link found", userWallet.wallet)

                if (process.env.ENABLE_WITHDRAWALS == 0) {
                    return replyToMessage(message.id, `Withdrawals are temporary disabled!`)
                }

                if(!await checkAccountTrust('CANNACOIN', 'GBLJ4223KUWIMV7RAPQKBA7YGR4I7H2BIV4KIMMXMQWYQBOZ6HLZR3RQ', userWallet.wallet.toUpperCase())) {
                    replyToMessage(message.id, `Please add the trust to your wallet before transfering funds out.`)
                    markMessageAsRead(message.id)
                    return
                }
                
                withdrawToWallet(message.author.name, amountWithdraw, userWallet.wallet.toUpperCase())
                .then(async data => {
                    if (data) {
                        let amount_negative = -Math.abs(amountWithdraw)

                        updateBalance(message.author.name, amount_negative, "CANNACOIN")
                        replyToMessage(message.id, `We've started the process of moving ${amountWithdraw} CANNACOIN to the wallet ${userWallet.wallet.toUpperCase()}`)
                        markMessageAsRead(message.id)
                        return
                    }
                    replyToMessage(message.id, `Something went wrong, please try again later, failed to run local withdrawal function`)
                    markMessageAsRead(message.id)
                })
                .catch(error => {
                    replyToMessage(message.id, `Something went wrong, please try again later. \n  \nRelated to the Stellar Network`+'```  '+error+'  ```')
                })
            break
            
            case 'leaderboard':
                let leaderboard = await fetchLeaderboard()
                let messageRaw = `## This month's current leaderboard\n  `;
                await Promise.all(leaderboard.map((user, index) => {
                    messageRaw += `${index+1}. u/${user._id} __[${user.score}]__ Karma earned  \n\n  `
                }))
                replyToMessage(message.id, messageRaw)
                markMessageAsRead(message.id)
            break
            
            case 'link':
                let walletLink = getWalletLinkAddress(message.body.toLowerCase())
                if (!walletLink) {
                    replyToMessage(message.id,  `Invalid address provided. Please try again`)
                    markMessageAsRead(message.id)
                    return
                }
                linkUserWallet(message.author.name.toLowerCase(), walletLink.toUpperCase())
                replyToMessage(message.id,  `Successfully linked user account with the wallet: ${walletLink.toUpperCase()}`)
                markMessageAsRead(message.id)
            break
            
            case 'flair':
                let flair = getFlairParams(message.body.toLowerCase())

                let { flair_text } = await getUserFlair(message.author.name.toLowerCase())
                
                if (flair.status == 'enable') {
                    await updateUserFlairStatus(message.author.name, true, flair.type, flair_text)
                    await checkFlairUpdate(message.author.name, true)
                    replyToMessage(message.id,  `You've **enabled** custom flair for you user account. We will show your **${flair.type}** in the flair.`)
                    markMessageAsRead(message.id)
                    break
                }
                
                await updateUserFlairStatus(message.author.name, false, null, flair_text)
                await checkFlairUpdate(message.author.name, false)
                replyToMessage(message.id,  `You've **disabled** custom flair for you user account. We will try to return your old flair.`)
                markMessageAsRead(message.id)
            break

            case 'help':
                replyToMessage(message.id,  `**Tipbot help manual**  \nAvailable commands are:\n\n- !canna {amount} (tip a user in the comment section)\n\n\n- balance (get current balance)\n- send {amount} {address} (withdraw funds to external wallet)\n- send {amount} {u/reddit_user} (send funds to Reddit user)\n- deposit (deposit funds to account)\n- leaderboard (this months karma leaders)  \n  \nVisit our [Wiki to know more!](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)`)
                markMessageAsRead(message.id)
            break
            
            case 'optin':
                updateOptIn(message.author.name, 1)
                replyToMessage(message.id,  `You have __opted in__ to tipbot notifications`)
                markMessageAsRead(message.id)
            break
            
            case 'optout':
                updateOptIn(message.author.name, 0)
                replyToMessage(message.id,  `You have __opted out__ to tipbot notifications`)
            break
            
            case 'stats':
                let stats = await showDataset()
                replyToMessage(message.id,  `This months current karma statistics are:\n\n- This months total payout: **${stats.total_payout}**\n\n- Total sub karma earned: **${stats.total_karma}**\n\n- Number of contributors: **${stats.total_users}**\n\n- Each karma is worth: **${stats.payout_per_karma}**`)
                markMessageAsRead(message.id)
            break
            
            default:
                replyToMessage(message.id, `**Invalid command**  \nAvailable commands are:\n\n- !canna {amount} (tip a user in the comment section)\n\n\n- balance (get current balance)\n- send {amount} {address} (withdraw funds to external wallet)\n- send {amount} {u/reddit_user} (send funds to Reddit user)\n- deposit (deposit funds to account)  \n  \nVisit our [Wiki to know more!](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)`)
                markMessageAsRead(message.id)
            break
        }
        return true

    } catch (error) {
        markMessageAsRead(message.id)
        return false
    }
    
}

const createDistMessage = async (user, title, text) => {
    return new Promise(async resolve => {
        try {
            return resolve(await r.composeMessage({
                to: user,
                subject: title,
                text: text
            }))
        } catch (error) {
            console.log("error:", error)
            return resolve(false)
        }
    })
    
}

const createComment = (comment, text) => {
    comment.reply(text+'  \n  \n  [`Commands`](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki) | [`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/YeTRYV6nUv) | [`GitHub`](https://github.com/stellar-Cannacoin)')
}

const createSubmission = (title, text) => {
    r.getSubreddit(process.env.SUBREDDIT)
    .submitSelfpost({title: title, text: text})
}
const getInbox = () => {
    return rInbox.getInbox({filter: 'messages'})
}
const getCommentStream = () => {
    return rInbox.getInbox({filter: 'comments'})
}
const markMessageAsRead = (id) => {
    return rInbox.getMessage(id).markAsRead()
}
const markAllMessagesAsRead = (id) => {
    return rInbox.readAllMessages()
}
const replyToMessage = (id, text) => {
    return rInbox.getMessage(id).reply(text+'  \n  \n  [`Commands`](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki) | [`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/YeTRYV6nUv) | [`GitHub`](https://github.com/stellar-Cannacoin)')
}
const setUserFlair = (user, flair) => {
    return new Promise(resolve => {
        resolve(r.getUser(user).assignFlair({subredditName: process.env.SUBREDDIT, text: flair}))
    })
}
/**
 * Get user's Subreddit flair, used to store the old one
 * when a user enables custom flairing
 * @param {String} user 
 * @returns 
 */
const getUserFlair = (account) => {
    return new Promise((async resolve => {
        console.log("account", account)
        let users = await r.getSubreddit(process.env.SUBREDDIT).getUserFlairList()
        let filtred = users.filter((user) => user.user.name.toLowerCase() == account.toLowerCase())
        resolve(filtred[0])
    }))
}

/**
 * Checks and sets user flair if user has it enabled
 * @param {String} user Reddit username
 * @returns Promise
 */
const checkFlairUpdate = (user, status) => {
    return new Promise(async (resolve, reject) => {
        let dbuser = await getUserBalance(user)
        if (!status) {
            setUserFlair(user, dbuser.flair_sub)
            return resolve(true)
        }
        try {
            let { flair_text } = await getUserFlair(user.toLowerCase())

            switch (dbuser.flair_type) {
                case 'karma': 
                    let karma = await getUserKarma(user)
                    setUserFlair(user, `:karma_logo: ${karma.score} KARMA`)
                    resolve(true)
                break

                case 'balance': 
                    setUserFlair(user, `:scc_logo: ${(dbuser.balances.CANNACOIN).toFixed(2)} CANNACOIN`)
                    resolve(true)
                break

                default:
                    setUserFlair(user, flair_text)
                    resolve(true)
                break
            }
        } catch(error) {
            switch (dbuser.flair_type) {
                case 'karma': 
                    let karma = await getUserKarma(user)
                    setUserFlair(user, `:karma_logo: ${karma.score} KARMA`)
                    resolve(true)
                break

                case 'balance': 
                    setUserFlair(user, `:scc_logo: ${(dbuser.balances.CANNACOIN).toFixed(2)} CANNACOIN`)
                    resolve(true)
                break

                default:
                    setUserFlair(user, dbuser.flair_sub)
                    resolve(true)
                break
            }
            return
        }
        
    })
}


module.exports = {
    getWalletAddress,
    getWalletLinkAddress,
    getAmountFromCommand,
    getFlairParams,
    getUserFlair,
    getComments,
    getTipAmount,
    getBotCommand,
    getBotCommandFull,
    executeCommand,
    createSubmission,
    createDistMessage,
    createComment,
    getInbox,
    markMessageAsRead,
    markAllMessagesAsRead,
    messageStream,
    commentStream,
    setUserFlair,
    checkFlairUpdate,
}