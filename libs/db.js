require('dotenv').config()

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

const fetchRewardRecords = async () => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        // const collection = db.collection('users')
        // const results = await collection.find().toArray()
        const collection = db.collection('post_logs')
        // const results = await collection.find().toArray()
        const results = await collection.aggregate([
            {$group: {
                _id: "$user",
                score: {$sum: "$score"}
            }}

            // $group:
            //         {
            //             _id: "total_karma",
            //             karma: { $sum: "$score" },
            //         }
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

const updateBalance = (user, amount, token) => {
    return new Promise(async resolve => {
        let balanceCurrency = `balances.${token}`

        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const resultsA = await collection.updateOne({user: user}, {$inc: { [balanceCurrency]: amount }}, {upsert: true})
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
        const resultsA = await collection.updateOne({user: from}, {$inc: { [balanceCurrency]: amount_negative }})
        const resultsB = await collection.updateOne({user: to}, {$inc: { [balanceCurrency]: amount }}, {upsert: true})
        resolve(resultsB)
    })
}

const distributeReward = (user, amount, token) => {
    return new Promise(async resolve => {
        let balanceCurrency = `balances.${token}`

        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.updateOne({user: user}, {$inc: { [balanceCurrency]: amount }})
        resolve(results)
    })
}

const getUserBalance = (user) => {
    return new Promise(async resolve => {
        await client.connect();
        const db = client.db(database)
        const collection = db.collection('users')
        const results = await collection.findOne({user: user})
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
    fetchRewardRecords,
    fetchRewardStats,
    distributeReward,
    updateBalance,
    getUserBalance,
    tipUser,
    botLogger,
    recordPost,
    fetchRewardPostStats
}