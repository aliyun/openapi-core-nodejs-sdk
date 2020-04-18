'use strict';

const expect = require('expect.js');
const rewire = require('rewire');
const httpx = require('httpx');
const muk = require('muk');

const ROAClient = require('../lib/roa');

describe('roa core', function() {

  it('buildHeaders should ok', function () {
    const client = new ROAClient({
      endpoint: 'https://ecs.aliyuncs.com/',
      apiVersion: '1.0',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
    });
    const headers = client.buildHeaders();
    expect(headers).to.only.have.keys('accept', 'date', 'host',
      'x-acs-signature-nonce', 'x-acs-signature-method',
      'x-acs-signature-version', 'x-acs-version', 'x-sdk-client',
      'user-agent');
    expect(headers).to.have.property('accept', 'application/json');
    expect(headers.date).to.match(/[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT/);
    expect(headers).to.have.property('host', 'ecs.aliyuncs.com');
    expect(headers['user-agent'].startsWith('AlibabaCloud')).to.be.ok();
  });

  it('buildHeaders should ok with securityToken', function () {
    const client = new ROAClient({
      endpoint: 'https://ecs.aliyuncs.com/',
      apiVersion: '1.0',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      securityToken: 'securityToken'
    });
    const headers = client.buildHeaders();
    expect(headers).to.only.have.keys('accept', 'date', 'host',
      'x-acs-signature-nonce', 'x-acs-signature-method',
      'x-acs-signature-version', 'x-acs-version', 'x-sdk-client',
      'x-acs-accesskey-id', 'x-acs-security-token', 'user-agent');
    expect(headers).to.have.property('accept', 'application/json');
    expect(headers.date).to.match(/[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT/);
    expect(headers).to.have.property('host', 'ecs.aliyuncs.com');
    expect(headers['user-agent'].startsWith('AlibabaCloud')).to.be.ok();
  });

  it('signature should ok', function () {
    const client = new ROAClient({
      endpoint: 'https://ecs.aliyuncs.com/',
      apiVersion: '1.0',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      securityToken: 'securityToken'
    });
    const sign = client.signature('stringtosign');
    expect(sign).to.be('9/j11e+L9jW8mC9eUA23Wn3c0fs=');
  });

  it('buildAuthorization should ok', function () {
    const client = new ROAClient({
      endpoint: 'https://ecs.aliyuncs.com/',
      apiVersion: '1.0',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      securityToken: 'securityToken'
    });
    const auth = client.buildAuthorization('stringtosign');
    expect(auth).to.be('acs accessKeyId:9/j11e+L9jW8mC9eUA23Wn3c0fs=');
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

  describe('request with raw body', function () {
    mock('', 'raw body');

    it('request with raw body should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.request('GET', '/', {}, '', {}, {rawBody: true});
      expect(result).to.be('raw body');
    });

    it('get with raw body should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.get('/', {}, {}, {rawBody: true});
      expect(result).to.be('raw body');
    });
  });

  describe('request with json response should ok', function () {
    mock({
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      }
    }, JSON.stringify({'ok': true}));

    it('json response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.request('GET', '/');
      expect(result).to.be.eql({
        ok: true
      });
    });
  });

  describe('request(204) with json response should ok', function () {
    mock({
      statusCode: 204,
      headers: {
        'content-type': 'application/json'
      }
    }, '');

    it('json response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.request('GET', '/');
      expect(result).to.be('');
    });
  });

  describe('request(400) with json response should ok', function () {
    mock({
      statusCode: 400,
      headers: {
        'content-type': 'application/json'
      }
    }, JSON.stringify({
      'Message': 'error message',
      'RequestId': 'requestid',
      'Code': 'errorcode'
    }));

    it('json response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      try {
        await client.request('GET', '/');
      } catch (ex) {
        expect(ex.message).to.be('code: 400, error message, requestid: requestid');
        expect(ex.name).to.be('errorcodeError');
        expect(ex.statusCode).to.be(400);
        expect(ex.code).to.be('errorcode');
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });
  });

  describe('request(400) with json response and errorMsg should ok', function () {
    mock({
      statusCode: 400,
      headers: {
        'content-type': 'application/json'
      }
    }, JSON.stringify({
      'errorMsg': 'RAM/STS verification error',
      'errorCode': 10007
    }));

    it('json response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      try {
        await client.request('GET', '/');
      } catch (ex) {
        expect(ex.message).to.be('code: 400, RAM/STS verification error, requestid: ');
        expect(ex.name).to.be('10007Error');
        expect(ex.statusCode).to.be(400);
        expect(ex.code).to.be(10007);
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });
  });

  describe('request with unexpect json string response should ok', function () {
    mock({
      statusCode: 400,
      headers: {
        'content-type': 'application/json'
      }
    }, '{foo:bar}');

    it('json response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      try {
        await client.request('GET', '/');
      } catch (ex) {
        expect(ex.message).to.be('parse response to json error');
        expect(ex.name).to.be('FormatError');
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });
  });

  describe('request with xml response should ok', function () {
    mock({
      statusCode: 200,
      headers: {
        'content-type': 'text/xml'
      }
    }, `<note>
<to>George</to>
<from>John</from>
<heading>Reminder</heading>
<body>Don't forget the meeting!</body>
</note>`);

    it('json response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.request('GET', '/');
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

  describe('request(400) with xml response should ok', function () {
    mock({
      statusCode: 400,
      headers: {
        'content-type': 'text/xml'
      }
    }, `<Error>
<Message>error message</Message>
<RequestId>requestid</RequestId>
<HostId>hostid</HostId>
<Code>errorcode</Code>
</Error>`);

    it('xml response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      try {
        await client.request('GET', '/');
      } catch (ex) {
        console.log(ex.stack);
        expect(ex.message).to.be('error message hostid: hostid, requestid: requestid');
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });
  });

  describe('request(200) with plain response should ok', function () {
    mock({
      statusCode: 200,
      headers: {}
    }, `plain text`);

    it('plain response should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.request('GET', '/');
      expect(result).to.be('plain text');
    });
  });

  describe('post should ok', function () {
    mock({
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      }
    }, JSON.stringify({'ok': true}));

    it('should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.post('/', {}, 'text', {}, {});
      expect(result).to.be.eql({'ok': true});
    });

    it('should ok with query', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.post('/', {'k': 'v'}, 'text', {}, {});
      expect(result).to.be.eql({'ok': true});
    });
  });

  describe('put should ok', function () {
    mock({
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      }
    }, JSON.stringify({'ok': true}));

    it('should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.put('/', {}, 'text', {}, {});
      expect(result).to.be.eql({'ok': true});
    });
  });

  describe('delete should ok', function () {
    mock({
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      }
    }, JSON.stringify({'ok': true}));

    it('should ok', async function () {
      const client = new ROAClient({
        endpoint: 'https://ecs.aliyuncs.com/',
        apiVersion: '1.0',
        accessKeyId: 'accessKeyId',
        accessKeySecret: 'accessKeySecret',
        securityToken: 'securityToken'
      });
      const result = await client.delete('/', {}, {}, {});
      expect(result).to.be.eql({'ok': true});
    });
  });

  describe('ROA private methods', function () {
    const roa = rewire('../lib/roa');

    it('filter should ok', function () {
      const filter = roa.__get__('filter');
      expect(filter('hello')).to.be('hello');
      expect(filter('he\t\tllo')).to.be('he  llo');
      expect(filter('he\n\nllo')).to.be('he  llo');
      expect(filter('he\r\rllo')).to.be('he  llo');
      expect(filter('he\f\fllo')).to.be('he  llo');
    });

    it('keyLowerify should ok', function () {
      const keyLowerify = roa.__get__('keyLowerify');
      expect(keyLowerify({})).to.be.eql({});
      expect(keyLowerify({'low': 'value'})).to.be.eql({'low': 'value'});
      expect(keyLowerify({'Low': 'value'})).to.be.eql({'low': 'value'});
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

    it('getCanonicalizedHeaders should ok', function () {
      const getCanonicalizedHeaders = roa.__get__('getCanonicalizedHeaders');
      expect(getCanonicalizedHeaders({})).to.be('');
      expect(getCanonicalizedHeaders({key: 'value'})).to.be('');
      expect(getCanonicalizedHeaders({'x-acs-key': 'value'})).to.be('x-acs-key:value\n');
    });

    it('getCanonicalizedResource should ok', function () {
      const getCanonicalizedResource = roa.__get__('getCanonicalizedResource');
      expect(getCanonicalizedResource('/', {})).to.be('/');
      expect(getCanonicalizedResource('/', {key: 'value'})).to.be('/?key=value');
      const q = {key: 'value', 'key1': 'value2'};
      expect(getCanonicalizedResource('/', q)).to.be('/?key=value&key1=value2');
    });

    it('buildStringToSign should ok', function () {
      const buildStringToSign = roa.__get__('buildStringToSign');
      expect(buildStringToSign('GET', '/', {'accept': 'application/json'}, {}))
        .to.be('GET\napplication/json\n\n\n\n/');
      const headers = {
        'accept': 'application/json',
        'content-md5': 'md5',
        'content-type': 'application/json',
        'date': 'date'
      };
      expect(buildStringToSign('GET', '/', headers, {}))
        .to.be('GET\napplication/json\nmd5\napplication/json\ndate\n/');
    });
  });

  describe('ROA private class', function () {
    const roa = rewire('../lib/roa');

    it('ACSError should ok', function () {
      const ACSError = roa.__get__('ACSError');
      const err = new ACSError({
        Message: ['error message'],
        Code: ['errorcode'],
        HostId: ['hostid'],
        RequestId: ['requestid']
      });

      expect(err.message).to.be('error message hostid: hostid, requestid: requestid');
      expect(err.code).to.be('errorcode');
    });
  });
});
