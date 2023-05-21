'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LiquidityPoolId = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _xdr = require('./xdr');

var _xdr2 = _interopRequireDefault(_xdr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * LiquidityPoolId class represents the asset referenced by a trustline to a
 * liquidity pool.
 *
 * @constructor
 * @param {string} liquidityPoolId - The ID of the liquidity pool in string 'hex'.
 */
var LiquidityPoolId = exports.LiquidityPoolId = function () {
  function LiquidityPoolId(liquidityPoolId) {
    _classCallCheck(this, LiquidityPoolId);

    if (!liquidityPoolId) {
      throw new Error('liquidityPoolId cannot be empty');
    }
    if (!/^[a-f0-9]{64}$/.test(liquidityPoolId)) {
      throw new Error('Liquidity pool ID is not a valid hash');
    }

    this.liquidityPoolId = liquidityPoolId;
  }

  /**
   * Returns a liquidity pool ID object from its xdr.TrustLineAsset representation.
   * @param {xdr.TrustLineAsset} tlAssetXdr - The asset XDR object.
   * @returns {LiquidityPoolId}
   */


  _createClass(LiquidityPoolId, [{
    key: 'toXDRObject',


    /**
     * Returns the `xdr.TrustLineAsset` object for this liquidity pool ID.
     *
     * Note: To convert from {@link Asset `Asset`} to `xdr.TrustLineAsset` please
     * refer to the
     * {@link Asset.toTrustLineXDRObject `Asset.toTrustLineXDRObject`} method.
     *
     * @returns {xdr.TrustLineAsset} XDR LiquidityPoolId object
     */
    value: function toXDRObject() {
      var xdrPoolId = _xdr2.default.PoolId.fromXDR(this.liquidityPoolId, 'hex');
      return new _xdr2.default.TrustLineAsset('assetTypePoolShare', xdrPoolId);
    }

    /**
     * @returns {string} Liquidity pool ID.
     */

  }, {
    key: 'getLiquidityPoolId',
    value: function getLiquidityPoolId() {
      return (0, _clone2.default)(this.liquidityPoolId);
    }

    /**
     * @see [Assets concept](https://developers.stellar.org/docs/glossary/assets/)
     * @returns {AssetType.liquidityPoolShares} asset type. Can only be `liquidity_pool_shares`.
     */

  }, {
    key: 'getAssetType',
    value: function getAssetType() {
      return 'liquidity_pool_shares';
    }

    /**
     * @param {LiquidityPoolId} asset LiquidityPoolId to compare.
     * @returns {boolean} `true` if this asset equals the given asset.
     */

  }, {
    key: 'equals',
    value: function equals(asset) {
      return this.liquidityPoolId === asset.getLiquidityPoolId();
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'liquidity_pool:' + this.liquidityPoolId;
    }
  }], [{
    key: 'fromOperation',
    value: function fromOperation(tlAssetXdr) {
      var assetType = tlAssetXdr.switch();
      if (assetType === _xdr2.default.AssetType.assetTypePoolShare()) {
        var liquidityPoolId = tlAssetXdr.liquidityPoolId().toString('hex');
        return new this(liquidityPoolId);
      }

      throw new Error('Invalid asset type: ' + assetType.name);
    }
  }]);

  return LiquidityPoolId;
}();