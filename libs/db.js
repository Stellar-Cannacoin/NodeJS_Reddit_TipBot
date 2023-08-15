require('dotenv').config()

const moment = require('moment');
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URL);
const database = process.env.MONGO_DB;

const storeDailyScore = (object) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateOne({user : object.user}, {$inc: {score: object.score}}, {upsert: true})
        resolve(results)
    })
}

const recordPost = (object) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.updateOne({id: object.id}, {$set: object}, {upsert: true})
        resolve(results)
    })
}

const storeMonthlyReward = (array) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateOne({user : object.user}, {$inc: {score: object.score}}, {upsert: true})
        resolve(results)
    })
}

const resetScore = () => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateMany({}, {$set: {score: 0}})
        resolve(results)
    })
}

const fetchRewardRecords = async (start, end) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        console.log(moment().subtract(1,'months').endOf('month').format('YYYY-MM-DD hh:mm'), new Date(moment().subtract(1,'months').startOf('month').format('YYYY-MM-DD hh:mm')))

        const results = await collection.aggregate([
            { $match: { 
                ts: {
                    $gte: new Date(moment().subtract(1,'months').startOf('month').format('YYYY-MM-DD hh:mm')),
                    $lte: new Date(moment().subtract(1,'months').endOf('month').format('YYYY-MM-DD hh:mm'))
                    }
                }
            },
            {$group: {
                _id: "$user",
                score: {$sum: "$score"}
            }}
            // Needs to add a filter on date, so it will only capture the previuous month's logs
            // Or we can simply just remove the data in the database EOM
        ]).toArray()
        resolve(results)
    })
}
const fetchRewardRecordsCurrent = async (start, end) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.aggregate([
            { $match: { 
                ts: {
                    $gte: new Date(moment().startOf('month').format('YYYY-MM-DD hh:mm')),
                    $lte: new Date(moment().endOf('month').format('YYYY-MM-DD hh:mm'))
                    }
                }
            },
            {$group: {
                _id: "$user",
                score: {$sum: "$score"}
            }}
            // Needs to add a filter on date, so it will only capture the previuous month's logs
            // Or we can simply just remove the data in the database EOM
        ]).toArray()
        resolve(results)
    })
}
const fetchLeaderboardAlltime = async (start, end) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.aggregate([
            {$group: {
                _id: "$user",
                score: {$sum: "$score"}
            }}
            // Needs to add a filter on date, so it will only capture the previuous month's logs
            // Or we can simply just remove the data in the database EOM
        ]).sort({score: 1}).limit(5).toArray()
        resolve(results)
    })
}
const fetchLeaderboard = async () => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.aggregate([
            { $match: { 
                ts: {
                    $gte: new Date(moment().startOf('month').format('YYYY-MM-DD hh:mm')),
                    $lte: new Date(moment().endOf('month').format('YYYY-MM-DD hh:mm'))
                    }
                }
            },
            {$group: {
                _id: "$user",
                score: {$sum: "$score"}
            }}
            // Needs to add a filter on date, so it will only capture the previuous month's logs
            // Or we can simply just remove the data in the database EOM
        ]).sort({score: -1}).limit(5).toArray()
        resolve(results)
    })
}
const getUserKarma = async (user) => {
    return new Promise(async resolve => {

        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.aggregate([
            { $match: { 
                $and: [ 
                    {ts: { $gte: new Date(moment().startOf('month').format('YYYY-MM-DD hh:mm')), $lte: new Date(moment().endOf('month').format('YYYY-MM-DD hh:mm')) } },
                    {$or: [
                        {user: user},
                        {user: user.toLowerCase()}
                    ]}
                    
                ]
            }},
            {$group: {
                _id: "$user",
                score: {$sum: "$score"}
            }}
        ]).limit(1).toArray()
        if (results.length > 0) {
            return resolve(results[0])
        }

        return resolve({_id: user, score: 0})
        
    })
}
const getUserWallet = async (user) => {
    return new Promise(async resolve => {

        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.findOne({user: user})
        
        if (!results) {
            return resolve({message: "No user found"})
        }

        return resolve({_id: user, wallet: results?.wallet})
        
    })
}
const linkUserWallet = async (user, wallet) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateOne({user: user}, {$set: {wallet: wallet}})

        return resolve(results)
        
    })
}
const fetchRewardRecordsUsers = async () => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.aggregate([
            {$group: {
                _id: "$user",
                score: {$sum: "$score"}
            }}
        ]).toArray()
        resolve(results)
    })
}
const fetchRewardStats = async () => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.aggregate(
            [
                {
                    $group:
                    {
                        _id: "total_karma",
                        karma: { $sum: "$score" },
                    }
                }
            ]
        ).toArray()
        resolve(results[0])
    })
}
const fetchRewardPostStats = async () => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.aggregate(
            [
                { $match: { 
                    ts: {
                        $gte: new Date(moment().startOf('month').format('YYYY-MM-DD hh:mm')),
                        $lte: new Date(moment().endOf('month').format('YYYY-MM-DD hh:mm'))
                        }
                    }
                },
                {
                    $group:
                    {
                        _id: "total_karma",
                        karma: { $sum: "$score" },
                    }
                }
            ]
        ).toArray()
        resolve(results[0])
    })
}
const fetchRewardPostStatsCron = async () => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.aggregate(
            [
                { $match: { 
                    ts: {
                        $gte: new Date(moment().subtract(1,'months').startOf('month').format('YYYY-MM-DD hh:mm')),
                        $lte: new Date(moment().subtract(1,'months').endOf('month').format('YYYY-MM-DD hh:mm'))
                        }
                    }
                },
                {
                    $group:
                    {
                        _id: "total_karma",
                        karma: { $sum: "$score" },
                    }
                }
            ]
        ).toArray()
        resolve(results[0])
    })
}

