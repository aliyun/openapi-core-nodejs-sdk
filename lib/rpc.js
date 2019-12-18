'use strict';

const assert = require('assert');

const httpx = require('httpx');
const kitx = require('kitx');
const JSON = require('json-bigint');

const helper = require('./helper');

function firstLetterUpper(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function formatParams(params) {
  var keys = Object.keys(params);
  var newParams = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    newParams[firstLetterUpper(key)] = params[key];
  }
  return newParams;
}


function timestamp() {
  var date = new Date();
  var YYYY = date.getUTCFullYear();
  var MM = kitx.pad2(date.getUTCMonth() + 1);
  var DD = kitx.pad2(date.getUTCDate());
  var HH = kitx.pad2(date.getUTCHours());
  var mm = kitx.pad2(date.getUTCMinutes());
  var ss = kitx.pad2(date.getUTCSeconds());
  // 删除掉毫秒部分
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
}

function encode(str) {
  var result = encodeURIComponent(str);

  return result.replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function replaceRepeatList(target, key, repeat) {
  for (var i = 0; i < repeat.length; i++) {
    var item = repeat[i];

    if (item && typeof item === 'object') {
      const keys = Object.keys(item);
      for (var j = 0; j < keys.length; j++) {
        target[`${key}.${i + 1}.${keys[j]}`] = item[keys[j]];
      }
    } else {
      target[`${key}.${i + 1}`] = item;
    }
  }
}

function flatParams(params) {
  var target = {};
  var keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = params[key];
    if (Array.isArray(value)) {
      replaceRepeatList(target, key, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function normalize(params) {
  var list = [];
  var flated = flatParams(params);
  var keys = Object.keys(flated).sort();
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = flated[key];
    list.push([encode(key), encode(value)]); //push []
  }
  return list;
}

function canonicalize(normalized) {
  var fields = [];
  for (var i = 0; i < normalized.length; i++) {
    var [key, value] = normalized[i];
    fields.push(key + '=' + value);
  }
  return fields.join('&');
}

class RPCClient {
  constructor(config, verbose) {
    assert(config, 'must pass "config"');
    assert(config.endpoint, 'must pass "config.endpoint"');
    if (!config.endpoint.startsWith('https://') &&
      !config.endpoint.startsWith('http://')) {
      throw new Error(`"config.endpoint" must starts with 'https://' or 'http://'.`);
    }
    assert(config.apiVersion, 'must pass "config.apiVersion"');
    assert(config.accessKeyId, 'must pass "config.accessKeyId"');
    var accessKeySecret = config.secretAccessKey || config.accessKeySecret;
    assert(accessKeySecret, 'must pass "config.accessKeySecret"');

    if (config.endpoint.endsWith('/')) {
      config.endpoint = config.endpoint.slice(0, -1);
    }

    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.securityToken = config.securityToken;
    this.verbose = verbose === true;
    // 非 codes 里的值，将抛出异常
    this.codes = new Set([200, '200', 'OK', 'Success']);
    if (config.codes) {
      // 合并 codes
      for (var elem of config.codes) {
        this.codes.add(elem);
      }
    }

    this.opts = config.opts || {};

    var httpModule = this.endpoint.startsWith('https://')
      ? require('https') : require('http');
    this.keepAliveAgent = new httpModule.Agent({
      keepAlive: true,
      keepAliveMsecs: 3000
    });
  }

  request(action, params = {}, opts = {}) {
    // 1. compose params and opts
    opts = Object.assign({
      headers: {
        'x-sdk-client': helper.DEFAULT_CLIENT,
        'user-agent': helper.DEFAULT_UA
      }
    }, this.opts, opts);

    // format action until formatAction is false
    if (opts.formatAction !== false) {
      action = firstLetterUpper(action);
    }

    // format params until formatParams is false
    if (opts.formatParams !== false) {
      params = formatParams(params);
    }
    var defaults = this._buildParams();
    params = Object.assign({Action: action}, defaults, params);

    // 2. caculate signature
    var method = (opts.method || 'GET').toUpperCase();
    var normalized = normalize(params);
    var canonicalized = canonicalize(normalized);
    // 2.1 get string to sign
    var stringToSign = `${method}&${encode('/')}&${encode(canonicalized)}`;
    // 2.2 get signature
    const key = this.accessKeySecret + '&';
    var signature = kitx.sha1(stringToSign, key, 'base64');
    // add signature
    normalized.push(['Signature', encode(signature)]);
    // 3. generate final url
    const url = opts.method === 'POST' ? `${this.endpoint}/` : `${this.endpoint}/?${canonicalize(normalized)}`;
    // 4. send request
    var entry = {
      url: url,
      request: null,
      response: null
    };

    if (opts && !opts.agent) {
      opts.agent = this.keepAliveAgent;
    }

    if (opts.method === 'POST') {
      opts.headers = opts.headers || {};
      opts.headers['content-type'] = 'application/x-www-form-urlencoded';
      opts.data = canonicalize(normalized);
    }

    return httpx.request(url, opts).then((response) => {
      entry.request = {
        headers: response.req.getHeaders ? response.req.getHeaders() : response.req._headers
      };
      entry.response = {
        statusCode: response.statusCode,
        headers: response.headers
      };

      return httpx.read(response);
    }).then((buffer) => {
      var json = JSON.parse(buffer);
      if (json.Code && !this.codes.has(json.Code)) {
        var err = new Error(`${json.Message}, URL: ${url}`);
        err.name = json.Code + 'Error';
        err.data = json;
        err.code = json.Code;
        err.url = url;
        err.entry = entry;
        return Promise.reject(err);
      }

      if (this.verbose) {
        return [json, entry];
      }

      return json;
    });
  }

  _buildParams() {
    var defaultParams = {
      Format: 'JSON',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: kitx.makeNonce(),
      SignatureVersion: '1.0',
      Timestamp: timestamp(),
      AccessKeyId: this.accessKeyId,
      Version: this.apiVersion,
    };
    if (this.securityToken) {
      defaultParams.SecurityToken = this.securityToken;
    }
    return defaultParams;
  }
}

module.exports = RPCClient;
