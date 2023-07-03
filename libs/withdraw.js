/**
 * withdraw.js
 * Handles withdrawal of user funds on Stellar Blockchain,
 * traansfers from custodial wallet (this bot) to an non-custodial
 * wallet
 */
require('dotenv').config()

const { tokens } = require(`../content/tokens`);
const { Keypair, TimeoutInfinite, StrKey } = require('stellar-base')
const stellar = require('stellar-sdk');
const { isFeeError, isValidAddress } = require('./stellar')

const server = new stellar.Server("https://horizon.stellar.org")
const issuerPair = Keypair.fromSecret(process.env.WALLET_KEY)

/**
 * 
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
            .build();
            transaction.sign(issuerPair)
            return server.submitTransaction(transaction)
        })
        .then(async (data) => {
            resolve(true)
        })
        .catch(async (error) => {
            if (!isFeeError(error)) {
                return resolve(error)
            }
            /**
             * Catch transaction fails due to fees
             * Resubmits the tx to the chain with a higher fee
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
            resolve(false)
        });
    })
}

module.exports = { 
    withdrawToWallet
};