"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentCallBuilder = void 0;
var tslib_1 = require("tslib");
var call_builder_1 = require("./call_builder");
var PaymentCallBuilder = (function (_super) {
    tslib_1.__extends(PaymentCallBuilder, _super);
    function PaymentCallBuilder(serverUrl) {
        var _this = _super.call(this, serverUrl, "payments") || this;
        _this.url.segment("payments");
        return _this;
    }
    PaymentCallBuilder.prototype.forAccount = function (accountId) {
        return this.forEndpoint("accounts", accountId);
    };
    PaymentCallBuilder.prototype.forLedger = function (sequence) {
        return this.forEndpoint("ledgers", sequence.toString());
    };
    PaymentCallBuilder.prototype.forTransaction = function (transactionId) {
        return this.forEndpoint("transactions", transactionId);
    };
    return PaymentCallBuilder;
}(call_builder_1.CallBuilder));
exports.PaymentCallBuilder = PaymentCallBuilder;
//# sourceMappingURL=payment_call_builder.js.map