require('dotenv').config()

const { CommentStream } = require("snoostorm")
const Snoowrap = require('snoowrap')
const { tipUser, getUserBalance, updateBalance } = require('./db')
const { withdrawToWallet } = require('./withdraw')

const r = new Snoowrap({
	userAgent: 'stellar-reddit-tipbot',
	clientId: process.env.APP_ID,
	clientSecret: process.env.API_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
})

r.config({ continueAfterRatelimitError: true })

const stream = new CommentStream(r, { subreddit: process.env.SUBREDDIT, results: 1 })

let runtimeDate = new Date();

const messageStream = async () => {
    let inbox = await getInbox()
    inbox.map(async message => {
        if (message.new) {
            if (message.dest != process.env.REDDIT_USERNAME) {
                return
            }
            console.log("Direct message new:", message.new)

            executeCommand(message)
            return
        } 
        if (message.replies.length > 0) {
            message.replies.map(messageReplies => {
                
                if (messageReplies.new) {
                    console.log("Sub reply Message new:", message.new)
                    executeCommand(messageReplies)
                }
                markMessageAsRead(messageReplies.id)
                return
                
            })
        }
    })
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
            case "!cannatest": 
                let getTipAmountComment = getTipAmount(comment.body)
                if (!getTipAmount) {
                    return
                }
                try {
                    let { balances } = await getUserBalance(comment.author.name)
                    if (balances.CANNACOIN < getTipAmountComment) {
                        console.log("Error:", "Not enough funds")
                        createMessage(comment.author.name, `Failed to tip`, `Not enough funds. \nYour current balance is ${balances.CANNACOIN} CANNACOIN`)
                        return
                    }
                } catch (error) {
                    console.log("Error:", "Not enough funds")
                    createMessage(comment.author.name, `Failed to tip`, `Not enough funds. \nYour current balance is **NaN** CANNACOIN`)
                    return
                }
                
                let balanceA = await getUserBalance(comment.author.name)
                let balanceB = await getUserBalance(parentComment.author.name)

                let tipResponse = await tipUser(comment.author.name, parentComment.author.name, parseFloat(getTipAmountComment), "CANNACOIN")

                if (!tipResponse.upsertedCount) {
                    createComment(comment, `Sent `+'`'+getTipAmountComment+' CANNACOIN` to '+`u/${parentComment.author.name}`)//+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
                    setUserFlair(comment.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                    setUserFlair(parentComment.author.name, `🪙 ${parseFloat(balanceB.balances.CANNACOIN)+parseFloat(getTipAmountComment)} CANNACOIN`)
                    createMessage(parentComment.author.name, `You received a tip!`, `Someone tipped you ${getTipAmountComment} CANNACOIN.  \nYour sticky-icky balance is ${parseFloat(balanceB.balances.CANNACOIN)+parseFloat(getTipAmountComment)}\n  \nWelcome to Stellar Cannacoin! \n  \nCongrats on your first tip! See the links below for commands.`)
                    return
                }
                createComment(comment, `Creating a new account and sent `+'`'+getTipAmountComment+' CANNACOIN` to '+`u/${parentComment.author.name}`)//+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
                setUserFlair(comment.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                setUserFlair(parentComment.author.name, `🪙 ${getTipAmountComment} CANNACOIN`)
                createMessage(parentComment.author.name, `You received a tip!`, `Someone tipped you ${getTipAmountComment} CANNACOIN.  \nYour sticky-icky balance is ${getTipAmountComment}`)

            break
            default: 
                createComment(comment, `Invalid command`)
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
            console.log(error)

        }
        
    })
}

