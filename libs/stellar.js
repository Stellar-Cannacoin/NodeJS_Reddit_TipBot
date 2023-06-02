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
                        updateBalance(memo, parseFloat(amount), "CANNACOIN")
                        createMessage(memo, "Funds deposited", `You deposited ${amount} ${asset_code} into your account`)
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

module.exports = { 
    startWalletListener,
    depositToWallet,
    feeBumpTransaction,
    isValidAddress,
    isFeeError,
    paymentListener
};