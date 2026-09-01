'use strict';

const expect = require('expect.js');
const crypto = require('crypto');
const hash = require('../lib/hash');

describe('hash helpers', function () {
  it('pad2 pads single digit', function () {
    expect(hash.pad2(0)).to.be('00');
    expect(hash.pad2(9)).to.be('09');
    expect(hash.pad2(10)).to.be('10');
    expect(hash.pad2(59)).to.be('59');
  });

  it('md5 matches crypto.createHash', function () {
    const data = Buffer.from('hello', 'utf8');
    expect(hash.md5(data, 'hex')).to.be(
      crypto.createHash('md5').update(data).digest('hex')
    );
    expect(hash.md5(data, 'base64')).to.be(
      crypto.createHash('md5').update(data).digest('base64')
    );
  });

  it('sha1 hmac matches crypto.createHmac', function () {
    const data = 'string-to-sign';
    const key = 'secret&';
    expect(hash.sha1(data, key, 'base64')).to.be(
      crypto.createHmac('sha1', key).update(data).digest('base64')
    );
  });
});
