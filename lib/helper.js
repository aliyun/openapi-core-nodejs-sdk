'use strict';

const os = require('os');
const assert = require('assert');

const pkg = require('../package.json');

exports.DEFAULT_UA = `AlibabaCloud (${os.platform()}; ${os.arch()}) ` +
  `Node.js/${process.version} Core/${pkg.version}`;
exports.DEFAULT_CLIENT = `Node.js(${process.version}), ${pkg.name}: ${pkg.version}`;

exports.getSignatureAlgorithm = function (method) {
  assert(method === 'HMAC-SHA1' || method === 'HMAC-SHA256',
    'signatureMethod must be HMAC-SHA1 or HMAC-SHA256');
  return method === 'HMAC-SHA1' ? 'sha1' : 'sha256';
};
