"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCallBuilder = void 0;
var tslib_1 = require("tslib");
var call_builder_1 = require("./call_builder");
var TransactionCallBuilder = (function (_super) {
    tslib_1.__extends(TransactionCallBuilder, _super);
    function TransactionCallBuilder(serverUrl) {
        var _this = _super.call(this, serverUrl, "transactions") || this;
        _this.url.segment("transactions");
        return _this;
    }
    TransactionCallBuilder.prototype.transaction = function (transactionId) {
        var builder = new call_builder_1.CallBuilder(this.url.clone());
        builder.filter.push([transactionId]);
        return builder;
    };
    TransactionCallBuilder.prototype.forAccount = function (accountId) {
        return this.forEndpoint("accounts", accountId);
    };
    TransactionCallBuilder.prototype.forClaimableBalance = function (claimableBalanceId) {
        return this.forEndpoint("claimable_balances", claimableBalanceId);
    };
    TransactionCallBuilder.prototype.forLedger = function (sequence) {
        return this.forEndpoint("ledgers", sequence.toString());
    };
    TransactionCallBuilder.prototype.forLiquidityPool = function (poolId) {
        return this.forEndpoint("liquidity_pools", poolId);
    };
    TransactionCallBuilder.prototype.includeFailed = function (value) {
        this.url.setQuery("include_failed", value.toString());
        return this;
    };
    return TransactionCallBuilder;
}(call_builder_1.CallBuilder));
exports.TransactionCallBuilder = TransactionCallBuilder;
//# sourceMappingURL=transaction_call_builder.js.map