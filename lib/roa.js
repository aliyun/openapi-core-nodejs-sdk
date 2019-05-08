'use strict';

const assert = require('assert');
const url = require('url');
const querystring = require('querystring');

const kitx = require('kitx');
const httpx = require('httpx');
const xml2js = require('xml2js');
const JSON = require('json-bigint');
const debug = require('debug')('roa');

const helper = require('./helper');

function filter(value) {
  return value.replace(/[\t\n\r\f]/g, ' ');
}

function keyLowerify(headers) {
  const keys = Object.keys(headers);
  const newHeaders = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    newHeaders[key.toLowerCase()] = headers[key];
  }
  return newHeaders;
}

function getCanonicalizedHeaders(headers) {
  const prefix = 'x-acs-';
  const keys = Object.keys(headers);

  const canonicalizedKeys = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.startsWith(prefix)) {
      canonicalizedKeys.push(key);
    }
  }

  canonicalizedKeys.sort();

  var result = '';
  for (let i = 0; i < canonicalizedKeys.length; i++) {
    const key = canonicalizedKeys[i];
    result += `${key}:${filter(headers[key]).trim()}\n`;
  }

  return result;
}

function getCanonicalizedResource(uriPattern, query) {
  const keys = Object.keys(query).sort();

  if (keys.length === 0) {
    return uriPattern;
  }

  var result = [];
  for (var i = 0; i < keys.length; i++) {
    const key = keys[i];
    result.push(`${key}=${query[key]}`);
  }

  return `${uriPattern}?${result.join('&')}`;
}

function buildStringToSign(method, uriPattern, headers, query) {
  const accept = headers['accept'];
  const contentMD5 = headers['content-md5'] || '';
  const contentType = headers['content-type'] || '';
  const date = headers['date'] || '';

  const header = `${method}\n${accept}\n${contentMD5}\n${contentType}\n${date}\n`;

  const canonicalizedHeaders = getCanonicalizedHeaders(headers);
  const canonicalizedResource = getCanonicalizedResource(uriPattern, query);

  return `${header}${canonicalizedHeaders}${canonicalizedResource}`;
}

function parseXML(xml) {
  const parser = new xml2js.Parser({
    // explicitArray: false
  });
  return new Promise((resolve, reject) => {
    parser.parseString(xml, (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    });
  });
}

class ACSError extends Error {
  constructor(err) {
    const message = err.Message[0];
    const code = err.Code[0];
    const hostid = err.HostId[0];
    const requestid = err.RequestId[0];
    super(`${message} hostid: ${hostid}, requestid: ${requestid}`);
    this.code = code;
  }
}

class ROAClient {
  constructor(config) {
    assert(config, 'must pass "config"');
    assert(config.endpoint, 'must pass "config.endpoint"');
    if (!config.endpoint.startsWith('https://') &&
      !config.endpoint.startsWith('http://')) {
      throw new Error(`"config.endpoint" must starts with 'https://' or 'http://'.`);
    }
    assert(config.apiVersion, 'must pass "config.apiVersion"');
    assert(config.accessKeyId, 'must pass "config.accessKeyId"');
    assert(config.accessKeySecret, 'must pass "config.accessKeySecret"');

    this.endpoint = config.endpoint;

    this.apiVersion = config.apiVersion;
    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = config.accessKeySecret;
    this.securityToken = config.securityToken;
    this.host = url.parse(this.endpoint).hostname;
    this.opts = config.opts;
    var httpModule = this.endpoint.startsWith('https://') ? require('https') : require('http');
    this.keepAliveAgent = new httpModule.Agent({
      keepAlive: true,
      keepAliveMsecs: 3000
    });
  }

  buildHeaders() {
    const now = new Date();
    var defaultHeaders = {
      accept: 'application/json',
      date: now.toGMTString(),
      host: this.host,
      'x-acs-signature-nonce': kitx.makeNonce(),
      'x-acs-signature-method': 'HMAC-SHA1',
      'x-acs-signature-version': '1.0',
      'x-acs-version': this.apiVersion,
      'user-agent': helper.DEFAULT_UA,
      'x-sdk-client': helper.DEFAULT_CLIENT
    };
    if (this.securityToken) {
      defaultHeaders['x-acs-accesskey-id'] = this.accessKeyId;
      defaultHeaders['x-acs-security-token'] = this.securityToken;
    }
    return defaultHeaders;
  }

  signature(stringToSign) {
    const utf8Buff = Buffer.from(stringToSign, 'utf8');

    return kitx.sha1(utf8Buff, this.accessKeySecret, 'base64');
  }

  buildAuthorization(stringToSign) {
    return `acs ${this.accessKeyId}:${this.signature(stringToSign)}`;
  }

  request(method, uriPattern, query = {}, body = '', headers = {}, opts = {}) {
    var postBody = null;

    var mixHeaders = Object.assign(this.buildHeaders(), keyLowerify(headers));
    if (body) {
      postBody = Buffer.from(body, 'utf8');
      mixHeaders['content-md5'] = kitx.md5(postBody, 'base64');
      mixHeaders['content-length'] = postBody.length;
    }

    var url = `${this.endpoint}${uriPattern}`;
    if (Object.keys(query).length) {
      url += `?${querystring.stringify(query)}`;
    }

    const stringToSign = buildStringToSign(method, uriPattern, mixHeaders, query);
    debug('stringToSign: %s', stringToSign);
    mixHeaders['authorization'] = this.buildAuthorization(stringToSign);

    const options = Object.assign({
      method,
      agent: this.keepAliveAgent,
      headers: mixHeaders,
      data: postBody
    }, this.opts, opts);

    return httpx.request(url, options).then((response) => {
      return httpx.read(response, 'utf8').then((body) => {
        // Retrun raw body
        if (opts.rawBody) {
          return body;
        }

        const contentType = response.headers['content-type'] || '';
        // JSON
        if (contentType.startsWith('application/json')) {
          const statusCode = response.statusCode;
          if (statusCode === 204) {
            return body;
          }

          var result;
          try {
            result = JSON.parse(body);
          } catch (err) {
            err.name = 'FormatError';
            err.message = 'parse response to json error';
            err.body = body;
            throw err;
          }

          if (statusCode >= 400) {
            const errorMessage = result.Message || result.errorMsg || '';
            const errorCode = result.Code || result.errorCode || '';
            const requestId = result.RequestId || '';
            var err = new Error(`code: ${statusCode}, ${errorMessage}, requestid: ${requestId}`);
            err.name = `${errorCode}Error`;
            err.statusCode = statusCode;
            err.result = result;
            err.code = errorCode;
            throw err;
          }

          return result;
        }

        if (contentType.startsWith('text/xml')) {
          return parseXML(body).then((result) => {
            if (result.Error) {
              throw new ACSError(result.Error);
            }

            return result;
          });
        }

        return body;
      });
    });
  }

  put(path, query, body, headers, options) {
    return this.request('PUT', path, query, body, headers, options);
  }

  post(path, query, body, headers, options) {
    return this.request('POST', path, query, body, headers, options);
  }

  get(path, query, headers, options) {
    return this.request('GET', path, query, '', headers, options);
  }

  delete(path, query, headers, options) {
    return this.request('DELETE', path, query, '', headers, options);
  }
}

module.exports = ROAClient;
