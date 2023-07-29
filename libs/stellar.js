/**
 * stellar.js
 * Handles all Stellar Blockchain transactions &
 * check-in methods, likev verify tx hash
 */
require('dotenv').config()

const { tokens } = require(`../content/tokens`);
const { Keypair, TimeoutInfinite, StrKey } = require('stellar-base');
const stellar = require('stellar-sdk');
const { updateBalance } = require('./db');
const { createMessage } = require('./reddit');

const server = new stellar.Server("https://horizon.stellar.org");
const issuerPair = Keypair.fromSecret(process.env.WALLET_KEY);

const startWalletListener = (user) => {
    return `Stellar listener running`
}

const depositToWallet = (user) => {
    return `Send payment to the address '${issuerPair.publicKey()}' with the memo '${user}'`
}

const feeBumpTransaction = (error, feeIssuer) => {
    return new Promise((resolve, reject) => {
        const lastTx = new stellar.TransactionBuilder.fromXDR(decodeURIComponent(error.config.data.split('tx=')[1]), stellar.Networks.PUBLIC);

        server.submitTransaction(lastTx).catch(function (error) {
            if (isFeeError(error)) {
                let bump = new stellar.TransactionBuilder.buildFeeBumpTransaction(
                    feeIssuer,
                    "50000" * 10,
                    lastTx,
                    stellar.Networks.PUBLIC
                );
                bump.sign(feeIssuer);
                return server.submitTransaction(bump);
            }
        }).then((data) => {
            resolve(data)
        }).catch(error => {
            resolve(false)
        });
    })
}

const isFeeError = (error) => {
    return (
      error.response !== undefined &&
      error.status === 400 &&
      error.extras &&
      error.extras.result_codes.transaction === sdk.TX_INSUFFICIENT_FEE
    );
}

const isValidAddress = (address) => {
    let validAddress = /([A-Za-z]+([0-9]+[A-Za-z]+)+)/.test(address);
    let validAddressChain = StrKey.isValidEd25519PublicKey(address);
    if (validAddress && validAddressChain) {
        return true;
    }
    return false;
}

const paymentListener = () => {
    return new Promise((resolve, reject) => {
        try {
            server
            .transactions()
            .forAccount(issuerPair.publicKey())
            .cursor('now')
            .limit(20)
            .stream({
                onmessage: (payment) => {
                    let { memo, hash } = payment
                    if (!memo) {
                        return;
                    }
        
                    server.operations()
                    .forTransaction(hash)
                    .call()
                    .then(async (operation) => {
                        if (operation.records[0].type_i != 1) {
                            return
                        }
        
                        let { asset_code, asset_issuer, asset_type, amount, source_account, to } = operation.records[0]
                        let asset = `${asset_code}:${asset_issuer}`
        
                        if (to != issuerPair.publicKey() || source_account == issuerPair.publicKey() || asset != "CANNACOIN:GBLJ4223KUWIMV7RAPQKBA7YGR4I7H2BIV4KIMMXMQWYQBOZ6HLZR3RQ" ) {
                            return
                        }
                        updateBalance(memo.toLowerCase(), parseFloat(amount), "CANNACOIN")
                        try {
                            createMessage(memo, 'Funds deposited', `You deposited ${amount} ${asset_code} into your account`)
                        } catch (error) {
                            console.log("Failed to send message?")
                            console.log(error)
                        }
                        
                    })
                    
                },
                onerror: (error) => { 
                    return error
                }
            })
            resolve(true)
        } catch (error) {
            reject(error)
        }
    })
    
}

const createDistributionTransaction = (transactions, reward, account) => {
    return new Promise(async resolve => {
        let StellarOperations = []
        await transactions.map(transaction => {
            console.log(reward*transaction.score)
            StellarOperations.push(
                stellar.Operation.payment({
                    destination: account,
                    asset: new stellar.Asset('CANNACOIN', 'GBLJ4223KUWIMV7RAPQKBA7YGR4I7H2BIV4KIMMXMQWYQBOZ6HLZR3RQ'),
                    amount: "1.0000000",//parseFloat(reward*transaction.score).toFixed(7),
                    fee: "10000",
                    memo: stellar.Memo.text(transaction._id)
                })
                // .addMemo(stellar.Memo.text(transaction._id))
            )
        })
        resolve(StellarOperations)
        
    })
    
}

