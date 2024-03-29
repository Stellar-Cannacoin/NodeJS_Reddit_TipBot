/**
 * withdraw.js
 * Handles withdrawal of user funds on Stellar Blockchain,
 * traansfers from custodial wallet (this bot) to an 
 * non-custodial wallet
 */
require('dotenv').config()

const { tokens } = require(`../content/tokens`);
const { Keypair, TimeoutInfinite, StrKey } = require('stellar-base')
const stellar = require('stellar-sdk');
const { isFeeError, isValidAddress } = require('./stellar')

const server = new stellar.Server("https://horizon.stellar.org")
const issuerPair = Keypair.fromSecret(process.env.WALLET_KEY)

/**
 * Withdraw funds to wallet, calling the StellarSDK 
 * @param {*} memo String
 * @param {*} amount String
 * @param {*} wallet String (uppercase)
 * @returns 
 */
const withdrawToWallet = (memo, amount, wallet) => {
    return new Promise((resolve, reject) => {

        if (!isValidAddress(wallet)) {
            return resolve(false)
        }

        let asset = tokens["CANNACOIN"];
        let stellarAsset = new stellar.Asset(asset.asset_code, asset.asset_issuer)

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
            .build()

            transaction.sign(issuerPair)
            return server.submitTransaction(transaction)
        })
        .then(async (data) => {
            resolve(true)
        })
        .catch(async (error) => {
            /**
             * Log error to better understand whats failing
             */
            console.log("error sending payment", error)
            console.log(JSON.stringify(error.config.data))
            
            /**
             * Check if the error is a fee error or a generic one
             */
            if (!isFeeError(error)) {
                return reject(error)
            }
            /**
             * Catch transaction fails due to fees
             * Resubmits the tx to the chain with a higher fee
             */
            feeBumpTransaction(error, issuerPair)
            .then(data => {
                console.log(data)
                resolve(true)
            })
            .catch(error => {
                console.log(JSON.stringify(error.config.data))
                reject(error)
            })
        });
    })
};

/**
 * Create a fee bump transaction
 * @param {Object} error Error presented from StellarSDK
 * @returns {Boolean} true/false
 */
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
            reject(error)
        });
    })
}

module.exports = { 
    withdrawToWallet
};