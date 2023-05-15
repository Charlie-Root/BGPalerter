"use strict";

var _fs = _interopRequireDefault(require("fs"));
var _pubSub = _interopRequireDefault(require("./utils/pubSub"));
var _fastFileLogger = _interopRequireDefault(require("fast-file-logger"));
var _package = require("../package.json");
var _storageFile = _interopRequireDefault(require("./utils/storages/storageFile"));
var _url = _interopRequireDefault(require("url"));
var _rpkiUtils = _interopRequireDefault(require("./utils/rpkiUtils"));
var _configYml = _interopRequireDefault(require("./config/configYml"));
var _config = _interopRequireDefault(require("./config/config"));
var _uuid = require("uuid");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; } /*
                                                                                                                                                                                     * 	BSD 3-Clause License
                                                                                                                                                                                     *
                                                                                                                                                                                     * Copyright (c) 2019, NTT Ltd.
                                                                                                                                                                                     * All rights reserved.
                                                                                                                                                                                     *
                                                                                                                                                                                     * Redistribution and use in source and binary forms, with or without
                                                                                                                                                                                     * modification, are permitted provided that the following conditions are met:
                                                                                                                                                                                     *
                                                                                                                                                                                     *  Redistributions of source code must retain the above copyright notice, this
                                                                                                                                                                                     *   list of conditions and the following disclaimer.
                                                                                                                                                                                     *
                                                                                                                                                                                     *  Redistributions in binary form must reproduce the above copyright notice,
                                                                                                                                                                                     *   this list of conditions and the following disclaimer in the documentation
                                                                                                                                                                                     *   and/or other materials provided with the distribution.
                                                                                                                                                                                     *
                                                                                                                                                                                     *  Neither the name of the copyright holder nor the names of its
                                                                                                                                                                                     *   contributors may be used to endorse or promote products derived from
                                                                                                                                                                                     *   this software without specific prior written permission.
                                                                                                                                                                                     *
                                                                                                                                                                                     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
                                                                                                                                                                                     * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
                                                                                                                                                                                     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
                                                                                                                                                                                     * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
                                                                                                                                                                                     * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
                                                                                                                                                                                     * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
                                                                                                                                                                                     * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
                                                                                                                                                                                     * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
                                                                                                                                                                                     * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
                                                                                                                                                                                     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
                                                                                                                                                                                     */
var configConnector = new (global.EXTERNAL_CONFIG_CONNECTOR || _configYml["default"])();
var vector = {
  version: global.EXTERNAL_VERSION_FOR_TEST || _package.version,
  clientId: Buffer.from("bnR0LWJncGFsZXJ0ZXI=", 'base64').toString('ascii')
};
var config = configConnector.retrieve();
if (global.DRY_RUN) {
  config.connectors = [{
    file: "connectorTest",
    name: "tes",
    params: {
      testType: "hijack"
    }
  }];
  config.monitors = [{
    file: "monitorPassthrough",
    channel: "hijack",
    name: "monitor-passthrough",
    params: {
      showPaths: 0,
      thresholdMinPeers: 0
    }
  }];
}
config.volume = config.volume || global.EXTERNAL_VOLUME_DIRECTORY || "";
if (config.volume && config.volume.length) {
  if (config.volume.slice(-1) !== "/") {
    config.volume += "/";
  }
  if (!_fs["default"].existsSync(config.volume)) {
    _fs["default"].mkdirSync(config.volume);
  }
}
if (!config.configVersion || config.configVersion < _config["default"].configVersion) {
  console.log("Your config.yml file is old. It works, but it may not support all the new features. Update your config file or generate a new one (e.g., rename the file into config.yml.bak, run BGPalerter and proceed with the auto configuration, apply to the new config.yml the personalizations you did in config.yml.bak.");
}
var errorTransport = new _fastFileLogger["default"]({
  logRotatePattern: config.logging.logRotatePattern,
  filename: 'error-%DATE%.log',
  symLink: 'error.log',
  directory: config.volume + config.logging.directory,
  maxRetainedFiles: config.logging.maxRetainedFiles,
  maxFileSizeMB: config.logging.maxFileSizeMB,
  compressOnRotation: config.logging.compressOnRotation,
  label: config.environment,
  useUTC: !!config.logging.useUTC,
  format: function format(_ref) {
    var data = _ref.data,
      timestamp = _ref.timestamp;
    return "".concat(timestamp, " ").concat(data.level, ": ").concat(data.message);
  }
});
var verboseTransport = new _fastFileLogger["default"]({
  logRotatePattern: config.logging.logRotatePattern,
  filename: 'reports-%DATE%.log',
  symLink: 'reports.log',
  directory: config.volume + config.logging.directory,
  maxRetainedFiles: config.logging.maxRetainedFiles,
  maxFileSizeMB: config.logging.maxFileSizeMB,
  compressOnRotation: config.logging.compressOnRotation,
  label: config.environment,
  useUTC: !!config.logging.useUTC,
  format: function format(_ref2) {
    var data = _ref2.data,
      timestamp = _ref2.timestamp;
    return "".concat(timestamp, " ").concat(data.level, ": ").concat(data.message);
  }
});
var loggerTransports = {
  verbose: verboseTransport,
  error: errorTransport,
  info: errorTransport
};
var wlogger = {
  log: function log(data) {
    return loggerTransports[data.level].log(data);
  }
};
config.monitors = config.monitors || [];
config.monitors.push({
  file: "monitorSwUpdates",
  channel: "software-update",
  name: "software-update"
});
config.monitors = config.monitors.map(function (item) {
  return {
    "class": require(item.external ? item.file : "./monitors/" + item.file)["default"],
    channel: item.channel,
    name: item.name,
    params: item.params
  };
});
config.reports = (config.reports || []).map(function (item) {
  return {
    file: item.file,
    "class": require(item.external ? item.file : "./reports/" + item.file)["default"],
    channels: item.channels,
    params: item.params
  };
});
if (!config.reports.some(function (report) {
  return report.channels.includes("software-update");
})) {
  // Check if software-update channel is declared
  config.reports.forEach(function (report) {
    return report.channels.push("software-update");
  }); // If not, declare it everywhere
}

config.connectors = config.connectors || [];
config.connectors.push({
  file: "connectorSwUpdates",
  name: "upd"
});
if (_toConsumableArray(new Set(config.connectors)).length !== config.connectors.length) {
  throw new Error('Connectors names MUST be unique');
}
config.connectors = config.connectors.map(function (item, index) {
  if (item.name.length !== 3) {
    throw new Error('Connectors names MUST be exactly 3 letters');
  }
  return {
    "class": require(item.external ? item.file : "./connectors/" + item.file)["default"],
    params: item.params,
    name: item.name
  };
});
if (config.httpProxy) {
  var HttpsProxyAgent = require("https-proxy-agent");
  vector.agent = new HttpsProxyAgent(_url["default"].parse(config.httpProxy));
}
vector.storage = new _storageFile["default"]({}, config);
vector.config = config;
vector.logger = wlogger;
vector.pubSub = new _pubSub["default"]();
vector.rpki = new _rpkiUtils["default"](vector);
vector.instanceId = (0, _uuid.v4)();
module.exports = vector;