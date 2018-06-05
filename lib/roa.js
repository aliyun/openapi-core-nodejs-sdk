'use strict';

const assert = require('assert');
const url = require('url');
const querystring = require('querystring');

const kitx = require('kitx');
const httpx = require('httpx');
const xml2js = require('xml2js');
const JSON = require('json-bigint');
const debug = require('debug')('roa');

const pkg = require('../package.json');

function filter(value) {
  return value.replace(/[\t\n\r\f]/g, ' ');
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
    this.host = url.parse(this.endpoint).hostname;

    var httpModule = this.host.startsWith('https://') ? require('https') : require('http');
    this.keepAliveAgent = new httpModule.Agent({
      keepAlive: true,
      keepAliveMsecs: 3000
    });
  }

  buildHeaders() {
    const now = new Date();
    return {
      accept: 'application/json',
      date: now.toGMTString(),
      host: this.host,
      'x-acs-signature-nonce': kitx.makeNonce(),
      'x-acs-signature-method': 'HMAC-SHA1',
      'x-acs-signature-version': '1.0',
      'x-acs-version': this.apiVersion,
      'x-sdk-client': `Node.js(${process.version}), ${pkg.name}: ${pkg.version}`
    };
  }

  getCanonicalizedHeaders(headers) {
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

  getCanonicalizedResource(uriPattern, query) {
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

  buildStringToSign(method, uriPattern, headers, query) {
    const accept = headers['accept'];
    const contentMD5 = headers['content-md5'] || '';
    const contentType = headers['content-type'] || '';
    const date = headers['date'] || '';

    const header = `${method}\n${accept}\n${contentMD5}\n${contentType}\n${date}\n`;

    const canonicalizedHeaders = this.getCanonicalizedHeaders(headers);
    const canonicalizedResource = this.getCanonicalizedResource(uriPattern, query);

    return `${header}${canonicalizedHeaders}${canonicalizedResource}`;
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

    var mixHeaders = Object.assign(this.buildHeaders(), headers);
    if (body) {
      postBody = Buffer.from(body, 'utf8');
      mixHeaders['content-md5'] = kitx.md5(postBody, 'base64');
      mixHeaders['content-length'] = postBody.length;
    }

    var url = `${this.endpoint}${uriPattern}`;
    if (Object.keys(query).length) {
      url += `?${querystring.stringify(query)}`;
    }

    const stringToSign = this.buildStringToSign(method, uriPattern, mixHeaders, query);
    debug('stringToSign: %s', stringToSign);
    mixHeaders['authorization'] = this.buildAuthorization(stringToSign);

    const options = Object.assign({
      method,
      agent: this.keepAliveAgent,
      headers: mixHeaders,
      data: postBody
    }, opts);

    return httpx.request(url, options).then((response) => {
      return httpx.read(response, 'utf8').then((body) => {
        // Retrun raw body
        if (opts.rawBody) {
          return body;
        }

        const contentType = response.headers['content-type'] || '';
        // JSON
        if (contentType.startsWith('application/json')) {
          var result = JSON.parse(body);
          const statusCode = response.statusCode;
          if (statusCode >= 400) {
            var message = `code: ${statusCode}, ${result.Message} requestid: ${result.RequestId}`;
            var err = new Error(message);
            err.name = `${result.Code}Error`;
            return Promise.reject(err);
          }

          return result;
        }

        if (contentType.startsWith('text/xml')) {
          return parseXML(body).then((result) => {
            if (result.Error) {
              return Promise.reject(new ACSError(result.Error));
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
