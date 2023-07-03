const { updateBalance, updateBalanceTest, updateUserTest } = require('./db')

require('dotenv').config()

const importFromSQL = async () => {
    let dump = require('../backup/accounts.json')
    dump.map(async account => {
        let convertedbalance = parseFloat(account.balance/10000000)
        // const myBigInt = BigInt(10);  // `10n` also works
        // const myNumber = Number(myBigInt);
        // if (account.user == "Scarcity-Pretend") {
            let accountobject = {
                user: account.user.toLowerCase(),
                balances: {
                    CANNACOIN: convertedbalance
                }
            }
            console.log(accountobject.user + "_"+convertedbalance, "CANNACOIN")
            await updateBalanceTest(accountobject)
            // .then(data => {
            //     console.log("data", data)
            // })
            // .catch(error => {
            //     console.log("error", error)
            // })
            console.log("Imported", accountobject.user)
        // }
        // }
        
    })
}

const updateFromSQL = async () => {
    let dump = require('../backup/accounts.json')
    dump.map(async account => {
        let convertedbalance = parseFloat(account.balance/10000000)
        // const myBigInt = BigInt(10);  // `10n` also works
        // const myNumber = Number(myBigInt);
        // if (account.user == "scarcity-pretend" || account.user == "crosspuffs") {
            let accountobject = {
                user: account.user.toLowerCase(),
                balances: {
                    CANNACOIN: convertedbalance
                },
                optin: account.optin
            }
            console.log(accountobject.user + "_"+convertedbalance, "CANNACOIN")
            // await updateBalanceTest(accountobject)
            await updateUserTest(accountobject)
            // .then(data => {
            //     console.log("data", data)
            // })
            // .catch(error => {
            //     console.log("error", error)
            // })
            console.log("Imported", accountobject.user)
        // }
        // }
        
    })
}

module.exports = { importFromSQL, updateFromSQL }