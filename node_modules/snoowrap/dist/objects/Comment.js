"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helpers = require("../helpers.js");

var _Listing = _interopRequireDefault(require("./Listing.js"));

var _More = require("./More.js");

var _VoteableContent = _interopRequireDefault(require("./VoteableContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a reddit comment
* <style> #Comment {display: none} </style>
* @example
*
* // Get a comment with the given ID
* r.getComment('c0hkuyq')
*
* @extends VoteableContent
*/
var Comment = class Comment extends _VoteableContent.default {
  constructor(options, _r, _hasFetched) {
    super(options, _r, _hasFetched);

    if (_hasFetched) {
      /* If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
      comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
      replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that. */
      if (this.replies instanceof _Listing.default && !this.replies.length && this.replies._more && this.replies._more.name === 't1__') {
        this.replies = (0, _helpers.getEmptyRepliesListing)(this);
      } else if (this.replies === '') {
        /* If a comment has no replies, reddit returns an empty string as its `replies` property rather than an empty Listing.
        This behavior is unexpected, so replace the empty string with an empty Listing. */
        this.replies = this._r._newObject('Listing', {
          children: [],
          _more: _More.emptyChildren,
          _isCommentList: true
        });
      } else if (this.replies._more && !this.replies._more.link_id) {
        this.replies._more.link_id = this.link_id;
      }
    }
  }

  _transformApiResponse(response) {
    return (0, _helpers.addEmptyRepliesListing)(response[0]);
  }

  get _uri() {
    return "api/info?id=".concat(this.name);
  }
  /**
  * @summary Locks this Comment, preventing new comments from being posted on it.
  * @returns {Promise} The updated version of this Comment
  * @example r.getComment('d1xclfo').lock()
  */


  lock() {
    return this._post({
      uri: 'api/lock',
      form: {
        id: this.name
      }
    }).return(this);
  }
  /**
  * @summary Unlocks this Comment, allowing comments to be posted on it again.
  * @returns {Promise} The updated version of this Comment
  * @example r.getComment('d1xclfo').unlock()
  */


  unlock() {
    return this._post({
      uri: 'api/unlock',
      form: {
        id: this.name
      }
    }).return(this);
  }

};
var _default = Comment;
exports.default = _default;