const submitDistributionTransaction = (transactions) => {
    return new Promise((resolve, reject) => {
        // console.log(JSON.stringify(txArray))
        var fee = (transactions.length*1000).toString();
        server.loadAccount(issuerPair.publicKey()).then(account => {
            console.log("[stellar]: Creating & signing transactions")
            const txBuilder = new stellar.TransactionBuilder(account, {fee, networkPassphrase: Networks.PUBLIC});
            txBuilder.operations = transactions;
            // txBuilder.addMemo(stellar.Memo.text(pool+' Pool Reward'));
            txBuilder.setTimeout(TimeoutInfinite);
            const tx = txBuilder.build();
            tx.sign(issuerPair);
            // resolve(server.submitTransaction(tx));
            return(server.submitTransaction(tx))
        })
        .then(data => {
            console.log("Paid out")
            console.log(data)
            resolve(true)
        })
        .finally(data => {
            console.log("[stellar]: Transaction done")
            console.log("[stellar]: "+JSON.stringify(data))
        })
        .catch(error => {
            // console.log(JSON.stringify(error.extras.result_codes))
            console.log(JSON.stringify(error))
            // if (!error.config.data) {
            //     console.log({status: "ERROR", message: "Invalid XDR", payload: []})
            //     return;
            // }
        })
    })
}

const createDistributionTransactionPayout = (transaction, reward) => {
    return new Promise((resolve, reject) => {
        console.log(JSON.stringify(transaction))
        console.log(JSON.stringify(reward))
        // let transactions = 
        var fee = (1*1000).toString();
        server.loadAccount(issuerPair.publicKey()).then(account => {
            console.log("[stellar]: Creating & signing transactions")
            const txBuilder = new stellar.TransactionBuilder(account, {fee, networkPassphrase: stellar.Networks.PUBLIC});
            txBuilder.operations = [
                stellar.Operation.payment({
                    destination: "GCFUOOQN6VJNAD5OL36DGVL6WLTFCJZGOYKJMI7QUJQFRSTXULMYSICC",
                    asset: new stellar.Asset('CANNACOIN', 'GBLJ4223KUWIMV7RAPQKBA7YGR4I7H2BIV4KIMMXMQWYQBOZ6HLZR3RQ'),
                    amount: "1.0000000",//parseFloat(reward*transaction.score).toFixed(7),
                    fee: "10000",
                    // memo: stellar.Memo.text(transaction._id)
                })
            ];
            txBuilder.addMemo(stellar.Memo.text(transaction._id));
            txBuilder.setTimeout(TimeoutInfinite);
            const tx = txBuilder.build();
            tx.sign(issuerPair);
            // resolve(server.submitTransaction(tx));
            return(server.submitTransaction(tx))
        })
        .then(data => {
            console.log("[stellar]: Transaction done", data)
            resolve(true)
        })
        // .finally(data => {
        //     console.log("[stellar]: Transaction done")
        //     // console.log("[stellar]: "+JSON.stringify(data))
        // })
        .catch(error => {
            // console.log(JSON.stringify(error.extras.result_codes))
            console.log("error", JSON.stringify(error))
            // if (!error.config.data) {
            //     console.log({status: "ERROR", message: "Invalid XDR", payload: []})
            //     return;
            // }
            resolve(false)
        })
    })
}

module.exports = { 
    startWalletListener,
    depositToWallet,
    feeBumpTransaction,
    isValidAddress,
    isFeeError,
    paymentListener,
    createDistributionTransaction,
    submitDistributionTransaction,
    createDistributionTransactionPayout
};