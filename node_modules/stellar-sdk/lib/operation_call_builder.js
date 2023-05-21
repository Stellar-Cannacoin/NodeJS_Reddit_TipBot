"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationCallBuilder = void 0;
var tslib_1 = require("tslib");
var call_builder_1 = require("./call_builder");
var OperationCallBuilder = (function (_super) {
    tslib_1.__extends(OperationCallBuilder, _super);
    function OperationCallBuilder(serverUrl) {
        var _this = _super.call(this, serverUrl, "operations") || this;
        _this.url.segment("operations");
        return _this;
    }
    OperationCallBuilder.prototype.operation = function (operationId) {
        var builder = new call_builder_1.CallBuilder(this.url.clone());
        builder.filter.push([operationId]);
        return builder;
    };
    OperationCallBuilder.prototype.forAccount = function (accountId) {
        return this.forEndpoint("accounts", accountId);
    };
    OperationCallBuilder.prototype.forClaimableBalance = function (claimableBalanceId) {
        return this.forEndpoint("claimable_balances", claimableBalanceId);
    };
    OperationCallBuilder.prototype.forLedger = function (sequence) {
        return this.forEndpoint("ledgers", sequence.toString());
    };
    OperationCallBuilder.prototype.forTransaction = function (transactionId) {
        return this.forEndpoint("transactions", transactionId);
    };
    OperationCallBuilder.prototype.forLiquidityPool = function (poolId) {
        return this.forEndpoint("liquidity_pools", poolId);
    };
    OperationCallBuilder.prototype.includeFailed = function (value) {
        this.url.setQuery("include_failed", value.toString());
        return this;
    };
    return OperationCallBuilder;
}(call_builder_1.CallBuilder));
exports.OperationCallBuilder = OperationCallBuilder;
//# sourceMappingURL=operation_call_builder.js.map