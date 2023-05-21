'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SignerKey = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _xdr = require('./xdr');

var _xdr2 = _interopRequireDefault(_xdr);

var _strkey = require('./strkey');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A container class with helpers to convert between signer keys
 * (`xdr.SignerKey`) and {@link StrKey}s.
 *
 * It's primarly used for manipulating the `extraSigners` precondition on a
 * {@link Transaction}.
 *
 * @see {@link TransactionBuilder.setExtraSigners}
 */
var SignerKey = exports.SignerKey = function () {
  function SignerKey() {
    _classCallCheck(this, SignerKey);
  }

  _createClass(SignerKey, null, [{
    key: 'decodeAddress',

    /**
     * Decodes a StrKey address into an xdr.SignerKey instance.
     *
     * Only ED25519 public keys (G...), pre-auth transactions (T...), hashes
     * (H...), and signed payloads (P...) can be signer keys.
     *
     * @param   {string} address  a StrKey-encoded signer address
     * @returns {xdr.SignerKey}
     */
    value: function decodeAddress(address) {
      var signerKeyMap = {
        ed25519PublicKey: _xdr2.default.SignerKey.signerKeyTypeEd25519,
        preAuthTx: _xdr2.default.SignerKey.signerKeyTypePreAuthTx,
        sha256Hash: _xdr2.default.SignerKey.signerKeyTypeHashX,
        signedPayload: _xdr2.default.SignerKey.signerKeyTypeEd25519SignedPayload
      };

      var vb = _strkey.StrKey.getVersionByteForPrefix(address);
      var encoder = signerKeyMap[vb];
      if (!encoder) {
        throw new Error('invalid signer key type (' + vb + ')');
      }

      var raw = (0, _strkey.decodeCheck)(vb, address);
      switch (vb) {
        case 'signedPayload':
          return encoder(new _xdr2.default.SignerKeyEd25519SignedPayload({
            ed25519: raw.slice(0, 32),
            payload: raw.slice(32 + 4)
          }));

        case 'ed25519PublicKey': // falls through
        case 'preAuthTx': // falls through
        case 'sha256Hash': // falls through
        default:
          return encoder(raw);
      }
    }

    /**
     * Encodes a signer key into its StrKey equivalent.
     *
     * @param   {xdr.SignerKey} signerKey   the signer
     * @returns {string} the StrKey representation of the signer
     */

  }, {
    key: 'encodeSignerKey',
    value: function encodeSignerKey(signerKey) {
      var strkeyType = void 0;
      var raw = void 0;

      switch (signerKey.switch()) {
        case _xdr2.default.SignerKeyType.signerKeyTypeEd25519():
          strkeyType = 'ed25519PublicKey';
          raw = signerKey.value();
          break;

        case _xdr2.default.SignerKeyType.signerKeyTypePreAuthTx():
          strkeyType = 'preAuthTx';
          raw = signerKey.value();
          break;

        case _xdr2.default.SignerKeyType.signerKeyTypeHashX():
          strkeyType = 'sha256Hash';
          raw = signerKey.value();
          break;

        case _xdr2.default.SignerKeyType.signerKeyTypeEd25519SignedPayload():
          strkeyType = 'signedPayload';
          raw = signerKey.ed25519SignedPayload().toXDR('raw');
          break;

        default:
          throw new Error('invalid SignerKey (type: ' + signerKey.switch() + ')');
      }

      return (0, _strkey.encodeCheck)(strkeyType, raw);
    }
  }]);

  return SignerKey;
}();