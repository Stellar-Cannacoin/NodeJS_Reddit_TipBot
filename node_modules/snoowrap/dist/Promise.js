"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bluebird = _interopRequireDefault(require("bluebird"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PromiseCopy = _bluebird.default.getNewLibraryCopy();

PromiseCopy.config({
  cancellation: true,
  warnings: false
});
var _default = PromiseCopy;
exports.default = _default;