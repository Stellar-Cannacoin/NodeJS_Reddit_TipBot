'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StrKey = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint no-bitwise: ["error", {"allow": ["<<"]}] */

exports.decodeCheck = decodeCheck;
exports.encodeCheck = encodeCheck;

var _base = require('base32.js');

var _base2 = _interopRequireDefault(_base);

var _crc = require('crc');

var _crc2 = _interopRequireDefault(_crc);

var _isUndefined = require('lodash/isUndefined');

var _isUndefined2 = _interopRequireDefault(_isUndefined);

var _isNull = require('lodash/isNull');

var _isNull2 = _interopRequireDefault(_isNull);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _checksum = require('./util/checksum');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var versionBytes = {
  ed25519PublicKey: 6 << 3, // G (when encoded in base32)
  ed25519SecretSeed: 18 << 3, // S
  med25519PublicKey: 12 << 3, // M
  preAuthTx: 19 << 3, // T
  sha256Hash: 23 << 3, // X
  signedPayload: 15 << 3 // P
};

var strkeyTypes = {
  G: 'ed25519PublicKey',
  S: 'ed25519SecretSeed',
  M: 'med25519PublicKey',
  T: 'preAuthTx',
  X: 'sha256Hash',
  P: 'signedPayload'
};

/**
 * StrKey is a helper class that allows encoding and decoding Stellar keys
 * to/from strings, i.e. between their binary (Buffer, xdr.PublicKey, etc.) and
 * string (i.e. "GABCD...", etc.) representations.
 */

var StrKey = exports.StrKey = function () {
  function StrKey() {
    _classCallCheck(this, StrKey);
  }

  _createClass(StrKey, null, [{
    key: 'encodeEd25519PublicKey',

    /**
     * Encodes `data` to strkey ed25519 public key.
     *
     * @param   {Buffer} data   raw data to encode
     * @returns {string}        "G..." representation of the key
     */
    value: function encodeEd25519PublicKey(data) {
      return encodeCheck('ed25519PublicKey', data);
    }

    /**
     * Decodes strkey ed25519 public key to raw data.
     *
     * If the parameter is a muxed account key ("M..."), this will only encode it
     * as a basic Ed25519 key (as if in "G..." format).
     *
     * @param   {string} data   "G..." (or "M...") key representation to decode
     * @returns {Buffer}        raw key
     */

  }, {
    key: 'decodeEd25519PublicKey',
    value: function decodeEd25519PublicKey(data) {
      return decodeCheck('ed25519PublicKey', data);
    }

    /**
     * Returns true if the given Stellar public key is a valid ed25519 public key.
     * @param {string} publicKey public key to check
     * @returns {boolean}
     */

  }, {
    key: 'isValidEd25519PublicKey',
    value: function isValidEd25519PublicKey(publicKey) {
      return isValid('ed25519PublicKey', publicKey);
    }

    /**
     * Encodes data to strkey ed25519 seed.
     * @param {Buffer} data data to encode
     * @returns {string}
     */

  }, {
    key: 'encodeEd25519SecretSeed',
    value: function encodeEd25519SecretSeed(data) {
      return encodeCheck('ed25519SecretSeed', data);
    }

    /**
     * Decodes strkey ed25519 seed to raw data.
     * @param {string} address data to decode
     * @returns {Buffer}
     */

  }, {
    key: 'decodeEd25519SecretSeed',
    value: function decodeEd25519SecretSeed(address) {
      return decodeCheck('ed25519SecretSeed', address);
    }

    /**
     * Returns true if the given Stellar secret key is a valid ed25519 secret seed.
     * @param {string} seed seed to check
     * @returns {boolean}
     */

  }, {
    key: 'isValidEd25519SecretSeed',
    value: function isValidEd25519SecretSeed(seed) {
      return isValid('ed25519SecretSeed', seed);
    }

    /**
     * Encodes data to strkey med25519 public key.
     * @param {Buffer} data data to encode
     * @returns {string}
     */

  }, {
    key: 'encodeMed25519PublicKey',
    value: function encodeMed25519PublicKey(data) {
      return encodeCheck('med25519PublicKey', data);
    }

    /**
     * Decodes strkey med25519 public key to raw data.
     * @param {string} address data to decode
     * @returns {Buffer}
     */

  }, {
    key: 'decodeMed25519PublicKey',
    value: function decodeMed25519PublicKey(address) {
      return decodeCheck('med25519PublicKey', address);
    }

    /**
     * Returns true if the given Stellar public key is a valid med25519 public key.
     * @param {string} publicKey public key to check
     * @returns {boolean}
     */

  }, {
    key: 'isValidMed25519PublicKey',
    value: function isValidMed25519PublicKey(publicKey) {
      return isValid('med25519PublicKey', publicKey);
    }

    /**
     * Encodes data to strkey preAuthTx.
     * @param {Buffer} data data to encode
     * @returns {string}
     */

  }, {
    key: 'encodePreAuthTx',
    value: function encodePreAuthTx(data) {
      return encodeCheck('preAuthTx', data);
    }

    /**
     * Decodes strkey PreAuthTx to raw data.
     * @param {string} address data to decode
     * @returns {Buffer}
     */

  }, {
    key: 'decodePreAuthTx',
    value: function decodePreAuthTx(address) {
      return decodeCheck('preAuthTx', address);
    }

    /**
     * Encodes data to strkey sha256 hash.
     * @param {Buffer} data data to encode
     * @returns {string}
     */

  }, {
    key: 'encodeSha256Hash',
    value: function encodeSha256Hash(data) {
      return encodeCheck('sha256Hash', data);
    }

    /**
     * Decodes strkey sha256 hash to raw data.
     * @param {string} address data to decode
     * @returns {Buffer}
     */

  }, {
    key: 'decodeSha256Hash',
    value: function decodeSha256Hash(address) {
      return decodeCheck('sha256Hash', address);
    }

    /**
     * Encodes raw data to strkey signed payload (P...).
     * @param   {Buffer} data  data to encode
     * @returns {string}
     */

  }, {
    key: 'encodeSignedPayload',
    value: function encodeSignedPayload(data) {
      return encodeCheck('signedPayload', data);
    }

    /**
     * Decodes strkey signed payload (P...) to raw data.
     * @param   {string} address  address to decode
     * @returns {Buffer}
     */

  }, {
    key: 'decodeSignedPayload',
    value: function decodeSignedPayload(address) {
      return decodeCheck('signedPayload', address);
    }

    /**
     * Checks validity of alleged signed payload (P...) strkey address.
     * @param   {string} address  signer key to check
     * @returns {boolean}
     */

  }, {
    key: 'isValidSignedPayload',
    value: function isValidSignedPayload(address) {
      return isValid('signedPayload', address);
    }
  }, {
    key: 'getVersionByteForPrefix',
    value: function getVersionByteForPrefix(address) {
      return strkeyTypes[address[0]];
    }
  }]);

  return StrKey;
}();

