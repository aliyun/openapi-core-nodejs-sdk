'use strict';

const expect = require('expect.js');
const crypto = require('crypto');
const makeNonce = require('../lib/nonce');

describe('makeNonce', function () {
  it('returns distinct hex digests', function () {
    const a = makeNonce();
    const b = makeNonce();
    expect(a).not.to.be(b);
    expect(a).to.match(/^[0-9a-f]+$/);
    expect(a.length).to.be(32);
  });

  it('uses crypto.randomBytes and counters on collision', function () {
    const orig = crypto.randomBytes;
    let calls = 0;
    crypto.randomBytes = function (size) {
      calls++;
      return Buffer.alloc(size, 0xcd);
    };
    try {
      // Fresh require would share module state; use existing singleton.
      const x = makeNonce();
      const y = makeNonce();
      expect(x).not.to.be(y);
      expect(calls).to.be.above(1);
    } finally {
      crypto.randomBytes = orig;
    }
  });
});
