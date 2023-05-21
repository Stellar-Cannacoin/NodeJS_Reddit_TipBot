"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEmptyRepliesListing = getEmptyRepliesListing;
exports.addEmptyRepliesListing = addEmptyRepliesListing;
exports.handleJsonErrors = handleJsonErrors;
exports.findMessageInTree = findMessageInTree;
exports.formatPermissions = formatPermissions;
exports.renameKey = renameKey;
exports.buildRepliesTree = buildRepliesTree;
exports.addFullnamePrefix = addFullnamePrefix;
exports.hasFullnamePrefix = hasFullnamePrefix;
exports.addSnakeCaseShadowProps = addSnakeCaseShadowProps;
exports.defineInspectFunc = defineInspectFunc;
exports.requiredArg = requiredArg;
exports.isBrowser = exports.formatLivethreadPermissions = exports.formatModPermissions = void 0;

var _util = _interopRequireDefault(require("util"));

var _lodash = require("lodash");

var _constants = require("./constants.js");

var _More = require("./objects/More.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
* @summary Returns an unfetched empty replies Listing for an item.
* @param {Comment|Submission|PrivateMessage} item An item without a replies Listing
* @returns {Listing} The empty replies Listing
* @api private
*/
function getEmptyRepliesListing(item) {
  if (item.constructor._name === 'Comment') {
    return item._r._newObject('Listing', {
      _uri: "comments/".concat((item.link_id || item.parent_id).slice(3)),
      _query: {
        comment: item.name.slice(3)
      },
      _transform: (0, _lodash.property)('comments[0].replies'),
      _link_id: item.link_id,
      _isCommentList: true
    });
  }

  if (item.constructor._name === 'Submission') {
    return item._r._newObject('Listing', {
      _uri: "comments/".concat(item.id),
      _transform: (0, _lodash.property)('comments'),
      _isCommentList: true
    });
  }

  return item._r._newObject('Listing');
}
/**
* @summary Adds an empty replies Listing to an item.
* @param {Comment|PrivateMessage} item
* @returns {Comment|PrivateMessage} The item with the new replies Listing
* @api private
*/


function addEmptyRepliesListing(item) {
  item.replies = getEmptyRepliesListing(item);
  return item;
}

function handleJsonErrors(returnValue) {
  return function (response) {
    if ((0, _lodash.isEmpty)(response) || (0, _lodash.isEmpty)(response.json.errors)) {
      return returnValue;
    }

    throw new Error(response.json.errors[0]);
  };
}
/**
* @summary Performs a depth-first search of a tree of private messages, in order to find a message with a given name.
* @param {String} desiredName The fullname of the desired message
* @param {PrivateMessage} rootNode The root message of the tree
* @returns {PrivateMessage} The PrivateMessage with the given fullname, or undefined if it was not found in the tree.
* @api private
*/


function findMessageInTree(desiredName, rootNode) {
  return rootNode.name === desiredName ? rootNode : (0, _lodash.find)(rootNode.replies.map((0, _lodash.partial)(findMessageInTree, desiredName)));
}
/**
* @summary Formats permissions into a '+'/'-' string
* @param {String[]} allPermissionNames All possible permissions in this category
* @param {String[]} permsArray The permissions that should be enabled
* @returns {String} The permissions formatted into a '+'/'-' string
* @api private
*/


function formatPermissions(allPermissionNames, permsArray) {
  return permsArray ? allPermissionNames.map(function (type) {
    return ((0, _lodash.includes)(permsArray, type) ? '+' : '-') + type;
  }).join(',') : '+all';
}

var formatModPermissions = (0, _lodash.partial)(formatPermissions, _constants.MODERATOR_PERMISSIONS);
exports.formatModPermissions = formatModPermissions;
var formatLivethreadPermissions = (0, _lodash.partial)(formatPermissions, _constants.LIVETHREAD_PERMISSIONS);
/**
* @summary Renames a key on an object, omitting the old key
* @param {Object} obj
* @param oldKey {String}
* @param newKey {String}
* @returns {Object} A version of the object with the key renamed
* @api private
*/

exports.formatLivethreadPermissions = formatLivethreadPermissions;

function renameKey(obj, oldKey, newKey) {
  return obj && (0, _lodash.omit)(_objectSpread({}, obj, {
    [newKey]: obj[oldKey]
  }), oldKey);
}
/**
* @summary Builds a replies tree from a list of child comments or messages
* @desc When reddit returns private messages (or comments from the /api/morechildren endpoint), it arranges their in a very
nonintuitive way (see https://github.com/not-an-aardvark/snoowrap/issues/15 for details). This function rearranges the message
tree so that replies are threaded properly.
* @param {Array} childList The list of child comments
* @returns {Array} The resulting list of child comments, arranged into a tree.
* @api private
*/


function buildRepliesTree(childList) {
  var childMap = (0, _lodash.keyBy)(childList, 'name');
  childList.forEach(addEmptyRepliesListing);
  childList.filter(function (child) {
    return child.constructor._name === 'Comment';
  }).forEach(function (child) {
    return child.replies._more = _More.emptyChildren;
  });
  (0, _lodash.remove)(childList, function (child) {
    return childMap[child.parent_id];
  }).forEach(function (child) {
    if (child.constructor._name === 'More') {
      childMap[child.parent_id].replies._setMore(child);

      child.link_id = childMap[child.parent_id].link_id;
    } else {
      childMap[child.parent_id].replies.push(child);
    }
  });
  return childList;
}
/**
* @summary Adds a fullname prefix to an item, if it doesn't have a prefix already. If the item is a RedditContent object, gets
the item's fullname.
* @param {String|RedditContent} item
* @returns {String}
* @api private
*/


function addFullnamePrefix(item, prefix) {
  if (typeof item === 'string') {
    return hasFullnamePrefix(item) ? item : prefix + item;
  }

  return item.name;
}
/**
* @summary Determines whether a string is a "fullname". A "fullname" starts with "t1_", "t2_", ... "t8_", or "LiveUpdateEvent_".
* @param {String} item
* @returns {boolean}
* @api private
*/


function hasFullnamePrefix(item) {
  return /^(t\d|LiveUpdateEvent)_/.test(item);
}
/**
* @summary Adds snake_case getters and setters to an object
* @desc All of snoowrap's functions and object options used to be defined in snake_case. For backwards compatibility,
snake_case property names (e.g. for the snoowrap constructor) are still supported. This function adds snake_case getters and
setters to a camelCase object, such that accessing and setting the snake_case property also correctly set the camelCase version
of the property.
* @param {object} obj The object that should have getters/setters attached
* @returns The updated version of `obj`
* @api private
*/


function addSnakeCaseShadowProps(obj) {
  Object.keys(obj).filter(function (key) {
    return !key.startsWith('_') && key !== (0, _lodash.snakeCase)(key);
  }).forEach(function (key) {
    Object.defineProperty(obj, (0, _lodash.snakeCase)(key), {
      get: function () {
        return obj[key];
      },
      set: function (value) {
        return obj[key] = value;
      }
    });
  });
  return obj;
}

var isBrowser = typeof self === 'object';
exports.isBrowser = isBrowser;

function defineInspectFunc(obj, inspectFunc) {
  if (isBrowser) {
    return;
  } // Use the util.inspect.custom symbol if available (Node 6.6.0+)


  var inspectKey = _util.default.inspect && typeof _util.default.inspect.custom === 'symbol' ? _util.default.inspect.custom : 'inspect';
  Object.defineProperty(obj, inspectKey, {
    writable: true,
    enumerable: false,
    value: inspectFunc
  });
}

function requiredArg(argName) {
  throw new TypeError("Missing required argument ".concat(argName));
}