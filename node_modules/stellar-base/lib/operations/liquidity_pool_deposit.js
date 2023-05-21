'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.liquidityPoolDeposit = liquidityPoolDeposit;

var _isUndefined = require('lodash/isUndefined');

var _isUndefined2 = _interopRequireDefault(_isUndefined);

var _xdr = require('../xdr');

var _xdr2 = _interopRequireDefault(_xdr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a liquidity pool deposit operation.
 *
 * @function
 * @alias Operation.liquidityPoolDeposit
 * @see https://developers.stellar.org/docs/start/list-of-operations/#liquidity-pool-deposit
 *
 * @param {object} opts - Options object
 * @param {string} opts.liquidityPoolId - The liquidity pool ID.
 * @param {string} opts.maxAmountA - Maximum amount of first asset to deposit.
 * @param {string} opts.maxAmountB - Maximum amount of second asset to deposit.
 * @param {number|string|BigNumber|Object} opts.minPrice -  Minimum depositA/depositB price.
 * @param {number} opts.minPrice.n - If `opts.minPrice` is an object: the price numerator
 * @param {number} opts.minPrice.d - If `opts.minPrice` is an object: the price denominator
 * @param {number|string|BigNumber|Object} opts.maxPrice -  Maximum depositA/depositB price.
 * @param {number} opts.maxPrice.n - If `opts.maxPrice` is an object: the price numerator
 * @param {number} opts.maxPrice.d - If `opts.maxPrice` is an object: the price denominator
 * @param {string} [opts.source] - The source account for the operation. Defaults to the transaction's source account.
 *
 * @returns {xdr.Operation} The resulting operation (xdr.LiquidityPoolDepositOp).
 */
function liquidityPoolDeposit() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var liquidityPoolId = opts.liquidityPoolId,
      maxAmountA = opts.maxAmountA,
      maxAmountB = opts.maxAmountB,
      minPrice = opts.minPrice,
      maxPrice = opts.maxPrice;

  var attributes = {};

  if (!liquidityPoolId) {
    throw new TypeError('liquidityPoolId argument is required');
  }
  attributes.liquidityPoolId = _xdr2.default.PoolId.fromXDR(liquidityPoolId, 'hex');

  if (!this.isValidAmount(maxAmountA, true)) {
    throw new TypeError('maxAmountA argument is required');
  }
  attributes.maxAmountA = this._toXDRAmount(maxAmountA);

  if (!this.isValidAmount(maxAmountB, true)) {
    throw new TypeError('maxAmountB argument is required');
  }
  attributes.maxAmountB = this._toXDRAmount(maxAmountB);

  if ((0, _isUndefined2.default)(minPrice)) {
    throw new TypeError('minPrice argument is required');
  }
  attributes.minPrice = this._toXDRPrice(minPrice);

  if ((0, _isUndefined2.default)(maxPrice)) {
    throw new TypeError('maxPrice argument is required');
  }
  attributes.maxPrice = this._toXDRPrice(maxPrice);

  var liquidityPoolDepositOp = new _xdr2.default.LiquidityPoolDepositOp(attributes);
  var opAttributes = {
    body: _xdr2.default.OperationBody.liquidityPoolDeposit(liquidityPoolDepositOp)
  };
  this.setSourceAccount(opAttributes, opts);

  return new _xdr2.default.Operation(opAttributes);
}