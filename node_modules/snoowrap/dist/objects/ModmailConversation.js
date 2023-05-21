"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.modActionStates = exports.conversationStates = void 0;

var _RedditContent = _interopRequireDefault(require("./RedditContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @global
 * @enum {number}
 * @readonly
 * @summary Represents the current status of a given Modmail conversation.
 * @type {Readonly<{New: number, InProgress: number, Archived: number}>}
 */
var conversationStates = Object.freeze({
  New: 0,
  InProgress: 1,
  Archived: 2
});
/**
 * @global
 * @enum {number}
 * @readonly
 * @summary Represents all the possible states that is used within a Modmail conversations.
 * @type {Readonly<{UnArchive: number, Highlight: number, Archive: number, ReportedToAdmins: number, Mute: number, UnHighlight: number, Unmute: number}>}
 */

exports.conversationStates = conversationStates;
var modActionStates = Object.freeze({
  Highlight: 0,
  UnHighlight: 1,
  Archive: 2,
  UnArchive: 3,
  ReportedToAdmins: 4,
  Mute: 5,
  Unmute: 6
});
/**
 * @class
 * A class representing a conversation from new modmail
 * <style> #ModmailConversation {display: none} </style>
 * @name ModmailConversation
 * @example
 *
 * // Get a Modmail Conversation with a given ID
 * r.getNewModmailConversation('75hxt')
 * @extends RedditContent
 */

exports.modActionStates = modActionStates;
var ModmailConversation = class ModmailConversation extends _RedditContent.default {
  static get conversationStates() {
    return conversationStates;
  }

  static get modActionStates() {
    return modActionStates;
  }

  get _uri() {
    return "api/mod/conversations/".concat(this.id, "?markRead=false");
  }
  /**
   * @summary Converts relevant fields in the ModmailConversation to snoowrap models.
   * @param response API Response
   * @return {ModmailConversation}
   * @private
   */


  _transformApiResponse(response) {
    response.conversation.owner = this._r._newObject('Subreddit', {
      id: response.conversation.owner.id,
      display_name: response.conversation.owner.displayName
    });
    response.conversation.participant = this._r._newObject('ModmailConversationAuthor', response.user.name, true);

    for (var author of response.conversation.authors) {
      author = this._r._newObject('ModmailConversationAuthor', author, true);
    }

    var conversationObjects = ModmailConversation._getConversationObjects(response.conversation, response);

    return this._r._newObject('ModmailConversation', _objectSpread({}, conversationObjects, {}, response.conversation), true);
  }
  /**
   * @summary Maps objects to the ModmailConversation
   * @param conversation The conversation to map objects to
   * @param response API Response
   * @return {object}
   * @private
   */


  static _getConversationObjects(conversation, response) {
    var conversationObjects = {};

    for (var objId of conversation.objIds) {
      if (!conversationObjects[objId.key]) {
        conversationObjects[objId.key] = [];
      }

      conversationObjects[objId.key].push(response[objId.key][objId.id]);
    }

    return conversationObjects;
  }
  /**
   * @summary Reply to current ModmailConversation
   * @param {string} body Markdown text
   * @param {boolean} isAuthorHidden Subreddit-name reply if true, user's name if false
   * @param {boolean} isInternal If reply should be to internal moderators only
   * @return {Promise}
   */


  reply(body) {
    var isAuthorHidden = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var isInternal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    return this._post({
      uri: "api/mod/conversations/".concat(this.id),
      form: {
        body,
        isAuthorHidden,
        isInternal
      }
    });
  }
  /**
   * @summary Archives the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').archive()
   */


  archive() {
    return this._post({
      uri: "api/mod/conversations/".concat(this.id, "/archive")
    });
  }
  /**
   * @summary Unarchives the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unarchive()
   */


  unarchive() {
    return this._post({
      uri: "api/mod/conversations/".concat(this.id, "/unarchive")
    });
  }
  /**
   * @summary Marks a ModmailConversation as highlighted
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').highlight()
   */


  highlight() {
    return this._post({
      uri: "api/mod/conversations/".concat(this.id, "/highlight")
    });
  }
  /**
   * @summary Removed highlighted from a ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unhighlight()
   */


  unhighlight() {
    return this._delete({
      uri: "api/mod/conversations/".concat(this.id, "/highlight")
    });
  }
  /**
   * @summary Mute the participant of the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').mute()
   */


  mute() {
    return this._post({
      uri: "api/mod/conversations/".concat(this.id, "/mute")
    });
  }
  /**
   * @summary Unmute the participant of the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unmute()
   */


  unmute() {
    return this._post({
      uri: "api/mod/conversations/".concat(this.id, "/unmute")
    });
  }
  /**
   * @summary Marks the ModmailConversation as read
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').read()
   */


  read() {
    return this._r.markNewModmailConversationsAsRead([this.id]);
  }
  /**
   * @summary Marks the ModmailConversation as unread
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unread()
   */


  unread() {
    return this._r.markNewModmailConversationsAsUnread([this.id]);
  }
  /**
   * @summary Fetches the participant of the conversation
   * @return {Promise<ModmailConversationAuthor>}
   * @example
   *
   * r.getNewModmailConversation('75hxt').getParticipant().then(console.log)
   * // ModmailConversationAuthor { muteStatus: {...}, name: "SpyTec13", created: '2015-11-22T14:30:38.821292+00:00', ...}
   */


  getParticipant() {
    var _this = this;

    return this._get({
      uri: "api/mod/conversations/".concat(this.id, "/user")
    }).then(function (res) {
      return _this._r._newObject('ModmailConversationAuthor', res, true);
    });
  }
  /**
   * @summary Returns whether the ModmailConversation is read.
   * @return {boolean} true, if read. false otherwise
   */


  isRead() {
    return this.lastUnread === null;
  }

  get name() {
    return this.id;
  }

};
var _default = ModmailConversation;
exports.default = _default;