"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.consoleLogger = void 0;

var _helpers = require("./helpers.js");

var consoleLogger = Object.freeze({
  warn() {
    var _console;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    // eslint-disable-next-line no-console
    (_console = console).warn.apply(_console, ['[warning]'].concat(args));
  },

  info() {
    var _console2;

    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    // eslint-disable-next-line no-console
    (_console2 = console).info.apply(_console2, ['[info]'].concat(args));
  },

  debug() {
    var _console3;

    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    // eslint-disable-next-line no-console
    (_console3 = console).debug.apply(_console3, ['[debug]'].concat(args));
  },

  trace() {
    var _console4;

    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    // eslint-disable-next-line no-console
    (_console4 = console).trace.apply(_console4, ['[trace]'].concat(args));
  }

});
exports.consoleLogger = consoleLogger;

function _default() {
  var config = Object.create(null);
  config.endpointDomain = 'reddit.com';
  config.requestDelay = 0;
  config.requestTimeout = 30000;
  config.continueAfterRatelimitError = false;
  config.retryErrorCodes = [502, 503, 504, 522];
  config.maxRetryAttempts = 3;
  config.warnings = true;
  config.debug = false;
  config.logger = consoleLogger;
  config.proxies = true;
  return (0, _helpers.addSnakeCaseShadowProps)(config);
}