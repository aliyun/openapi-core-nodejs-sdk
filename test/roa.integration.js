'use strict';

const expect = require('expect.js');

const ROAClient = require('../lib/roa');

describe('roa request', function () {
  var client = new ROAClient({
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    endpoint: 'http://ros.aliyuncs.com:80',
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

describe('nlp', function () {
  var client = new ROAClient({
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    endpoint: 'http://nlp.cn-shanghai.aliyuncs.com',
    apiVersion: '2018-04-08',
  });

  it('translate should ok', async function () {
    const params = {
      q: '你好',
      source: 'zh',
      target: 'en',
      format: 'text',
    };

    const res = await client.request(
      'POST',
      '/nlp/api/translate/standard',
      {},
      JSON.stringify(params),
      { 'Content-Type': 'application/json' }
    );

    expect(res).to.be.ok();
    expect(res.data).to.be.ok();
  });
});
