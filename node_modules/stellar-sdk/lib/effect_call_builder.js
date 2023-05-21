"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectCallBuilder = void 0;
var tslib_1 = require("tslib");
var call_builder_1 = require("./call_builder");
var EffectCallBuilder = (function (_super) {
    tslib_1.__extends(EffectCallBuilder, _super);
    function EffectCallBuilder(serverUrl) {
        var _this = _super.call(this, serverUrl, "effects") || this;
        _this.url.segment("effects");
        return _this;
    }
    EffectCallBuilder.prototype.forAccount = function (accountId) {
        return this.forEndpoint("accounts", accountId);
    };
    EffectCallBuilder.prototype.forLedger = function (sequence) {
        return this.forEndpoint("ledgers", sequence.toString());
    };
    EffectCallBuilder.prototype.forTransaction = function (transactionId) {
        return this.forEndpoint("transactions", transactionId);
    };
    EffectCallBuilder.prototype.forOperation = function (operationId) {
        return this.forEndpoint("operations", operationId);
    };
    EffectCallBuilder.prototype.forLiquidityPool = function (poolId) {
        return this.forEndpoint("liquidity_pools", poolId);
    };
    return EffectCallBuilder;
}(call_builder_1.CallBuilder));
exports.EffectCallBuilder = EffectCallBuilder;
//# sourceMappingURL=effect_call_builder.js.map