'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transaction = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _xdr = require('./xdr');

var _xdr2 = _interopRequireDefault(_xdr);

var _hashing = require('./hashing');

var _strkey = require('./strkey');

var _operation = require('./operation');

var _memo = require('./memo');

var _transaction_base = require('./transaction_base');

var _decode_encode_muxed_account = require('./util/decode_encode_muxed_account');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Use {@link TransactionBuilder} to build a transaction object. If you have an
 * object or base64-encoded string of the transaction envelope XDR, use {@link
 * TransactionBuilder.fromXDR}.
 *
 * Once a Transaction has been created, its attributes and operations should not
 * be changed. You should only add signatures (using {@link Transaction#sign})
 * to a Transaction object before submitting to the network or forwarding on to
 * additional signers.
 *
 * @constructor
 *
 * @param {string|xdr.TransactionEnvelope} envelope - transaction envelope
 *     object or base64 encoded string
 * @param {string}  [networkPassphrase] - passphrase of the target stellar
 *     network (e.g. "Public Global Stellar Network ; September 2015")
 *
 * @extends TransactionBase
 */
var Transaction = exports.Transaction = function (_TransactionBase) {
  _inherits(Transaction, _TransactionBase);

  function Transaction(envelope, networkPassphrase) {
    _classCallCheck(this, Transaction);

    if (typeof envelope === 'string') {
      var buffer = Buffer.from(envelope, 'base64');
      envelope = _xdr2.default.TransactionEnvelope.fromXDR(buffer);
    }

    var envelopeType = envelope.switch();
    if (!(envelopeType === _xdr2.default.EnvelopeType.envelopeTypeTxV0() || envelopeType === _xdr2.default.EnvelopeType.envelopeTypeTx())) {
      throw new Error('Invalid TransactionEnvelope: expected an envelopeTypeTxV0 or envelopeTypeTx but received an ' + envelopeType.name + '.');
    }

    var txEnvelope = envelope.value();
    var tx = txEnvelope.tx();
    var fee = tx.fee().toString();
    var signatures = (txEnvelope.signatures() || []).slice();

    var _this = _possibleConstructorReturn(this, (Transaction.__proto__ || Object.getPrototypeOf(Transaction)).call(this, tx, signatures, fee, networkPassphrase));

    _this._envelopeType = envelopeType;
    _this._memo = tx.memo();
    _this._sequence = tx.seqNum().toString();

    switch (_this._envelopeType) {
      case _xdr2.default.EnvelopeType.envelopeTypeTxV0():
        _this._source = _strkey.StrKey.encodeEd25519PublicKey(_this.tx.sourceAccountEd25519());
        break;
      default:
        _this._source = (0, _decode_encode_muxed_account.encodeMuxedAccountToAddress)(_this.tx.sourceAccount());
        break;
    }

    var cond = null;
    var timeBounds = null;
    switch (_this._envelopeType) {
      case _xdr2.default.EnvelopeType.envelopeTypeTxV0():
        timeBounds = tx.timeBounds();
        break;

      case _xdr2.default.EnvelopeType.envelopeTypeTx():
        switch (tx.cond().switch()) {
          case _xdr2.default.PreconditionType.precondTime():
            timeBounds = tx.cond().timeBounds();
            break;

          case _xdr2.default.PreconditionType.precondV2():
            cond = tx.cond().v2();
            timeBounds = cond.timeBounds();
            break;

          default:
            break;
        }
        break;

      default:
        break;
    }

    if (timeBounds) {
      _this._timeBounds = {
        minTime: timeBounds.minTime().toString(),
        maxTime: timeBounds.maxTime().toString()
      };
    }

    if (cond) {
      var ledgerBounds = cond.ledgerBounds();
      if (ledgerBounds) {
        _this._ledgerBounds = {
          minLedger: ledgerBounds.minLedger(),
          maxLedger: ledgerBounds.maxLedger()
        };
      }

      var minSeq = cond.minSeqNum();
      if (minSeq) {
        _this._minAccountSequence = minSeq.toString();
      }

      _this._minAccountSequenceAge = cond.minSeqAge();
      _this._minAccountSequenceLedgerGap = cond.minSeqLedgerGap();
      _this._extraSigners = cond.extraSigners();
    }

    var operations = tx.operations() || [];
    _this._operations = (0, _map2.default)(operations, function (op) {
      return _operation.Operation.fromXDRObject(op);
    });
    return _this;
  }

  /**
   * @type {object}
   * @property {string} 64 bit unix timestamp
   * @property {string} 64 bit unix timestamp
   * @readonly
   */


  _createClass(Transaction, [{
    key: 'signatureBase',


    /**
     * Returns the "signature base" of this transaction, which is the value
     * that, when hashed, should be signed to create a signature that
     * validators on the Stellar Network will accept.
     *
     * It is composed of a 4 prefix bytes followed by the xdr-encoded form
     * of this transaction.
     * @returns {Buffer}
     */
    value: function signatureBase() {
      var tx = this.tx;

      // Backwards Compatibility: Use ENVELOPE_TYPE_TX to sign ENVELOPE_TYPE_TX_V0
      // we need a Transaction to generate the signature base
      if (this._envelopeType === _xdr2.default.EnvelopeType.envelopeTypeTxV0()) {
        tx = _xdr2.default.Transaction.fromXDR(Buffer.concat([
        // TransactionV0 is a transaction with the AccountID discriminant
        // stripped off, we need to put it back to build a valid transaction
        // which we can use to build a TransactionSignaturePayloadTaggedTransaction
        _xdr2.default.PublicKeyType.publicKeyTypeEd25519().toXDR(), tx.toXDR()]));
      }

      var taggedTransaction = new _xdr2.default.TransactionSignaturePayloadTaggedTransaction.envelopeTypeTx(tx);

      var txSignature = new _xdr2.default.TransactionSignaturePayload({
        networkId: _xdr2.default.Hash.fromXDR((0, _hashing.hash)(this.networkPassphrase)),
        taggedTransaction: taggedTransaction
      });

      return txSignature.toXDR();
    }

    /**
     * To envelope returns a xdr.TransactionEnvelope which can be submitted to the network.
     * @returns {xdr.TransactionEnvelope}
     */

  }, {
    key: 'toEnvelope',
    value: function toEnvelope() {
      var rawTx = this.tx.toXDR();
      var signatures = this.signatures.slice(); // make a copy of the signatures

      var envelope = void 0;
      switch (this._envelopeType) {
        case _xdr2.default.EnvelopeType.envelopeTypeTxV0():
          envelope = new _xdr2.default.TransactionEnvelope.envelopeTypeTxV0(new _xdr2.default.TransactionV0Envelope({
            tx: _xdr2.default.TransactionV0.fromXDR(rawTx), // make a copy of tx
            signatures: signatures
          }));
          break;
        case _xdr2.default.EnvelopeType.envelopeTypeTx():
          envelope = new _xdr2.default.TransactionEnvelope.envelopeTypeTx(new _xdr2.default.TransactionV1Envelope({
            tx: _xdr2.default.Transaction.fromXDR(rawTx), // make a copy of tx
            signatures: signatures
          }));
          break;
        default:
          throw new Error('Invalid TransactionEnvelope: expected an envelopeTypeTxV0 or envelopeTypeTx but received an ' + this._envelopeType.name + '.');
      }

      return envelope;
    }

    /**
     * Calculate the claimable balance ID for an operation within the transaction.
     *
     * @param   {integer}  opIndex   the index of the CreateClaimableBalance op
     * @returns {string}   a hex string representing the claimable balance ID
     *
     * @throws {RangeError}   for invalid `opIndex` value
     * @throws {TypeError}    if op at `opIndex` is not `CreateClaimableBalance`
     * @throws for general XDR un/marshalling failures
     *
     * @see https://github.com/stellar/go/blob/d712346e61e288d450b0c08038c158f8848cc3e4/txnbuild/transaction.go#L392-L435
     *
     */

  }, {
    key: 'getClaimableBalanceId',
    value: function getClaimableBalanceId(opIndex) {
      // Validate and then extract the operation from the transaction.
      if (!Number.isInteger(opIndex) || opIndex < 0 || opIndex >= this.operations.length) {
        throw new RangeError('invalid operation index');
      }

      var op = this.operations[opIndex];
      try {
        op = _operation.Operation.createClaimableBalance(op);
      } catch (err) {
        throw new TypeError('expected createClaimableBalance, got ' + op.type + ': ' + err);
      }

      // Always use the transaction's *unmuxed* source.
      var account = _strkey.StrKey.decodeEd25519PublicKey((0, _decode_encode_muxed_account.extractBaseAddress)(this.source));
      var operationId = _xdr2.default.HashIdPreimage.envelopeTypeOpId(new _xdr2.default.HashIdPreimageOperationId({
        sourceAccount: _xdr2.default.AccountId.publicKeyTypeEd25519(account),
        seqNum: _xdr2.default.SequenceNumber.fromString(this.sequence),
        opNum: opIndex
      }));

      var opIdHash = (0, _hashing.hash)(operationId.toXDR('raw'));
      var balanceId = _xdr2.default.ClaimableBalanceId.claimableBalanceIdTypeV0(opIdHash);
      return balanceId.toXDR('hex');
    }
  }, {
    key: 'timeBounds',
    get: function get() {
      return this._timeBounds;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {object}
     * @property {number} minLedger - smallest ledger bound (uint32)
     * @property {number} maxLedger - largest ledger bound (or 0 for inf)
     * @readonly
     */

  }, {
    key: 'ledgerBounds',
    get: function get() {
      return this._ledgerBounds;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {string} 64 bit account sequence
     * @readonly
     */

  }, {
    key: 'minAccountSequence',
    get: function get() {
      return this._minAccountSequence;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {number} 64 bit number of seconds
     * @readonly
     */

  }, {
    key: 'minAccountSequenceAge',
    get: function get() {
      return this._minAccountSequenceAge;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {number} 32 bit number of ledgers
     * @readonly
     */

  }, {
    key: 'minAccountSequenceLedgerGap',
    get: function get() {
      return this._minAccountSequenceLedgerGap;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {string[]}   array of extra signers (@{link StrKey}s)
     * @readonly
     */

  }, {
    key: 'extraSigners',
    get: function get() {
      return this._extraSigners;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {string}
     * @readonly
     */

  }, {
    key: 'sequence',
    get: function get() {
      return this._sequence;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {string}
     * @readonly
     */

  }, {
    key: 'source',
    get: function get() {
      return this._source;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {Array.<xdr.Operation>}
     * @readonly
     */

  }, {
    key: 'operations',
    get: function get() {
      return this._operations;
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }

    /**
     * @type {string}
     * @readonly
     */

  }, {
    key: 'memo',
    get: function get() {
      return _memo.Memo.fromXDRObject(this._memo);
    },
    set: function set(value) {
      throw new Error('Transaction is immutable');
    }
  }]);

  return Transaction;
}(_transaction_base.TransactionBase);