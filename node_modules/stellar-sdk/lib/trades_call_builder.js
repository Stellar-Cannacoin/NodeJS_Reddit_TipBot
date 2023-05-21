"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesCallBuilder = void 0;
var tslib_1 = require("tslib");
var call_builder_1 = require("./call_builder");
var TradesCallBuilder = (function (_super) {
    tslib_1.__extends(TradesCallBuilder, _super);
    function TradesCallBuilder(serverUrl) {
        var _this = _super.call(this, serverUrl, "trades") || this;
        _this.url.segment("trades");
        return _this;
    }
    TradesCallBuilder.prototype.forAssetPair = function (base, counter) {
        if (!base.isNative()) {
            this.url.setQuery("base_asset_type", base.getAssetType());
            this.url.setQuery("base_asset_code", base.getCode());
            this.url.setQuery("base_asset_issuer", base.getIssuer());
        }
        else {
            this.url.setQuery("base_asset_type", "native");
        }
        if (!counter.isNative()) {
            this.url.setQuery("counter_asset_type", counter.getAssetType());
            this.url.setQuery("counter_asset_code", counter.getCode());
            this.url.setQuery("counter_asset_issuer", counter.getIssuer());
        }
        else {
            this.url.setQuery("counter_asset_type", "native");
        }
        return this;
    };
    TradesCallBuilder.prototype.forOffer = function (offerId) {
        this.url.setQuery("offer_id", offerId);
        return this;
    };
    TradesCallBuilder.prototype.forType = function (tradeType) {
        this.url.setQuery("trade_type", tradeType);
        return this;
    };
    TradesCallBuilder.prototype.forAccount = function (accountId) {
        return this.forEndpoint("accounts", accountId);
    };
    TradesCallBuilder.prototype.forLiquidityPool = function (liquidityPoolId) {
        return this.forEndpoint("liquidity_pools", liquidityPoolId);
    };
    return TradesCallBuilder;
}(call_builder_1.CallBuilder));
exports.TradesCallBuilder = TradesCallBuilder;
//# sourceMappingURL=trades_call_builder.js.map