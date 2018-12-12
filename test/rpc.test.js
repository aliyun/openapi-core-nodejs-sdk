'use strict';

const expect = require('expect.js');
const rewire = require('rewire');

const RPCClient = require('../lib/rpc');

describe('rpc core', function() {
  describe('RPCClient', function() {
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
  });

  describe('RPC private methods', function () {
    const rpc = rewire('../lib/rpc');

    it('firstLetterUpper should ok', function () {
      const firstLetterUpper = rpc.__get__('firstLetterUpper');
      expect(firstLetterUpper('hello')).to.be('Hello');
    });

    it('formatParams should ok', function () {
      const formatParams = rpc.__get__('formatParams');
      expect(formatParams({'hello': 'world'})).to.be.eql({
        Hello: 'world'
      });
    });

    it('timestamp should ok', function () {
      const timestamp = rpc.__get__('timestamp');
      expect(timestamp()).to.be.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    });

    it('encode should ok', function () {
      const encode = rpc.__get__('encode');
      expect(encode('str')).to.be('str');
      expect(encode('str\'str')).to.be('str%27str');
      expect(encode('str(str')).to.be('str%28str');
      expect(encode('str)str')).to.be('str%29str');
      expect(encode('str*str')).to.be('str%2Astr');
    });

    it('replaceRepeatList should ok', function () {
      const replaceRepeatList = rpc.__get__('replaceRepeatList');
      function helper(target, key, repeat) {
        replaceRepeatList(target, key, repeat);
        return target;
      }
      expect(helper({}, 'key', [])).to.be.eql({});
      expect(helper({}, 'key', ['value'])).to.be.eql({
        'key.1': 'value'
      });
      expect(helper({}, 'key', [{
        Domain: '1.com'
      }])).to.be.eql({
        'key.1.Domain': '1.com'
      });
    });

    it('flatParams should ok', function () {
      const flatParams = rpc.__get__('flatParams');
      expect(flatParams({})).to.be.eql({});
      expect(flatParams({key: ['value']})).to.be.eql({
        'key.1': 'value'
      });
      expect(flatParams({
        'key': 'value'
      })).to.be.eql({
        'key': 'value'
      });
      expect(flatParams({
        key: [
          {
            Domain: '1.com'
          }
        ]
      })).to.be.eql({
        'key.1.Domain': '1.com'
      });
    });

    it('normalize should ok', function () {
      const normalize = rpc.__get__('normalize');
      expect(normalize({})).to.be.eql([]);
      expect(normalize({key: ['value']})).to.be.eql([
        ['key.1', 'value']
      ]);
      expect(normalize({
        'key': 'value'
      })).to.be.eql([
        ['key', 'value']
      ]);
      expect(normalize({
        key: [
          {
            Domain: '1.com'
          }
        ]
      })).to.be.eql([
        ['key.1.Domain', '1.com']
      ]);
      expect(normalize({
        'a': 'value',
        'c': 'value',
        'b': 'value'
      })).to.be.eql([
        ['a', 'value'],
        ['b', 'value'],
        ['c', 'value']
      ]);
    });

    it('canonicalize should ok', function () {
      const canonicalize = rpc.__get__('canonicalize');
      expect(canonicalize([])).to.be('');
      expect(canonicalize([
        ['key.1', 'value']
      ])).to.be('key.1=value');
      expect(canonicalize([
        ['key', 'value']
      ])).to.be('key=value');
      expect(canonicalize([
        ['key.1.Domain', '1.com']
      ])).to.be('key.1.Domain=1.com');
      expect(canonicalize([
        ['a', 'value'],
        ['b', 'value'],
        ['c', 'value']
      ])).to.be('a=value&b=value&c=value');
    });

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
