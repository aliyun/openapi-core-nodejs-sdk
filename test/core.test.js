'use strict';

const expect = require('expect.js');
const Core = require('../lib/core');

describe('core', function() {
  it('should pass into "config"', function() {
    expect(function () {
      new Core();
    }).to.throwException(/must pass "config"/);
  });

  it('should pass into "config.endpoint"', function() {
    expect(function () {
      new Core({});
    }).to.throwException(/must pass "config\.endpoint"/);
  });

  it('should pass into "config.apiVersion"', function() {
    expect(function () {
      new Core({
        endpoint: 'http://ecs.aliyuncs.com/'
      });
    }).to.throwException(/must pass "config\.apiVersion"/);
  });

  it('should pass into "config.accessKeyId"', function() {
    expect(function () {
      new Core({
        endpoint: 'http://ecs.aliyuncs.com/',
        apiVersion: '1.0'
      });
    }).to.throwException(/must pass "config\.accessKeyId"/);
  });

  it('should pass into "config.secretAccessKey"', function() {
    expect(function () {
      new Core({
        endpoint: 'http://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId'
      });
    }).to.throwException(/must pass "config\.secretAccessKey"/);
  });
});
