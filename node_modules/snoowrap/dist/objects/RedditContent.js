"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = require("lodash");

var _Promise = _interopRequireDefault(require("../Promise.js"));

var _util = _interopRequireDefault(require("util"));

var _helpers = require("../helpers.js");

var _constants = require("../constants.js");

var _Listing = _interopRequireDefault(require("./Listing.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A base class for content from reddit. With the expection of Listings, all content types extend this class.
* This class should be considered 'abstract', to the extend that JavaScript classes can be -- it should not be necessary to
* instantiate it directly.
* <style> #RedditContent {display: none} </style>
*/
var RedditContent = class RedditContent {
  constructor(options, _r, _hasFetched) {
    // _r refers to the snoowrap requester that is used to fetch this content.
    this._r = _r;
    this._fetch = null;
    this._hasFetched = !!_hasFetched;
    Object.assign(this, options);

    if (typeof Proxy !== 'undefined' && !this._hasFetched && _r._config.proxies) {
      return new Proxy(this, {
        get(target, key) {
          return key in target || key === 'length' || key in _Promise.default.prototype ? target[key] : target.fetch()[key];
        }

      });
    }
  }
  /**
  * @summary Fetches this content from reddit.
  * @desc This will not mutate the original content object; all Promise properties will remain as Promises after the content has
  * been fetched. However, the information on this object will be cached, so it may become out-of-date with the content on
  * reddit. To clear the cache and fetch this object from reddit again, use `refresh()`.
  *
  * If snoowrap is running in an environment that supports ES2015 Proxies (e.g. Chrome 49+), then `fetch()` will get
  * automatically called when an unknown property is accessed on an unfetched content object.
  * @returns {Promise} A version of this object with all of its fetched properties from reddit. This will not mutate the
  object. Once an object has been fetched once, its properties will be cached, so they might end up out-of-date if this
  function is called again. To refresh an object, use refresh().
  * @example
  *
  * r.getUser('not_an_aardvark').fetch().then(userInfo => {
  *   console.log(userInfo.name); // 'not_an_aardvark'
  *   console.log(userInfo.created_utc); // 1419104352
  * });
  *
  * r.getComment('d1xchqn').fetch().then(comment => comment.body).then(console.log)
  * // => 'This is a little too interesting for my liking'
  *
  * // In environments that support ES2015 Proxies, the above line is equivalent to:
  * r.getComment('d1xchqn').body.then(console.log);
  * // => 'This is a little too interesting for my liking'
  */


  fetch() {
    var _this = this;

    if (!this._fetch) {
      this._fetch = this._r._promiseWrap(this._r._get({
        uri: this._uri
      }).then(function (res) {
        return _this._transformApiResponse(res);
      }));
    }

    return this._fetch;
  }
  /**
  * @summary Refreshes this content.
  * @returns {Promise} A newly-fetched version of this content
  * @example
  *
  * var someComment = r.getComment('cmfkyus');
  * var initialCommentBody = some_comment.fetch().then(comment => comment.body);
  *
  * setTimeout(() => {
  *   someComment.refresh().then(refreshedComment => {
  *     if (initialCommentBody.value() !== refreshedComment.body) {
  *       console.log('This comment has changed since 10 seconds ago.');
  *     }
  *   });
  * }, 10000);
  */


  refresh() {
    this._fetch = null;
    return this.fetch();
  }
  /**
  * @summary Returns a stringifyable version of this object.
  * @desc It is usually not necessary to call this method directly; simply running JSON.stringify(some_object) will strip the
  private properties anyway.
  * @returns {object} A version of this object with all the private properties stripped
  * @example
  *
  * var user = r.getUser('not_an_aardvark');
  * JSON.stringify(user) // => '{"name":"not_an_aardvark"}'
  */


  toJSON() {
    return (0, _lodash.mapValues)(this._stripPrivateProps(), function (value, key) {
      if (value instanceof RedditContent && !value._hasFetched) {
        if (value.constructor._name === 'RedditUser' && _constants.USER_KEYS.has(key)) {
          return value.name;
        }

        if (value.constructor._name === 'Subreddit' && _constants.SUBREDDIT_KEYS.has(key)) {
          return value.display_name;
        }
      }

      return value && value.toJSON ? value.toJSON() : value;
    });
  }

  _stripPrivateProps() {
    return (0, _lodash.pick)(this, Object.keys(this).filter(function (key) {
      return !key.startsWith('_');
    }));
  }

  _transformApiResponse(response) {
    return response;
  }

  _clone() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$deep = _ref.deep,
        deep = _ref$deep === void 0 ? false : _ref$deep;

    var clonedProps = (0, _lodash.mapValues)(this, function (value) {
      if (deep) {
        return value instanceof RedditContent || value instanceof _Listing.default ? value._clone({
          deep
        }) : (0, _lodash.cloneDeep)(value);
      }

      return value;
    });
    return this._r._newObject(this.constructor._name, clonedProps, this._hasFetched);
  }

  _getListing() {
    var _this$_r;

    return (_this$_r = this._r)._getListing.apply(_this$_r, arguments);
  }

};
(0, _helpers.defineInspectFunc)(RedditContent.prototype, function () {
  return "".concat(this.constructor._name, " ").concat(_util.default.inspect(this._stripPrivateProps()));
});

_constants.HTTP_VERBS.forEach(function (method) {
  Object.defineProperty(RedditContent.prototype, "_".concat(method), {
    value() {
      var _this$_r2;

      return (_this$_r2 = this._r)["_".concat(method)].apply(_this$_r2, arguments);
    },

    configurable: true,
    writable: true
  });
});

var _default = RedditContent;
exports.default = _default;