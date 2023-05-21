require('dotenv').config()

const { CommentStream, InboxStream } = require("snoostorm")
const Snoowrap = require('snoowrap')
const { tipUser, getUserBalance, updateBalance } = require('./db')
const axios = require('axios')
const { withdrawToWallet } = require('./withdraw')

const r = new Snoowrap({
	userAgent: 'some-description',
	clientId: process.env.APP_ID,
	clientSecret: process.env.API_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
})

r.config({ continueAfterRatelimitError: true })

const stream = new CommentStream(r, { subreddit: process.env.SUBREDDIT, results: 1 })
// const messageStream = new InboxStream(r, {filter: 'messages'})

let runtimeDate = new Date();

const messageStream = async () => {
    let inbox = await getInbox()
    inbox.map(async message => {
        // console.log(message)
        
        if (message.new) {
            if (message.dest != process.env.REDDIT_USERNAME) {
                return
            }
            let botCommand = getBotCommand(message.body)

            if (!botCommand) {
                return
            }
            console.log("Command found: "+botCommand)
            console.log("Message new: "+message.new)

            switch(botCommand) {
                case 'balance':
                    console.log("Message: ", message.id)
                    let { balances } = await getUserBalance(message.author.name)
                    createMessage(message.author.name, `TipBot Balance`, `Your current tipbot balance is ${balances.CANNACOIN} CANNACOIN`)
                    markMessageAsRead(message.id)
                    setUserFlair(message.author.name, `🪙 ${balances.CANNACOIN} CANNACOIN`)
                break

                case 'send':
                    console.log("Message withdrawal: ", message.id)
                    // let strcommand = '!withdraw 1.00 to GDGK2GOKOIXLPU7DONRDWFSQ6R3SNQ7U2KYIBLXHU42HTBTPQUMKVVR7'
                    let command = getBotCommand(message.body)
                    // console.log("command", command)
                    let wallet = getWalletAddress(message.body)
                    let amount = getAmountFromCommand(message.body)

                    let balance = await getUserBalance(message.author.name)

                    if (balance.balances.CANNACOIN < amount) {
                        createMessage(message.author.name, `Failed to withdraw`, `Not enough funds. \nYour current balance is ${balance.balances.CANNACOIN} CANNACOIN`)
                        markMessageAsRead(message.id)
                        return
                    }

                    console.log("wallet", wallet)
                    withdrawToWallet("Withdrawal", amount, wallet)
                    .then(async data => {
                        console.log("DATA: "+data)
                        if (data) {
                            let amount_negative = -Math.abs(amount)
                            updateBalance(message.author.name, amount_negative, "CANNACOIN")
                            console.log("Sent funds")
                            createMessage(message.author.name, `Withdrawal started processing`, `We've started the process of moving ${amount} CANNACOIN to the wallet ${wallet}`)
                            markMessageAsRead(message.id)
                            let balanceA = await getUserBalance(message.author.name)
                            setUserFlair(message.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                            return
                        }
                        createMessage(message.author.name, `Failed to withdraw`, `Something went wrong, please try again later`)
                        markMessageAsRead(message.id)
                    })
                    .catch(error => {
                        console.log("ERROR:" +error)
                    })
                break
                
                case 'deposit':
                    createMessage(message.author.name, "How to deposit funds to the tipbot", `Send the desired amount to the address ${process.env.WALLET_PUBLIC} using the memo **${message.author.name}**`)
                    markMessageAsRead(message.id)
                break
                case 'help':
                    createMessage(message.author.name, "TipBot - Help manual ", `## We are happy to see you using our tipbot!\nAvailable commands are:\n\n- !canna {amount} (tip a user in the comment section)\n\n\n- balance (get current balance)\n- send {amount} {address} (withdraw funds to external wallet)\n- deposit (despoit funds to account)`)
                    markMessageAsRead(message.id)
                break
                default:
                    // reddit.createMessage(message.author.name, `TipBot`, `Invalid command`)
                break
            }
            
            return
        } 
        
        // else {
        //     console.log("Command found: "+botCommand)
        // }
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
                console.log(getTipAmountComment)
                if (!getTipAmount) {
                    return
                }
                try {
                    let { balances } = await getUserBalance(comment.author.name)
                    if (balances.CANNACOIN < getTipAmountComment) {
                        console.log("Error:", "Not enough funds")
                        return
                    }
                } catch (error) {
                    console.log("Error:", "Not enough funds")
                    return
                }
                
                console.log(`${comment.author.name} tipped:`, `${parentComment.author.name} ${getTipAmountComment} CANNACOIN`)
                let balanceA = await getUserBalance(comment.author.name)
                let balanceB = await getUserBalance(parentComment.author.name)

                let tipResponse = await tipUser(comment.author.name, parentComment.author.name, parseFloat(getTipAmountComment), "CANNACOIN")
                console.log("Replying to: "+parentComment.author.name)
                // return
                if (!tipResponse.upsertedCount) {
                    createComment(comment, `Sent `+'`'+getTipAmountComment+' CANNACOIN` to '+`u/${parentComment.author.name}`)//+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
                    setUserFlair(comment.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                    setUserFlair(parentComment.author.name, `🪙 ${balanceB.balances.CANNACOIN} CANNACOIN`)
                    return
                }
                createComment(comment, `Creating a new account and sent `+'`'+getTipAmountComment+' CANNACOIN` to '+`u/${parentComment.author.name}`)//+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
                setUserFlair(comment.author.name, `🪙 ${balanceA.balances.CANNACOIN} CANNACOIN`)
                setUserFlair(parentComment.author.name, `🪙 ${getTipAmountComment} CANNACOIN`)
            break

            default: 
                createComment(comment, `Invalid command`)
                console.log("Defaulting, nothing to do")
            break
        }
    });
    return

    // console.log("Author: " + parentCommentUser)
    
    // console.log("replies: ", comment.replies)
    // console.log(comment.link_id)
    // let botReplies = 0;
    // let comments = await getComments(comment.link_id);
    // r.getComment(comment.parent_id).fetch().then(parentComment => {
    //     console.log(parentComment.body);
    //     console.log(parentComment.author.name);
    // });
    // console.log(comments)
    // await comments.map(subComment => {
    //     console.log("----------")
    //     console.log("PAR: ", comment.parent_id)
    //     // console.log("SUB: ", subComment.id)
    //     // console.log("PAR: ", comment.link_id)
    //     // console.log("PAR: ", comment.name)
    //     console.log("SUB: ", subComment.parent_id)
    //     if (subComment.id == comment.id) {
    //         console.log("FOUND COMMENT REPLYING TO", subComment.author.name)
    //     }
    // })
    //     botReplies = 0;
    //     // let upvotes = comment.ups-comment.downs
    //     if (subComment.replies < 0) {
    //         return
    //     }
    //     // console.log("Replies: "+JSON.stringify(subComment.replies))
    //     // console.log("Body: "+subComment.body)
    //     subComment.replies.map(subReplies => {
    //         console.log(subReplies.author.name, subReplies.body)
    //         // console.log(process.env.REDDIT_USERNAME)
    //         if (subReplies.author.name == process.env.REDDIT_USERNAME) {
    //             botReplies++
    //         }
    //         // console.log("Reply from", JSON.stringify(subReplies.author))
    //     })
    //     // console.log(subComment.body)
    //     // console.log("Bot replies: "+botReplies)
    // })

    // if (botReplies != 0) {
    //     // console.log("Bot already replied to: ")
    //     return
    // }

    

    // if (!parentCommentUser) {
    //     parentCommentUser = parentPostUser
    // }

    // if (!comment.body.includes('!cannatest')) {
    //     // console.log("DOES NOT INCLUDE")
    //     return false
    // }

    // if (parentCommentUser == comment.author.name) {
    //     console.log("SAME USER", "SKIPPING")
    //     return
    // }

    
    
    
    
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
    let regex = /send ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))? ([A-Za-z0-9]+)/
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
    let regex = /(!cannatest?|balance|send?|deposit|help)/
    // console.log(string.match(regex))
    if (!string.match(regex)) {
        return false
    }

    // if (string.match(regex)[0].includes('!withdraw')) {
    //     return string.match(regex)[1]
    // }
    return string.match(regex)[0]
}
const getCommentAuthor = (id) => {
    console.log(id)
    return new Promise (async resolve => {
        axios.get(`https://www.reddit.com/api/info.json?id=${id}`)
        .then(({data}) => {
            // console.log(data.data.children)
            if (data.data.children.length == 0) {
                return resolve(false)
            }
            resolve(data.data.children[0].data.author)
        })
    })
}

const executeCommand = (command) => {

}

const createMessage = (user, title, text) => {
    return r.composeMessage({
        to: user,
        subject: title,
        text: text+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)'
    })
}
const createComment = (comment, text) => {
    comment.reply(text+'\n\n\n[`Cannacoin`](https://stellarcannacoin.org) | [`StashApp`](https://stashapp.cloud) | [`Reddit`](https://www.reddit.com/r/StellarCannaCoin) | [`Discord`](https://discord.gg/5Hy5WkHgZ5) | [`GitHub`](https://github.com/stellar-Cannacoin)')
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

const setUserFlair = (user, flair) => {
    r.getUser(user).assignFlair({subredditName: process.env.SUBREDDIT, text: flair})
}

module.exports = {
    getWalletAddress,
    getAmountFromCommand,
    getComments,
    getTipAmount,
    getBotCommand,
    executeCommand,
    createSubmission,
    createMessage,
    createComment,
    getInbox,
    markMessageAsRead,
    messageStream,
    setUserFlair
}