/**
 * Sanity-checks whether or not a strkey *appears* valid.
 *
 * @param  {string}  versionByteName the type of strkey to expect in `encoded`
 * @param  {string}  encoded         the strkey to validate
 *
 * @return {Boolean} whether or not the `encoded` strkey appears valid for the
 *     `versionByteName` strkey type (see `versionBytes`, above).
 *
 * @note This isn't a *definitive* check of validity, but rather a best-effort
 *     check based on (a) input length, (b) whether or not it can be decoded,
 *     and (c) output length.
 */


function isValid(versionByteName, encoded) {
  if (!(0, _isString2.default)(encoded)) {
    return false;
  }

  // basic length checks on the strkey lengths
  switch (versionByteName) {
    case 'ed25519PublicKey': // falls through
    case 'ed25519SecretSeed': // falls through
    case 'preAuthTx': // falls through
    case 'sha256Hash':
      if (encoded.length !== 56) {
        return false;
      }
      break;

    case 'med25519PublicKey':
      if (encoded.length !== 69) {
        return false;
      }
      break;

    case 'signedPayload':
      if (encoded.length < 56 || encoded.length > 165) {
        return false;
      }
      break;

    default:
      return false;
  }

  var decoded = '';
  try {
    decoded = decodeCheck(versionByteName, encoded);
  } catch (err) {
    return false;
  }

  // basic length checks on the resulting buffer sizes
  switch (versionByteName) {
    case 'ed25519PublicKey': // falls through
    case 'ed25519SecretSeed': // falls through
    case 'preAuthTx': // falls through
    case 'sha256Hash':
      return decoded.length === 32;

    case 'med25519PublicKey':
      return decoded.length === 40; // +8 bytes for the ID

    case 'signedPayload':
      return (
        // 32 for the signer, +4 for the payload size, then either +4 for the
        // min or +64 for the max payload
        decoded.length >= 32 + 4 + 4 && decoded.length <= 32 + 4 + 64
      );

    default:
      return false;
  }
}

function decodeCheck(versionByteName, encoded) {
  if (!(0, _isString2.default)(encoded)) {
    throw new TypeError('encoded argument must be of type String');
  }

  var decoded = _base2.default.decode(encoded);
  var versionByte = decoded[0];
  var payload = decoded.slice(0, -2);
  var data = payload.slice(1);
  var checksum = decoded.slice(-2);

  if (encoded !== _base2.default.encode(decoded)) {
    throw new Error('invalid encoded string');
  }

  var expectedVersion = versionBytes[versionByteName];

  if ((0, _isUndefined2.default)(expectedVersion)) {
    throw new Error(versionByteName + ' is not a valid version byte name. ' + ('Expected one of ' + Object.keys(versionBytes).join(', ')));
  }

  if (versionByte !== expectedVersion) {
    throw new Error('invalid version byte. expected ' + expectedVersion + ', got ' + versionByte);
  }

  var expectedChecksum = calculateChecksum(payload);

  if (!(0, _checksum.verifyChecksum)(expectedChecksum, checksum)) {
    throw new Error('invalid checksum');
  }

  return Buffer.from(data);
}

function encodeCheck(versionByteName, data) {
  if ((0, _isNull2.default)(data) || (0, _isUndefined2.default)(data)) {
    throw new Error('cannot encode null data');
  }

  var versionByte = versionBytes[versionByteName];

  if ((0, _isUndefined2.default)(versionByte)) {
    throw new Error(versionByteName + ' is not a valid version byte name. ' + ('Expected one of ' + Object.keys(versionBytes).join(', ')));
  }
  data = Buffer.from(data);

  var versionBuffer = Buffer.from([versionByte]);
  var payload = Buffer.concat([versionBuffer, data]);
  var checksum = calculateChecksum(payload);
  var unencoded = Buffer.concat([payload, checksum]);

  return _base2.default.encode(unencoded);
}

// Computes the CRC16-XModem checksum of `payload` in little-endian order
function calculateChecksum(payload) {
  var checksum = Buffer.alloc(2);
  checksum.writeUInt16LE(_crc2.default.crc16xmodem(payload), 0);
  return checksum;
}