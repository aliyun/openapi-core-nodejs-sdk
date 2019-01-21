'use strict';

const expect = require('expect.js');

const ROAClient = require('../lib/roa');

describe('roa request', function () {
  var client = new ROAClient({
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    endpoint: 'http://ros.aliyuncs.com',
    apiVersion: '2015-09-01'
  });

  it('request', async function () {
    this.timeout(15000);
    var result = await client.request('GET', '/regions', {}, '', {}, {
      timeout: 15000
    });
    expect(result).to.have.property('Regions');
  });

  it('get should ok', async function () {
    this.timeout(10000);
    var result = await client.get('/regions', {}, {}, {
      timeout: 10000
    });
    expect(result).to.have.property('Regions');
  });

  it('get raw body should ok', async function () {
    this.timeout(10000);
    var opts = {
      rawBody: true,
      timeout: 10000
    };
    var result = await client.get('/regions', {}, {}, opts);
    expect(result).to.be.a('string');
  });
});
