'use strict';

const expect = require('expect.js');
const ROAClient = require('../lib/roa');

describe('roa core', function() {
  it('should pass into "config"', function() {
    expect(function () {
      new ROAClient();
    }).to.throwException(/must pass "config"/);
  });

  it('should pass into "config.endpoint"', function() {
    expect(function () {
      new ROAClient({});
    }).to.throwException(/must pass "config\.endpoint"/);
  });

  it('should pass into valid "config.endpoint"', function() {
    expect(function () {
      new ROAClient({
        endpoint: 'ecs.aliyuncs.com/'
      });
    }).to.throwException(/"config\.endpoint" must starts with 'https:\/\/' or 'http:\/\/'\./);
  });

  it('should pass into "config.apiVersion"', function() {
    expect(function () {
      new ROAClient({
        endpoint: 'http://ecs.aliyuncs.com/'
      });
    }).to.throwException(/must pass "config\.apiVersion"/);
  });

  it('should pass into "config.accessKeyId"', function() {
    expect(function () {
      new ROAClient({
        endpoint: 'http://ecs.aliyuncs.com/',
        apiVersion: '1.0'
      });
    }).to.throwException(/must pass "config\.accessKeyId"/);
  });

  it('should pass into "config.accessKeySecret"', function() {
    expect(function () {
      new ROAClient({
        endpoint: 'http://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId'
      });
    }).to.throwException(/must pass "config\.accessKeySecret"/);
  });

  describe('request', function () {
    var client = new ROAClient({
      accessKeyId: process.env.ACCESS_KEY_ID,
      accessKeySecret: process.env.ACCESS_KEY_SECRET,
      endpoint: 'http://ros.aliyuncs.com',
      apiVersion: '2015-09-01'
    });

    it('request', function* () {
      var result = yield client.request('GET', '/regions');
      expect(result).to.have.property('Regions');
    });

    it('get should ok', function* () {
      var result = yield client.get('/regions');
      expect(result).to.have.property('Regions');
    });

    it('get raw body should ok', function* () {
      var opts = {rawBody: true};
      var result = yield client.get('/regions', {}, {}, opts);
      expect(result).to.be.a('string');
    });
  });
});
