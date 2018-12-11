'use strict';

const expect = require('expect.js');
const RPCClient = require('../lib/rpc');

describe('rpc core', function() {
  it('should pass into "config"', function() {
    expect(function () {
      new RPCClient();
    }).to.throwException(/must pass "config"/);
  });

  it('should pass into "config.endpoint"', function() {
    expect(function () {
      new RPCClient({});
    }).to.throwException(/must pass "config\.endpoint"/);
  });

  it('should pass into valid "config.endpoint"', function() {
    expect(function () {
      new RPCClient({
        endpoint: 'ecs.aliyuncs.com/'
      });
    }).to.throwException(/"config\.endpoint" must starts with 'https:\/\/' or 'http:\/\/'\./);
  });

  it('should pass into "config.apiVersion"', function() {
    expect(function () {
      new RPCClient({
        endpoint: 'http://ecs.aliyuncs.com/'
      });
    }).to.throwException(/must pass "config\.apiVersion"/);
  });

  it('should pass into "config.accessKeyId"', function() {
    expect(function () {
      new RPCClient({
        endpoint: 'http://ecs.aliyuncs.com/',
        apiVersion: '1.0'
      });
    }).to.throwException(/must pass "config\.accessKeyId"/);
  });

  it('should pass into "config.accessKeySecret"', function() {
    expect(function () {
      new RPCClient({
        endpoint: 'http://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId'
      });
    }).to.throwException(/must pass "config\.accessKeySecret"/);
  });

  describe('request', function() {
    var client = new RPCClient({
      accessKeyId: process.env.ACCESS_KEY_ID,
      accessKeySecret: process.env.ACCESS_KEY_SECRET,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    });

    it('should ok', async function() {
      var params = {
        key: ['1', '2', '3', '4', '5', '6', '7', '8', '9',
          '10', '11']
      };

      var requestOption = {
        method: 'POST'
      };

      const result = await client.request('DescribeRegions', params, requestOption);
      expect(result).to.have.key('RequestId');
      expect(result).to.have.key('Regions');
    });

    it('should ok with repeat list less 10 item', async function() {
      var params = {
        key: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
      };

      var requestOption = {
        method: 'POST'
      };

      const result = await client.request('DescribeRegions', params, requestOption);
      expect(result).to.have.key('RequestId');
      expect(result).to.have.key('Regions');
    });
  });
});
