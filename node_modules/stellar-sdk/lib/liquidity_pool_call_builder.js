"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityPoolCallBuilder = void 0;
var tslib_1 = require("tslib");
var call_builder_1 = require("./call_builder");
var LiquidityPoolCallBuilder = (function (_super) {
    tslib_1.__extends(LiquidityPoolCallBuilder, _super);
    function LiquidityPoolCallBuilder(serverUrl) {
        var _this = _super.call(this, serverUrl) || this;
        _this.url.segment("liquidity_pools");
        return _this;
    }
    LiquidityPoolCallBuilder.prototype.forAssets = function () {
        var assets = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            assets[_i] = arguments[_i];
        }
        var assetList = assets
            .map(function (asset) { return asset.toString(); })
            .join(",");
        this.url.setQuery("reserves", assetList);
        return this;
    };
    LiquidityPoolCallBuilder.prototype.forAccount = function (id) {
        this.url.setQuery("account", id);
        return this;
    };
    LiquidityPoolCallBuilder.prototype.liquidityPoolId = function (id) {
        if (!id.match(/[a-fA-F0-9]{64}/)) {
            throw new TypeError(id + " does not look like a liquidity pool ID");
        }
        var builder = new call_builder_1.CallBuilder(this.url.clone());
        builder.filter.push([id.toLowerCase()]);
        return builder;
    };
    return LiquidityPoolCallBuilder;
}(call_builder_1.CallBuilder));
exports.LiquidityPoolCallBuilder = LiquidityPoolCallBuilder;
//# sourceMappingURL=liquidity_pool_call_builder.js.map