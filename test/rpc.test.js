'use strict';

const expect = require('expect.js');
const rewire = require('rewire');
const httpx = require('httpx');
const muk = require('muk');

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

    it('should ok with http endpoint', function() {
      const client = new RPCClient({
        endpoint: 'http://ecs.aliyuncs.com',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret'
      });
      expect(client.endpoint).to.be('http://ecs.aliyuncs.com');
      expect(client.keepAliveAgent.protocol).to.be('http:');
    });

    it('should ok with https endpoint', function() {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret'
      });
      expect(client.endpoint).to.be('https://ecs.aliyuncs.com');
      expect(client.keepAliveAgent.protocol).to.be('https:');
    });

    it('should ok with codes', function() {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        codes: ['True']
      });
      expect(client.codes.has('True')).to.be.ok();
    });
  });

  describe('_buildParams', function() {
    it('should ok', function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret'
      });
      const defaults = client._buildParams();
      expect(defaults).to.only.have.keys('Format', 'SignatureMethod',
        'SignatureNonce', 'SignatureVersion', 'Timestamp', 'AccessKeyId',
        'Version');
    });

    it('should ok with securityToken', function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const defaults = client._buildParams();
      expect(defaults).to.only.have.keys('Format', 'SignatureMethod',
        'SignatureNonce', 'SignatureVersion', 'Timestamp', 'AccessKeyId',
        'Version', 'SecurityToken');
    });
  });

  function mock(response, body) {
    before(function() {
      muk(httpx, 'request', function(url, opts) {
        return Promise.resolve(response);
      });

      muk(httpx, 'read', function(response, encoding) {
        return Promise.resolve(body);
      });
    });

    after(function () {
      muk.restore();
    });
  }

  describe('request', function () {
    mock({
      req: {
        _headers: {}
      }
    }, '{}');

    it('get with raw body should ok', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
      });
      const result = await client.request('action', {});
      expect(result).to.be.eql({});
    });
  });

  describe('request with post', function () {
    mock({
      req: {
        _headers: {}
      },
      statusCode: 200,
      headers: {}
    }, '{}');

    it('should ok', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
      });
      const result = await client.request('action');
      expect(result).to.be.eql({});
    });

    it('should ok with formatAction', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
      });
      const result = await client.request('action', {}, {
        formatAction: false
      });
      expect(result).to.be.eql({});
    });

    it('should ok with formatParams', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
      });
      const result = await client.request('action', {}, {
        formatParams: false
      });
      expect(result).to.be.eql({});
    });

    it('should ok with formatParams', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
      });
      const result = await client.request('action', {}, {
        agent: new require('https').Agent({
          keepAlive: true,
          keepAliveMsecs: 3000
        })
      });
      expect(result).to.be.eql({});
    });

    it('get with raw body should ok', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
      });
      const result = await client.request('action', {}, {
        method: 'POST'
      });
      expect(result).to.be.eql({});
    });

    it('get with verbose should ok', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret'
      }, true);
      const [json, entry] = await client.request('action', {}, {});
      expect(json).to.be.eql({});
      expect(entry.request).to.be.eql({
        headers: {}
      });
      expect(entry.response).to.be.eql({
        statusCode: 200,
        headers: {}
      });
    });
  });

  describe('request with error', function () {
    mock({
      req: {
        _headers: {}
      }
    }, JSON.stringify({
      Code: '400',
      Message: 'error message'
    }));

    it('request with 400 should ok', async function () {
      const client = new RPCClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
      });
      try {
        await client.request('action', {});
      } catch (ex) {
        expect(ex.message.startsWith('error message, URL: ')).to.be.ok();
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
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
});
