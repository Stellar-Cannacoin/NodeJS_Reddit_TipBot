"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
var tslib_1 = require("tslib");
var clone_1 = tslib_1.__importDefault(require("lodash/clone"));
var randombytes_1 = tslib_1.__importDefault(require("randombytes"));
var stellar_base_1 = require("stellar-base");
var errors_1 = require("./errors");
var Utils;
(function (Utils) {
    function buildChallengeTx(serverKeypair, clientAccountID, homeDomain, timeout, networkPassphrase, webAuthDomain, memo, clientDomain, clientSigningKey) {
        if (timeout === void 0) { timeout = 300; }
        if (memo === void 0) { memo = null; }
        if (clientDomain === void 0) { clientDomain = null; }
        if (clientSigningKey === void 0) { clientSigningKey = null; }
        if (clientAccountID.startsWith("M") && memo) {
            throw Error("memo cannot be used if clientAccountID is a muxed account");
        }
        var account = new stellar_base_1.Account(serverKeypair.publicKey(), "-1");
        var now = Math.floor(Date.now() / 1000);
        var value = randombytes_1.default(48).toString("base64");
        var builder = new stellar_base_1.TransactionBuilder(account, {
            fee: stellar_base_1.BASE_FEE,
            networkPassphrase: networkPassphrase,
            timebounds: {
                minTime: now,
                maxTime: now + timeout,
            },
        })
            .addOperation(stellar_base_1.Operation.manageData({
            name: homeDomain + " auth",
            value: value,
            source: clientAccountID,
        }))
            .addOperation(stellar_base_1.Operation.manageData({
            name: "web_auth_domain",
            value: webAuthDomain,
            source: account.accountId(),
        }));
        if (clientDomain) {
            if (!clientSigningKey) {
                throw Error("clientSigningKey is required if clientDomain is provided");
            }
            builder.addOperation(stellar_base_1.Operation.manageData({
                name: "client_domain",
                value: clientDomain,
                source: clientSigningKey,
            }));
        }
        if (memo) {
            builder.addMemo(stellar_base_1.Memo.id(memo));
        }
        var transaction = builder.build();
        transaction.sign(serverKeypair);
        return transaction
            .toEnvelope()
            .toXDR("base64")
            .toString();
    }
    Utils.buildChallengeTx = buildChallengeTx;
    function readChallengeTx(challengeTx, serverAccountID, networkPassphrase, homeDomains, webAuthDomain) {
        var _a;
        if (serverAccountID.startsWith("M")) {
            throw Error("Invalid serverAccountID: multiplexed accounts are not supported.");
        }
        var transaction;
        try {
            transaction = new stellar_base_1.Transaction(challengeTx, networkPassphrase);
        }
        catch (_b) {
            try {
                transaction = new stellar_base_1.FeeBumpTransaction(challengeTx, networkPassphrase);
            }
            catch (_c) {
                throw new errors_1.InvalidSep10ChallengeError("Invalid challenge: unable to deserialize challengeTx transaction string");
            }
            throw new errors_1.InvalidSep10ChallengeError("Invalid challenge: expected a Transaction but received a FeeBumpTransaction");
        }
        var sequence = Number.parseInt(transaction.sequence, 10);
        if (sequence !== 0) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction sequence number should be zero");
        }
        if (transaction.source !== serverAccountID) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction source account is not equal to the server's account");
        }
        if (transaction.operations.length < 1) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction should contain at least one operation");
        }
        var _d = transaction.operations, operation = _d[0], subsequentOperations = _d.slice(1);
        if (!operation.source) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction's operation should contain a source account");
        }
        var clientAccountID = operation.source;
        var memo = null;
        if (transaction.memo.type !== stellar_base_1.MemoNone) {
            if (clientAccountID.startsWith("M")) {
                throw new errors_1.InvalidSep10ChallengeError("The transaction has a memo but the client account ID is a muxed account");
            }
            if (transaction.memo.type !== stellar_base_1.MemoID) {
                throw new errors_1.InvalidSep10ChallengeError("The transaction's memo must be of type `id`");
            }
            memo = transaction.memo.value;
        }
        if (operation.type !== "manageData") {
            throw new errors_1.InvalidSep10ChallengeError("The transaction's operation type should be 'manageData'");
        }
        if (transaction.timeBounds &&
            Number.parseInt((_a = transaction.timeBounds) === null || _a === void 0 ? void 0 : _a.maxTime, 10) === stellar_base_1.TimeoutInfinite) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction requires non-infinite timebounds");
        }
        if (!validateTimebounds(transaction, 60 * 5)) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction has expired");
        }
        if (operation.value === undefined) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction's operation values should not be null");
        }
        if (!operation.value) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction's operation value should not be null");
        }
        if (Buffer.from(operation.value.toString(), "base64").length !== 48) {
            throw new errors_1.InvalidSep10ChallengeError("The transaction's operation value should be a 64 bytes base64 random string");
        }
        if (!homeDomains) {
            throw new errors_1.InvalidSep10ChallengeError("Invalid homeDomains: a home domain must be provided for verification");
        }
        var matchedHomeDomain;
        if (typeof homeDomains === "string") {
            if (homeDomains + " auth" === operation.name) {
                matchedHomeDomain = homeDomains;
            }
        }
        else if (Array.isArray(homeDomains)) {
            matchedHomeDomain = homeDomains.find(function (domain) { return domain + " auth" === operation.name; });
        }
        else {
            throw new errors_1.InvalidSep10ChallengeError("Invalid homeDomains: homeDomains type is " + typeof homeDomains + " but should be a string or an array");
        }
        if (!matchedHomeDomain) {
            throw new errors_1.InvalidSep10ChallengeError("Invalid homeDomains: the transaction's operation key name does not match the expected home domain");
        }
        for (var _i = 0, subsequentOperations_1 = subsequentOperations; _i < subsequentOperations_1.length; _i++) {
            var op = subsequentOperations_1[_i];
            if (op.type !== "manageData") {
                throw new errors_1.InvalidSep10ChallengeError("The transaction has operations that are not of type 'manageData'");
            }
            if (op.source !== serverAccountID && op.name !== "client_domain") {
                throw new errors_1.InvalidSep10ChallengeError("The transaction has operations that are unrecognized");
            }
            if (op.name === "web_auth_domain") {
                if (op.value === undefined) {
                    throw new errors_1.InvalidSep10ChallengeError("'web_auth_domain' operation value should not be null");
                }
                if (op.value.compare(Buffer.from(webAuthDomain))) {
                    throw new errors_1.InvalidSep10ChallengeError("'web_auth_domain' operation value does not match " + webAuthDomain);
                }
            }
        }
        if (!verifyTxSignedBy(transaction, serverAccountID)) {
            throw new errors_1.InvalidSep10ChallengeError("Transaction not signed by server: '" + serverAccountID + "'");
        }
        return { tx: transaction, clientAccountID: clientAccountID, matchedHomeDomain: matchedHomeDomain, memo: memo };
    }
    Utils.readChallengeTx = readChallengeTx;
    function verifyChallengeTxThreshold(challengeTx, serverAccountID, networkPassphrase, threshold, signerSummary, homeDomains, webAuthDomain) {
        var _a;
        var signers = signerSummary.map(function (signer) { return signer.key; });
        var signersFound = verifyChallengeTxSigners(challengeTx, serverAccountID, networkPassphrase, signers, homeDomains, webAuthDomain);
        var weight = 0;
        var _loop_1 = function (signer) {
            var sigWeight = ((_a = signerSummary.find(function (s) { return s.key === signer; })) === null || _a === void 0 ? void 0 : _a.weight) || 0;
            weight += sigWeight;
        };
        for (var _i = 0, signersFound_1 = signersFound; _i < signersFound_1.length; _i++) {
            var signer = signersFound_1[_i];
            _loop_1(signer);
        }
        if (weight < threshold) {
            throw new errors_1.InvalidSep10ChallengeError("signers with weight " + weight + " do not meet threshold " + threshold + "\"");
        }
        return signersFound;
    }
    Utils.verifyChallengeTxThreshold = verifyChallengeTxThreshold;
    function verifyChallengeTxSigners(challengeTx, serverAccountID, networkPassphrase, signers, homeDomains, webAuthDomain) {
        var tx = readChallengeTx(challengeTx, serverAccountID, networkPassphrase, homeDomains, webAuthDomain).tx;
        var serverKP;
        try {
            serverKP = stellar_base_1.Keypair.fromPublicKey(serverAccountID);
        }
        catch (err) {
            throw new Error("Couldn't infer keypair from the provided 'serverAccountID': " +
                err.message);
        }
        var clientSigners = new Set();
        for (var _i = 0, signers_1 = signers; _i < signers_1.length; _i++) {
            var signer = signers_1[_i];
            if (signer === serverKP.publicKey()) {
                continue;
            }
            if (signer.charAt(0) !== "G") {
                continue;
            }
            clientSigners.add(signer);
        }
        if (clientSigners.size === 0) {
            throw new errors_1.InvalidSep10ChallengeError("No verifiable client signers provided, at least one G... address must be provided");
        }
        var clientSigningKey;
        for (var _a = 0, _b = tx.operations; _a < _b.length; _a++) {
            var op = _b[_a];
            if (op.type === "manageData" && op.name === "client_domain") {
                if (clientSigningKey) {
                    throw new errors_1.InvalidSep10ChallengeError("Found more than one client_domain operation");
                }
                clientSigningKey = op.source;
            }
        }
        var allSigners = tslib_1.__spreadArrays([
            serverKP.publicKey()
        ], Array.from(clientSigners));
        if (clientSigningKey) {
            allSigners.push(clientSigningKey);
        }
        var signersFound = gatherTxSigners(tx, allSigners);
        var serverSignatureFound = false;
        var clientSigningKeySignatureFound = false;
        for (var _c = 0, signersFound_2 = signersFound; _c < signersFound_2.length; _c++) {
            var signer = signersFound_2[_c];
            if (signer === serverKP.publicKey()) {
                serverSignatureFound = true;
            }
            if (signer === clientSigningKey) {
                clientSigningKeySignatureFound = true;
            }
        }
        if (!serverSignatureFound) {
            throw new errors_1.InvalidSep10ChallengeError("Transaction not signed by server: '" + serverKP.publicKey() + "'");
        }
        if (clientSigningKey && !clientSigningKeySignatureFound) {
            throw new errors_1.InvalidSep10ChallengeError("Transaction not signed by the source account of the 'client_domain' " +
                "ManageData operation");
        }
        if (signersFound.length === 1) {
            throw new errors_1.InvalidSep10ChallengeError("None of the given signers match the transaction signatures");
        }
        if (signersFound.length !== tx.signatures.length) {
            throw new errors_1.InvalidSep10ChallengeError("Transaction has unrecognized signatures");
        }
        signersFound.splice(signersFound.indexOf(serverKP.publicKey()), 1);
        if (clientSigningKey) {
            signersFound.splice(signersFound.indexOf(clientSigningKey), 1);
        }
        return signersFound;
    }
    Utils.verifyChallengeTxSigners = verifyChallengeTxSigners;
    function verifyTxSignedBy(transaction, accountID) {
        return gatherTxSigners(transaction, [accountID]).length !== 0;
    }
    Utils.verifyTxSignedBy = verifyTxSignedBy;
    function gatherTxSigners(transaction, signers) {
        var hashedSignatureBase = transaction.hash();
        var txSignatures = clone_1.default(transaction.signatures);
        var signersFound = new Set();
        for (var _i = 0, signers_2 = signers; _i < signers_2.length; _i++) {
            var signer = signers_2[_i];
            if (txSignatures.length === 0) {
                break;
            }
            var keypair = void 0;
            try {
                keypair = stellar_base_1.Keypair.fromPublicKey(signer);
            }
            catch (err) {
                throw new errors_1.InvalidSep10ChallengeError("Signer is not a valid address: " + err.message);
            }
            for (var i = 0; i < txSignatures.length; i++) {
                var decSig = txSignatures[i];
                if (!decSig.hint().equals(keypair.signatureHint())) {
                    continue;
                }
                if (keypair.verify(hashedSignatureBase, decSig.signature())) {
                    signersFound.add(signer);
                    txSignatures.splice(i, 1);
                    break;
                }
            }
        }
        return Array.from(signersFound);
    }
    Utils.gatherTxSigners = gatherTxSigners;
    function validateTimebounds(transaction, gracePeriod) {
        if (gracePeriod === void 0) { gracePeriod = 0; }
        if (!transaction.timeBounds) {
            return false;
        }
        var now = Math.floor(Date.now() / 1000);
        var _a = transaction.timeBounds, minTime = _a.minTime, maxTime = _a.maxTime;
        return (now >= Number.parseInt(minTime, 10) - gracePeriod &&
            now <= Number.parseInt(maxTime, 10) + gracePeriod);
    }
})(Utils = exports.Utils || (exports.Utils = {}));
//# sourceMappingURL=utils.js.map