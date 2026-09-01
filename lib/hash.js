'use strict';

const crypto = require('crypto');

/**
 * Local replacements for kitx helpers used by Classic POP signing.
 * kitx is no longer a dependency (its makeNonce used Math.random).
 */

exports.pad2 = function (num) {
  if (num < 10) {
    return '0' + num;
  }
  return '' + num;
};

exports.md5 = function (data, encoding) {
  return crypto.createHash('md5').update(data).digest(encoding);
};

exports.sha1 = function (data, key, encoding) {
  return crypto.createHmac('sha1', key).update(data).digest(encoding);
};
