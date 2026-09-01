'use strict';

const crypto = require('crypto');
const os = require('os');
const kitx = require('kitx');

/**
 * Cryptographically secure SignatureNonce (replaces kitx.makeNonce Math.random).
 * Output shape kept compatible: md5 hex of hostname+pid+entropy+counter.
 */
module.exports = (function () {
  var counter = 0;
  var last;
  const machine = os.hostname();
  const pid = process.pid;

  return function makeNonce() {
    var val = parseInt(crypto.randomBytes(6).toString('hex'), 16);
    if (val === last) {
      counter++;
    } else {
      counter = 0;
    }
    last = val;
    var uid = `${machine}${pid}${val}${counter}`;
    return kitx.md5(uid, 'hex');
  };
}());
