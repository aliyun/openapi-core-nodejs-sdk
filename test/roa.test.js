'use strict';

const expect = require('expect.js');
const rewire = require('rewire');

const ROAClient = require('../lib/roa');

describe('roa core', function() {
  describe('ROAClient', function () {
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
  });

  describe('RPC private methods', function () {
    const roa = rewire('../lib/roa');

    it('filter should ok', function () {
      const filter = roa.__get__('filter');
      expect(filter('hello')).to.be('hello');
      expect(filter('he\t\tllo')).to.be('he  llo');
      expect(filter('he\n\nllo')).to.be('he  llo');
      expect(filter('he\r\rllo')).to.be('he  llo');
      expect(filter('he\f\fllo')).to.be('he  llo');
    });

    it('parseXML should ok', async function () {
      const parseXML = roa.__get__('parseXML');
      try {
        await parseXML('<>');
      } catch (ex) {
        expect(ex).to.be.ok();
        expect(ex.message).to.be('Unencoded <\nLine: 0\nColumn: 2\nChar: >');
        return;
      }
      // never run
      expect(false).to.be.ok();
    });

    it('parseXML should ok', async function () {
      const parseXML = roa.__get__('parseXML');
      const result = await parseXML(`<note>
<to>George</to>
<from>John</from>
<heading>Reminder</heading>
<body>Don't forget the meeting!</body>
</note>`);
      expect(result).to.be.eql({
        'note': {
          'body': [
            "Don't forget the meeting!"
          ],
          'from': [
            'John'
          ],
          'heading': [
            'Reminder'
          ],
          'to': [
            'George'
          ]
        }
      });
    });
  });
});
