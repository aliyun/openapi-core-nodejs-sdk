'use strict';

const expect = require('expect.js');
const util = require('util');

const RPCClient = require('../lib/rpc');
const ASSERT_WARNING = require('../lib/helper').ASSERT_WARNING;
const ENV_VARIABLES = require('../lib/helper').ENV_VARIABLES;

function removeEnvValues(){
  Object.keys(ENV_VARIABLES).forEach(
    envValue => {
      delete process.env[envValue];
    });
}

describe('helper', function() {
  removeEnvValues();
  describe('RPCClient config', function() {
    it('should pass into "config"', function() {
      expect(function () {
        new RPCClient();
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config"')));
    });

    it('should pass into "config.endpoint"', function() {
      expect(function () {
        new RPCClient({});
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config.endpoint"')));
    });

    it('should overwrite "config.endpoint"', function() {
      process.env['ALICLOUD_ENDPOINT'] = 'http://ecs.aliyuncs.com/';
      expect(function () {
        new RPCClient();
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config.apiVersion"')));
      //cleanup
      removeEnvValues();
    });

    it('should pass into valid "config.endpoint"', function() {
      expect(function () {
        new RPCClient({
          endpoint: 'ecs.aliyuncs.com/'
        });
      }).to.throwException(/"config\.endpoint" must starts with 'https:\/\/' or 'http:\/\/'\./);
    });

    it('should also overwrite "config.endpoint"', function() {
      process.env['ALICLOUD_ENDPOINT'] = 'http://ecs.aliyuncs.com/';
      expect(function () {
        new RPCClient({
          endpoint: 'ecs.aliyuncs.com/'
        });
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config.apiVersion"')));
      //cleanup
      removeEnvValues();
    });

    it('should pass into "config.apiVersion"', function() {
      expect(function () {
        new RPCClient({
          endpoint: 'http://ecs.aliyuncs.com/'
        });
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config.apiVersion"')));
    });

    it('should overwrite "config.apiVersion"', function() {
      process.env['ALICLOUD_API_VERSION'] = '1.0';
      expect(function () {
        new RPCClient({
          endpoint: 'http://ecs.aliyuncs.com/'
        });
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config.accessKeyId"')));
      //cleanup
      removeEnvValues();
    });

    it('should pass into "config.accessKeyId"', function() {
      expect(function () {
        new RPCClient({
          endpoint: 'http://ecs.aliyuncs.com/',
          apiVersion: '1.0'
        });
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config.accessKeyId"')));
    });

    it('should pass into "config.accessKeySecret"', function() {
      expect(function () {
        new RPCClient({
          endpoint: 'http://ecs.aliyuncs.com/',
          apiVersion: '1.0',
          accessKeyId: 'accessKeyId'
        });
      }).to.throwException(new RegExp(util.format(ASSERT_WARNING, '"config.accessKeySecret"')));
    });

    it('should ok with http endpoint', function() {
      process.env['ALICLOUD_API_VERSION'] = '2.0';
      const client = new RPCClient({
        endpoint: 'http://ecs.aliyuncs.com',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret'
      });
      expect(client.apiVersion).to.be(process.env['ALICLOUD_API_VERSION']);
      expect(client.endpoint).to.be('http://ecs.aliyuncs.com');
      expect(client.keepAliveAgent.protocol).to.be('http:');
      //cleanup
      removeEnvValues();
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

    it('should fail because overritten with wrong endpoint', function() {
      process.env['ALICLOUD_ENDPOINT'] = 'ecs.aliyuncs.com/';
      expect(function () {
        new RPCClient({
          endpoint: 'http://ecs.aliyuncs.com/',
          apiVersion: '1.0',
          accessKeyId: 'accessKeyId',
          accessKeySecret: 'accessKeySecret'
        });
      }).to.throwException(/"config\.endpoint" must starts with 'https:\/\/' or 'http:\/\/'\./);
      //cleanup
      removeEnvValues();
    });
  });
});