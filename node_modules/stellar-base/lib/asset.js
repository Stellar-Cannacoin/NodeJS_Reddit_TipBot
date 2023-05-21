'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Asset = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _padEnd = require('lodash/padEnd');

var _padEnd2 = _interopRequireDefault(_padEnd);

var _trimEnd = require('lodash/trimEnd');

var _trimEnd2 = _interopRequireDefault(_trimEnd);

var _xdr = require('./xdr');

var _xdr2 = _interopRequireDefault(_xdr);

var _keypair = require('./keypair');

var _strkey = require('./strkey');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Asset class represents an asset, either the native asset (`XLM`)
 * or an asset code / issuer account ID pair.
 *
 * An asset code describes an asset code and issuer pair. In the case of the native
 * asset XLM, the issuer will be null.
 *
 * @constructor
 * @param {string} code - The asset code.
 * @param {string} issuer - The account ID of the issuer.
 */
var Asset = exports.Asset = function () {
  function Asset(code, issuer) {
    _classCallCheck(this, Asset);

    if (!/^[a-zA-Z0-9]{1,12}$/.test(code)) {
      throw new Error('Asset code is invalid (maximum alphanumeric, 12 characters at max)');
    }
    if (String(code).toLowerCase() !== 'xlm' && !issuer) {
      throw new Error('Issuer cannot be null');
    }
    if (issuer && !_strkey.StrKey.isValidEd25519PublicKey(issuer)) {
      throw new Error('Issuer is invalid');
    }

    if (String(code).toLowerCase() === 'xlm') {
      // transform all xLM, Xlm, etc. variants -> XLM
      this.code = 'XLM';
    } else {
      this.code = code;
    }

    this.issuer = issuer;
  }

  /**
   * Returns an asset object for the native asset.
   * @Return {Asset}
   */


  _createClass(Asset, [{
    key: 'toXDRObject',


    /**
     * Returns the xdr.Asset object for this asset.
     * @returns {xdr.Asset} XDR asset object
     */
    value: function toXDRObject() {
      return this._toXDRObject(_xdr2.default.Asset);
    }

    /**
     * Returns the xdr.ChangeTrustAsset object for this asset.
     * @returns {xdr.ChangeTrustAsset} XDR asset object
     */

  }, {
    key: 'toChangeTrustXDRObject',
    value: function toChangeTrustXDRObject() {
      return this._toXDRObject(_xdr2.default.ChangeTrustAsset);
    }

    /**
     * Returns the xdr.TrustLineAsset object for this asset.
     * @returns {xdr.TrustLineAsset} XDR asset object
     */

  }, {
    key: 'toTrustLineXDRObject',
    value: function toTrustLineXDRObject() {
      return this._toXDRObject(_xdr2.default.TrustLineAsset);
    }

    /**
     * Returns the xdr object for this asset.
     * @param {xdr.Asset | xdr.ChangeTrustAsset} xdrAsset - The asset xdr object.
     * @returns {xdr.Asset | xdr.ChangeTrustAsset | xdr.TrustLineAsset} XDR Asset object
     */

  }, {
    key: '_toXDRObject',
    value: function _toXDRObject() {
      var xdrAsset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _xdr2.default.Asset;

      if (this.isNative()) {
        return xdrAsset.assetTypeNative();
      }

      var xdrType = void 0;
      var xdrTypeString = void 0;
      if (this.code.length <= 4) {
        xdrType = _xdr2.default.AlphaNum4;
        xdrTypeString = 'assetTypeCreditAlphanum4';
      } else {
        xdrType = _xdr2.default.AlphaNum12;
        xdrTypeString = 'assetTypeCreditAlphanum12';
      }

      // pad code with null bytes if necessary
      var padLength = this.code.length <= 4 ? 4 : 12;
      var paddedCode = (0, _padEnd2.default)(this.code, padLength, '\0');

      // eslint-disable-next-line new-cap
      var assetType = new xdrType({
        assetCode: paddedCode,
        issuer: _keypair.Keypair.fromPublicKey(this.issuer).xdrAccountId()
      });

      return new xdrAsset(xdrTypeString, assetType);
    }

    /**
     * @returns {string} Asset code
     */

  }, {
    key: 'getCode',
    value: function getCode() {
      return (0, _clone2.default)(this.code);
    }

    /**
     * @returns {string} Asset issuer
     */

  }, {
    key: 'getIssuer',
    value: function getIssuer() {
      return (0, _clone2.default)(this.issuer);
    }

    /**
     * @see [Assets concept](https://developers.stellar.org/docs/glossary/assets/)
     * @returns {string} Asset type. Can be one of following types:
     *
     *  - `native`,
     *  - `credit_alphanum4`,
     *  - `credit_alphanum12`, or
     *  - `unknown` as the error case (which should never occur)
     */

  }, {
    key: 'getAssetType',
    value: function getAssetType() {
      switch (this.getRawAssetType()) {
        case _xdr2.default.AssetType.assetTypeNative():
          return 'native';
        case _xdr2.default.AssetType.assetTypeCreditAlphanum4():
          return 'credit_alphanum4';
        case _xdr2.default.AssetType.assetTypeCreditAlphanum12():
          return 'credit_alphanum12';
        default:
          return 'unknown';
      }
    }

    /**
     * @returns {xdr.AssetType}  the raw XDR representation of the asset type
     */

  }, {
    key: 'getRawAssetType',
    value: function getRawAssetType() {
      if (this.isNative()) {
        return _xdr2.default.AssetType.assetTypeNative();
      }

      if (this.code.length <= 4) {
        return _xdr2.default.AssetType.assetTypeCreditAlphanum4();
      }

      return _xdr2.default.AssetType.assetTypeCreditAlphanum12();
    }

    /**
     * @returns {boolean}  true if this asset object is the native asset.
     */

  }, {
    key: 'isNative',
    value: function isNative() {
      return !this.issuer;
    }

    /**
     * @param {Asset} asset Asset to compare
     * @returns {boolean} true if this asset equals the given asset.
     */

  }, {
    key: 'equals',
    value: function equals(asset) {
      return this.code === asset.getCode() && this.issuer === asset.getIssuer();
    }
  }, {
    key: 'toString',
    value: function toString() {
      if (this.isNative()) {
        return 'native';
      }

      return this.getCode() + ':' + this.getIssuer();
    }

    /**
     * Compares two assets according to the criteria:
     *
     *  1. First compare the type (native < alphanum4 < alphanum12).
     *  2. If the types are equal, compare the assets codes.
     *  3. If the asset codes are equal, compare the issuers.
     *
     * @param   {Asset} assetA - the first asset
     * @param   {Asset} assetB - the second asset
     * @returns {number} `-1` if assetA < assetB, `0` if assetA == assetB, `1` if assetA > assetB.
     *
     * @static
     * @memberof Asset
     */

  }], [{
    key: 'native',
    value: function native() {
      return new Asset('XLM');
    }

    /**
     * Returns an asset object from its XDR object representation.
     * @param {xdr.Asset} assetXdr - The asset xdr object.
     * @returns {Asset}
     */

  }, {
    key: 'fromOperation',
    value: function fromOperation(assetXdr) {
      var anum = void 0;
      var code = void 0;
      var issuer = void 0;
      switch (assetXdr.switch()) {
        case _xdr2.default.AssetType.assetTypeNative():
          return this.native();
        case _xdr2.default.AssetType.assetTypeCreditAlphanum4():
          anum = assetXdr.alphaNum4();
        /* falls through */
        case _xdr2.default.AssetType.assetTypeCreditAlphanum12():
          anum = anum || assetXdr.alphaNum12();
          issuer = _strkey.StrKey.encodeEd25519PublicKey(anum.issuer().ed25519());
          code = (0, _trimEnd2.default)(anum.assetCode(), '\0');
          return new this(code, issuer);
        default:
          throw new Error('Invalid asset type: ' + assetXdr.switch().name);
      }
    }
  }, {
    key: 'compare',
    value: function compare(assetA, assetB) {
      if (!assetA || !(assetA instanceof Asset)) {
        throw new Error('assetA is invalid');
      }
      if (!assetB || !(assetB instanceof Asset)) {
        throw new Error('assetB is invalid');
      }

      if (assetA.equals(assetB)) {
        return 0;
      }

      // Compare asset types.
      var xdrAtype = assetA.getRawAssetType().value;
      var xdrBtype = assetB.getRawAssetType().value;
      if (xdrAtype !== xdrBtype) {
        return xdrAtype < xdrBtype ? -1 : 1;
      }

      // Compare asset codes.
      var result = asciiCompare(assetA.getCode(), assetB.getCode());
      if (result !== 0) {
        return result;
      }

      // Compare asset issuers.
      return asciiCompare(assetA.getIssuer(), assetB.getIssuer());
    }
  }]);

  return Asset;
}();

/**
 * Compares two ASCII strings in lexographic order with uppercase precedence.
 *
 * @param   {string} a - the first string to compare
 * @param   {string} b - the second
 * @returns {number} like all `compare()`s:
 *     -1 if `a < b`, 0 if `a == b`, and 1 if `a > b`
 *
 * @warning No type-checks are done on the parameters
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
 */


function asciiCompare(a, b) {
  return a.localeCompare(b, 'en', { caseFirst: 'upper' });
}