const getTipAmount = (string) => {
    let regex = /!cannatest ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[1]
}
const getWalletAddress = (string) => {
    let regex = /send ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))? ([A-Za-z0-9\/]+)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[3]
}
const getAmountFromCommand = (string) => {
    let regex = /([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[0]
}
const getBotCommand = (string) => {
    let regex = /(!cannatest?|balance|Balance|send?|Send?|deposit|Deposit|help|Help)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[0]
}

const getBotCommandFull = (string) => {
    let regex = /(!cannatest?|balance|Balance|send?|Send?|deposit|Deposit|help|Help)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)
}

const executeCommand = async (message) => {
    if (message.dest != process.env.REDDIT_USERNAME) {
        return
    }
    let botCommandRaw = getBotCommand(message.body)

    if (!botCommandRaw) {
        replyToMessage(message.id, `Invalid command  \n  \n  \n  **Tipbot help manual**  \nAvailable commands are:\n\n- !canna {amount} (tip a user in the comment section)\n\n\n- balance (get current balance)\n- send {amount} {address} (withdraw funds to external wallet)\n- deposit (despoit funds to account)  \n  \nVisit our [Wiki to know more!](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)`)
        markMessageAsRead(message.id)
        return
    }

    let botCommand = botCommandRaw.toLowerCase()
    console.log("Command found:", botCommand)

    switch(botCommand) {
        case 'balance':
            let { balances } = await getUserBalance(message.author.name)
            let redditBalance = balances?.CANNACOIN
            if (!balances || !balances.CANNACOIN) {
                redditBalance = "0"
            }
            setTimeout(function () {
                replyToMessage(message.id, `Your current tipbot balance is ${parseFloat(redditBalance).toFixed(7)} CANNACOIN`)
                markMessageAsRead(message.id)
                setUserFlair(message.author.name, `🪙 ${redditBalance} CANNACOIN`)
            }, 2000);
            
        break

        case 'send':
            let wallet = getWalletAddress(message.body)
            let amount = getAmountFromCommand(message.body)
            if (!wallet || wallet == null) {
                console.log("Wallet:", wallet)
                console.log("Amount:", amount)
                replyToMessage(message.id,`Something went wrong, invalid command`)
                markMessageAsRead(message.id)
                return
            }
            if (wallet.includes('u/')) {
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
                    replyToMessage(message.id, `Sent `+'`'+amount+' CANNACOIN` to '+`${wallet}`)//+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
                    setUserFlair(message.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                    setUserFlair(wallet.split('u/')[1], `🪙 ${parseFloat(balanceB.balances.CANNACOIN)+parseFloat(amount)} CANNACOIN`)
                    createMessage(wallet.split('u/')[1], `You received a tip!`, `Someone tipped you ${amount} CANNACOIN.  \nYour sticky-icky balance is ${parseFloat(balanceB.balances.CANNACOIN)+parseFloat(amount)}\n  \nWelcome to Stellar Cannacoin! \n  \nCongrats on your first tip! See the links below for commands.`)
                    markMessageAsRead(message.id)
                    return
                }
                replyToMessage(message.id, `Creating a new account and sent `+'`'+amount+' CANNACOIN` to '+`${wallet}`)//+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
                setUserFlair(message.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                setUserFlair(wallet.split('u/')[1], `🪙 ${amount} CANNACOIN`)
                createMessage(wallet.split('u/')[1], `You received a tip!`, `Someone tipped you ${amount} CANNACOIN.  \nYour sticky-icky balance is ${amount}`)
                markMessageAsRead(message.id)
                return
            }

            let balance = await getUserBalance(message.author.name)

            if (balance.balances.CANNACOIN < amount) {
                replyToMessage(message.id, `Failed to withdraw  \n  \nNot enough funds. \nYour current balance is ${balance.balances.CANNACOIN} CANNACOIN`)
                markMessageAsRead(message.id)
                return
            }

            withdrawToWallet("Withdrawal", amount, wallet)
            .then(async data => {
                console.log("DATA: "+data)
                if (data) {
                    let amount_negative = -Math.abs(amount)
                    updateBalance(message.author.name, amount_negative, "CANNACOIN")
                    replyToMessage(message.id, `We've started the process of moving ${amount} CANNACOIN to the wallet ${wallet}`)
                    markMessageAsRead(message.id)

                    let balanceA = await getUserBalance(message.author.name)
                    setUserFlair(message.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                    return
                }
                replyToMessage(message.id, `Something went wrong, please try again later`)
                markMessageAsRead(message.id)
            })
            .catch(error => {
                replyToMessage(message.id, `Something went wrong, please try again later. \n  \nRelated to the Stellar Network`+'```  '+error+'  ```')
            })
        break
        
        case 'deposit':
            replyToMessage(message.id, `Send the desired amount to the address `+'`'+`${process.env.WALLET_PUBLIC}`+'`'+` using the memo `+'`'+`${message.author.name}`+'`')
            markMessageAsRead(message.id)
        break
        case 'help':
            replyToMessage(message.id,  `**Tipbot help manual**  \nAvailable commands are:\n\n- !canna {amount} (tip a user in the comment section)\n\n\n- balance (get current balance)\n- send {amount} {address} (withdraw funds to external wallet)\n- send {amount} {u/reddit_user} (send funds to Reddit user)\n- deposit (deposit funds to account)  \n  \nVisit our [Wiki to know more!](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)`)
            markMessageAsRead(message.id)
        break
        default:
            replyToMessage(message.id, `**Invalid command**  \nAvailable commands are:\n\n- !canna {amount} (tip a user in the comment section)\n\n\n- balance (get current balance)\n- send {amount} {address} (withdraw funds to external wallet)\n- send {amount} {u/reddit_user} (send funds to Reddit user)\n- deposit (deposit funds to account)  \n  \nVisit our [Wiki to know more!](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)`)
            markMessageAsRead(message.id)
        break
    }
}

const createMessage = (user, title, text) => {
    return r.composeMessage({
        to: user,
        subject: title,
        text: text+'  \n  \n  [`Commands`](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)  \n  \n  \n  [`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)'
    })
}
const createComment = (comment, text) => {
    comment.reply(text+'  \n  \n  [`Commands`](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)  \n  \n  \n  [`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
}
const createSubmission = (title, text) => {
    r.getSubreddit(process.env.SUBREDDIT)
    .submitSelfpost({title: title, text: text})
}

const getInbox = () => {
    return r.getInbox({filter: 'messages'})
}
const markMessageAsRead = (id) => {
    return r.getMessage(id).markAsRead()
}
const replyToMessage = (id, text) => {
    return r.getMessage(id).reply(text+'  \n  \n  [`Commands`](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki)  \n  \n  \n  [`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
}
const setUserFlair = (user, flair) => {
    r.getUser(user).assignFlair({subredditName: process.env.SUBREDDIT, text: flair})
}

module.exports = {
    getWalletAddress,
    getAmountFromCommand,
    getComments,
    getTipAmount,
    getBotCommand,
    getBotCommandFull,
    executeCommand,
    createSubmission,
    createMessage,
    createComment,
    getInbox,
    markMessageAsRead,
    messageStream,
    setUserFlair
}