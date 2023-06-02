require('dotenv').config()

const cron = require('node-cron')
const { isFeeError, feeBumpTransaction } = require('./stellar')
const { logger } = require('./util')
const { tokens } = require(`../content/tokens`);

const { Keypair, TimeoutInfinite, StrKey } = require('stellar-base')
const stellar = require('stellar-sdk');
const { getTotalPayoutReward } = require('./reward');

const server = new stellar.Server("https://horizon.stellar.org")
const issuerPair = Keypair.fromSecret(process.env.WALLET_KEY_BUFFER)
const issuerPairReceiver = Keypair.fromSecret(process.env.WALLET_KEY)

const transferFunds = async () => {
    return new Promise((resolve, reject) => {
        let amount = getTotalPayoutReward();

        let asset = tokens["CANNACOIN"];
        let stellarAsset = new stellar.Asset(asset.asset_code, asset.asset_issuer)

        server.loadAccount(issuerPair.publicKey())
        .then(function (source) {
            var transaction = new stellar.TransactionBuilder(source, {
                fee: "50000",
                networkPassphrase: stellar.Networks.PUBLIC,
            })
            .addOperation(stellar.Operation.payment({
                destination: issuerPairReceiver.publicKey(),
                amount: parseFloat(amount).toFixed(7),
                asset: stellarAsset
            }))
            .addMemo(stellar.Memo.text("Distribution transfer"))
            .setTimeout(TimeoutInfinite)
            .build();
            transaction.sign(issuerPair)
            return server.submitTransaction(transaction)
        })
        .then(async (data) => {
            resolve(data)
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
}

module.exports = {
    transferFunds
}