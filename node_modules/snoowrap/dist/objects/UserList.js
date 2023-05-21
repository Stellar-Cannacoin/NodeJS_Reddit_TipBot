"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class UserList {
  constructor(options, _r) {
    return options.children.map(function (user) {
      return _r._newObject('RedditUser', user);
    });
  }

}

exports.default = UserList;