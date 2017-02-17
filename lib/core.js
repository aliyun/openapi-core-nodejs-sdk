'use strict';

const assert = require('assert');
const crypto = require('crypto');
const httpx = require('httpx');

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

function pad(value) {
  return (value < 10) ? '0' + value : '' + value;
}

function timestamp() {
  var date = new Date();
  var YYYY = '' + date.getUTCFullYear();
  var MM = pad(date.getUTCMonth() + 1);
  var DD = pad(date.getUTCDate());
  var HH = pad(date.getUTCHours());
  var mm = pad(date.getUTCMinutes());
  var ss = pad(date.getUTCSeconds());
  // 删除掉毫秒部分
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
}

function sha1(str, key) {
  return crypto.createHmac('sha1', key).update(str).digest('base64');
}

function encode(str) {
  var result = encodeURIComponent(str);

  return result.replace(/\!/g, '%21')
   .replace(/\'/g, '%27')
   .replace(/\(/g, '%28')
   .replace(/\)/g, '%29')
   .replace(/\*/g, '%2A');
}

function normalize(params) {
  var list = [];
  var keys = Object.keys(params).sort();
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i];
    list.push([encode(key), encode(params[key])]); //push []
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

class Core {
  constructor(config, verbose) {
    assert(config, 'must pass "config"');
    assert(config.endpoint, 'must pass "config.endpoint"');
    assert(config.apiVersion, 'must pass "config.apiVersion"');
    assert(config.accessKeyId, 'must pass "config.accessKeyId"');
    assert(config.secretAccessKey, 'must pass "config.secretAccessKey"');

    if (config.endpoint.endsWith('/')) {
      config.endpoint = config.endpoint.slice(0, -1);
    }

    this.endpoint = config.endpoint;
    this.apiVersion = config.apiVersion;
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.verbose = verbose === true;
  }

  request(action, params, opts) {
    params || (params = {});

    // 1. compose params
    action = firstLetterUpper(action);
    params = formatParams(params);
    var defaults = this._buildParams();
    params = Object.assign({Action: action}, defaults, params);

    // 2. caculate signature
    var normalized = normalize(params);
    var canonicalized = canonicalize(normalized);
    // 2.1 get string to sign
    var stringToSign = `GET&${encode('/')}&${encode(canonicalized)}`;
    // 2.2 get signature
    var signature = sha1(stringToSign, this.secretAccessKey + '&');
    // add signature
    normalized.push(['Signature', encode(signature)]);
    // 3. generate final url
    const url = `${this.endpoint}/?${canonicalize(normalized)}`;
    // 4. send request
    var entry = {
      url: url,
      request: null,
      response: null
    };

    return httpx.request(url, opts).then((response) => {
      entry.request = response.req;
      entry.response = response;

      return httpx.read(response);
    }).then((buffer) => {
      var json = JSON.parse(buffer);
      if (json.Code && json.Code !== '200') {
        var err = new Error(json.Message);
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
    return {
      Format: 'JSON',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: Math.round(Math.random() * 1000000),
      SignatureVersion: '1.0',
      Timestamp: timestamp(),
      AccessKeyId: this.accessKeyId,
      Version: this.apiVersion,
    };
  }
}

module.exports = Core;