const fetchRewardPostStatsMonth = async (month) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('post_logs')
        const results = await collection.aggregate(
            [
                { $match: { 
                    ts: {
                        $gte: new Date(moment(new Date(`${month}-01-2023`)).startOf('month').format('YYYY-MM-DD hh:mm')),
                        $lte: new Date(moment(new Date(`${month}-01-2023`)).endOf('month').format('YYYY-MM-DD hh:mm'))
                        }
                    }
                },
                {
                    $group:
                    {
                        _id: "total_karma",
                        karma: { $sum: "$score" },
                    }
                }
            ]
        ).toArray()
        console.log(results)
        resolve(results[0])
    })
}

const updateBalance = (user, amount, token) => {
    return new Promise(async resolve => {
        let balanceCurrency = `balances.${token}`
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const resultsA = await collection.updateOne({user: user.toLowerCase()}, {$inc: { [balanceCurrency]: amount }})
        resolve(resultsA)
    })
}

const updateBalanceTest = (user, amount, token) => {
    return new Promise(async resolve => {
        console.log("user:", user)
        // return
        // let balanceCurrency = `balances.${token}`
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const resultsA = await collection.insertOne(user)
        resolve(resultsA)
    })
}
const updateUserTest = (user) => {
    return new Promise(async resolve => {
        console.log("user:", user)
        // return
        // let balanceCurrency = `balances.${token}`
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const resultsA = await collection.updateOne({user: user.user}, {$set: {optin: user.optin}})
        resolve(resultsA)
    })
}

const tipUser = (from, to, amount, token) => {
    return new Promise(async resolve => {
        let amount_negative = -Math.abs(amount)
        let balanceCurrency = `balances.${token}`

        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const resultsA = await collection.updateOne({user: from.toLowerCase()}, {$inc: { [balanceCurrency]: amount_negative }})
        const resultsB = await collection.updateOne({user: to.toLowerCase()}, {$inc: { [balanceCurrency]: amount }}, {upsert: true})
        resolve(resultsB)
    })
}

const updateOptIn = (user, state) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateOne({user: user.toLowerCase()}, {$set: { optin: state }})
        resolve(results)
    })
}

const distributeReward = (user, amount, token) => {
    return new Promise(async resolve => {
        let balanceCurrency = `balances.${token}`

        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateOne({user: user.toLowerCase()}, {$inc: { [balanceCurrency]: amount }})
        resolve(results)
    })
}

const getUserBalance = (user) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.findOne({user: user.toLowerCase()})
        if (!results) {
            return resolve({balances: {"CANNACOIN": 0}})
        }
        resolve(results)
    })
}

/**
 * Fetch user accounts with flair enabled
 * Used for CRON jobs
 * @param {String} user Reddit username
 * @returns 
 */
const fetchUsers = (user) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.find({flair: true}).toArray()
        resolve(results)
    })
}

/**
 * Update user preferences for user flair
 * @param {String} user Reddit username 
 * @param {Boolean} flair true/false
 * @param {String} flair_type karma/balance
 * @param {String} flair_sub Users old flair
 * @returns 
 */
const updateUserFlairStatus = (user, flair, flair_type, flair_sub) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateOne({user: user}, {
            $set: {
                flair: flair, 
                flair_type, flair_type, 
                flair_sub: flair_sub
            }
        })
        console.log("db", {
            flair: flair, 
            flair_type, flair_type, 
            flair_sub: flair_sub
        })
        resolve(results)
    })
}

const botLogger = (document) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('logs')
        const results = await collection.insertOne(document)
        resolve(results)
    })
}

module.exports = {
    storeDailyScore,
    storeMonthlyReward,
    resetScore,
    fetchUsers,
    fetchRewardRecords,
    fetchRewardRecordsUsers,
    fetchRewardStats,
    distributeReward,
    updateBalance,
    updateBalanceTest,
    updateUserTest,
    getUserBalance,
    getUserKarma,
    getUserWallet,
    linkUserWallet,
    tipUser,
    botLogger,
    recordPost,
    fetchRewardPostStats,
    fetchRewardPostStatsCron,
    fetchRewardPostStatsMonth,
    fetchRewardRecordsCurrent,
    fetchLeaderboard,
    fetchLeaderboardAlltime,
    updateOptIn,
    updateUserFlairStatus
}