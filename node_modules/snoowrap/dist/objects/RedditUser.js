"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = require("../constants.js");

var _errors = require("../errors.js");

var _RedditContent = _interopRequireDefault(require("./RedditContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
* A class representing a reddit user
* <style> #RedditUser {display: none} </style>
* @extends ReplyableContent
* @example
*
* // Get a user with the given username
* r.getUser('spez')
*/
var RedditUser = class RedditUser extends _RedditContent.default {
  get _uri() {
    if (typeof this.name !== 'string' || !_constants.USERNAME_REGEX.test(this.name)) {
      throw new _errors.InvalidUserError(this.name);
    }

    return "user/".concat(this.name, "/about");
  }
  /**
  * @summary Gives reddit gold to a user
  * @param {number} months The number of months of gold to give. This must be a number between 1 and 36.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getUser('not_an_aardvark').giveGold(12)
  */


  giveGold(months) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new _errors.InvalidMethodCallError('Invalid argument to RedditUser#giveGold; `months` must be between 1 and 36.');
    }

    return this._post({
      uri: "api/v1/gold/give/".concat(this.name),
      form: {
        months
      }
    });
  }
  /**
  * Assigns flair to this user on a given subreddit (as a moderator).
  * @param {object} options
  * @param {string} options.subredditName The subreddit that flair should be assigned on
  * @param {string} [options.text=''] The text that the user's flair should have
  * @param {string} [options.cssClass=''] The CSS class that the user's flair should have
  * @returns {Promise} A Promise that fulfills with the current user after the request is complete
  * @example r.getUser('not_an_aardvark').assignFlair({subredditName: 'snoowrap', text: "Isn't an aardvark"})
  */


  assignFlair(options) {
    return this._r._assignFlair(_objectSpread({}, options, {
      name: this.name
    })).return(this);
  }
  /**
  * @summary Adds this user as a friend, or modifies their friend note.
  * @desc **Note:** reddit.com only permits "notes" to be added on friends if the authenticated account has a subscription to
  reddit gold.
  * @param {object} options
  * @param {string} [options.note] An optional note to add on the user (300 characters max)
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @example r.getUser('actually_an_aardvark').friend({note: 'Is an aardvark'})
  */


  friend() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        note = _ref.note;

    return this._put({
      uri: "api/v1/me/friends/".concat(this.name),
      body: {
        user: this.name,
        note
      }
    }).return(this);
  }
  /**
  * @summary Removes this user from the requester's friend list.
  * @returns {Promise} A Promise that fulfills with this user when the request is complete
  * @example r.getUser('actually_an_aardvark').unfriend()
  */


  unfriend() {
    return this._delete({
      uri: "api/v1/me/friends/".concat(this.name)
    });
  }
  /**
  * @summary Gets information on this user related to their presence on the friend list.
  * @returns {Promise} A Promise that fulfills with an object containing friend information
  * @example
  *
  * r.getUser('not_an_aardvark').getFriendInformation().then(console.log)
  * // => { date: 1460318190, note: 'Is an aardvark', name: 'actually_an_aardvark', id: 't2_q3519' }
  */


  getFriendInformation() {
    return this._get({
      uri: "api/v1/me/friends/".concat(this.name)
    });
  }
  /**
  * @summary Gets a list of this user's trophies.
  * @returns {Promise} A TrophyList containing this user's trophies
  * @example
  *
  * r.getUser('not_an_aardvark').getTrophies().then(console.log)
  * // => TrophyList { trophies: [
  * //  Trophy { ... },
  * //  Trophy { ... },
  * //  ...
  * // ] }
  */


  getTrophies() {
    return this._get({
      uri: "api/v1/user/".concat(this.name, "/trophies")
    });
  }
  /**
  * @summary Gets a Listing of the content this user has submitted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getUser('spez').getOverview().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */


  getOverview(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/overview"),
      qs: options
    });
  }
  /**
  * @summary Gets a Listing of this user's submissions.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getUser('spez').getSubmissions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */


  getSubmissions(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/submitted"),
      qs: options
    });
  }
  /**
  * @summary Gets a Listing of this user's comments.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Comments
  * @example
  *
  * r.getUser('spez').getComments().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */


  getComments(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/comments"),
      qs: options
    });
  }
  /**
  * @summary Gets a Listing of the content that this user has upvoted.
  * @desc **Note**: This can only be used to view one's own upvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getUpvotedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */


  getUpvotedContent(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/upvoted"),
      qs: options
    });
  }
  /**
  * @summary Gets a Listing of the content that this user has downvoted.
  * @desc **Note**: This can only be used to view one's own downvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getDownvotedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */


  getDownvotedContent(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/downvoted"),
      qs: options
    });
  }
  /**
  * @summary Gets a Listing of the submissions that this user has hidden.
  * @desc **Note**: This can only be used to view one's own set of hidden posts, as reddit will return a 403 error when
  attempting to view another users' hidden posts.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getMe().getHiddenContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */


  getHiddenContent(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/hidden"),
      qs: options
    });
  }
  /**
  * @summary Gets a Listing of the content that this user has saved.
  * @desc **Note**: This can only be used to view one's own set of saved content, as reddit will return a 403 error when
  attempting to view other users' saved content.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments.
  * @example
  *
  * r.getMe().getSavedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */


  getSavedContent(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/saved"),
      qs: options
    });
  }
  /**
  * @summary Gets a Listing of this user's content which has been gilded.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getGildedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */


  getGildedContent(options) {
    return this._getListing({
      uri: "user/".concat(this.name, "/gilded"),
      qs: options
    });
  }
  /**
  * @summary Gets a multireddit belonging to this user.
  * @param {string} name The name of the multireddit
  * @returns {MultiReddit} An unfetched MultiReddit object
  * @example
  *
  * r.getUser('multi-mod').getMultireddit('coding_languages')
  * // => MultiReddit {
  * //  name: 'coding_languages',
  * //  curator: RedditUser { name: 'multi-mod' },
  * //  path: '/user/multi-mod/m/coding_languages'
  * // }
  */


  getMultireddit(name) {
    return this._r._newObject('MultiReddit', {
      name,
      curator: this
    });
  }
  /**
  * @summary Gets an Array of all of this user's MultiReddits.
  * @returns {Promise} A Promise that fulfills with an Array containing MultiReddits.
  * @example
  *
  * r.getUser('multi-mod').getMultireddits().then(console.log)
  *
  * // => [
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   ...
  * ]
  */


  getMultireddits() {
    return this._get({
      uri: "api/multi/user/".concat(this.name),
      qs: {
        expand_srs: true
      }
    });
  }

};
var _default = RedditUser;
exports.default = _default;