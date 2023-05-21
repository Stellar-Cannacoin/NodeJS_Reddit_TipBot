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
// const { createMessage, a } = require('./reddit');
// const { appLogger } = require('./logger');

const server = new stellar.Server("https://horizon.stellar.org");
const issuerPair = Keypair.fromSecret(process.env.WALLET_KEY);

const startWalletListener = (user) => {
    return `Stellar listener running`
}

const depositToWallet = (user) => {
    return `Send payment to the address '${issuerPair.publicKey()}' with the memo '${user}'`
}

const withdrawToWallet = (memo, amount, wallet) => {
    return new Promise((resolve, reject) => {

        if (!isValidAddress(wallet)) {
            console.log("INVALID WALLET "+wallet)
            return resolve(false)
        }
        // console.log("WITHDRAWAL STARTED: "+JSON.stringify(tokens["CANNACOIN"]))
        // return

        let asset = tokens["CANNACOIN"];
        let stellarAsset = new stellar.Asset(asset.asset_code, asset.asset_issuer)

        // if (asset.asset_code == "XLM") {
        //     stellarAsset = new stellar.Asset.native()
        //     return false
        // }

        server.loadAccount(issuerPair.publicKey())
        .then(function (source) {
            var transaction = new stellar.TransactionBuilder(source, {
                fee: "50000",
                networkPassphrase: stellar.Networks.PUBLIC,
            })
            .addOperation(stellar.Operation.payment({
                destination: wallet,
                amount: parseFloat(amount).toFixed(7),
                asset: stellarAsset
            }))
            .addMemo(stellar.Memo.text(memo))
            .setTimeout(TimeoutInfinite)
            .build();
            transaction.sign(issuerPair)
            return server.submitTransaction(transaction)
        })
        .then(async (data) => {
            console.log(data)
            resolve(true)
        })
        .catch(async (error) => {
            //appLogger('error', error)
            console.log(error)
            if (!error.config.data) {
                return resolve(error)
            }
            /**
             * Catch transaction fails due to fees
             */
            let bumpTransaction = await feeBumpTransaction(error, issuerPair);
            if (!bumpTransaction) {
                return resolve(bumpTransaction)
            }
            resolve(true)
        });
    })
};

const feeBumpTransaction = (error) => {
    return new Promise((resolve, reject) => {
        const lastTx = new stellar.TransactionBuilder.fromXDR(decodeURIComponent(error.config.data.split('tx=')[1]), stellar.Networks.PUBLIC);

        server.submitTransaction(lastTx).catch(function (error) {
            if (isFeeError(error)) {
                let bump = new stellar.TransactionBuilder.buildFeeBumpTransaction(
                    issuerPair,
                    "50000" * 10,
                    lastTx,
                    stellar.Networks.PUBLIC
                );
                bump.sign(issuerPair);
                return server.submitTransaction(bump);
            }
        }).then(() => {
            resolve(true)
        }).catch(error => {
            //appLogger('error', error)
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
    console.log("Listening to address:", issuerPair.publicKey())
    server
    .transactions()
    .forAccount(issuerPair.publicKey())
    .cursor('now')
    .limit(20)
    .stream({
        onmessage: (payment) => {
            let { memo, hash } = payment
            if (!memo) {
                console.log("Missing memo")
                return;
            }

            server.operations()
            .forTransaction(hash)
            .call()
            .then(async (operation) => {
                if (operation.records[0].type_i != 1) {
                    console.log("Not a payment", operation.id)
                    return
                }

                let { asset_code, asset_issuer, asset_type, amount, source_account, to } = operation.records[0]
                let asset = `${asset_code}:${asset_issuer}`

                if (to != issuerPair.publicKey() || source_account == issuerPair.publicKey() || asset != "CANNACOIN:GBLJ4223KUWIMV7RAPQKBA7YGR4I7H2BIV4KIMMXMQWYQBOZ6HLZR3RQ" ) {
                    return
                }
                console.log("Funds deposited", `You deposited ${amount} ${asset_code} into your account`)
                createMessage(memo, "Funds deposited", `You deposited ${amount} ${asset_code} into your account`)
                updateBalance(memo, parseFloat(amount), "CANNACOIN")

            })
            
        },
        onerror: (error) => { 
            return error
        }
    })
}

// const validateAsset = (client, command, target) => {
//     // let currency = command.currency;
//     console.log(JSON.stringify(command))
//     // console.log("CURRENCY: "+currency)
//     // let token = currency.toUpperCase();
//     // console.log("TOKEN: "+token)
//     // if (!tokens[command.currency]) {
//     //     client.say(target, `Invalid currency, currency supported: `);
//     //     for (key in tokens) {
//     //         client.say(target, `💰 - ${key}`);
//     //     }
//     //     return false;
//     // }
//     return true;
// }

module.exports = { 
    startWalletListener,
    depositToWallet,
    isValidAddress,
    paymentListener
};