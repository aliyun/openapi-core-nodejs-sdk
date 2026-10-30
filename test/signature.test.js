'use strict';

const assert = require('assert');
const crypto = require('crypto');
const querystring = require('querystring');
const httpx = require('httpx');
const muk = require('muk');
const RPCClient = require('../lib/rpc');
const ROAClient = require('../lib/roa');

function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, function (character) {
    return '%' + character.charCodeAt(0).toString(16).toUpperCase();
  });
}

function config(credentials, provider, signatureMethod) {
  const result = {
    endpoint: 'https://example.test',
    apiVersion: '2015-12-15'
  };
  if (provider) {
    result.credentialsProvider = { getCredentials: async () => credentials };
  } else {
    Object.assign(result, credentials);
  }
  if (signatureMethod !== undefined) {
    result.signatureMethod = signatureMethod;
  }
  return result;
}

function mockRequest(check) {
  muk(httpx, 'request', async function (url, options) {
    check(url, options);
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      req: { getHeaders: () => options.headers }
    };
  });
  muk(httpx, 'read', async () => '{}');
}

describe('Signature V2', function () {
  const selections = [
    [undefined, undefined, 'HMAC-SHA256'],
    ['HMAC-SHA256', undefined, 'HMAC-SHA256'],
    ['HMAC-SHA1', undefined, 'HMAC-SHA1'],
    [undefined, 'HMAC-SHA1', 'HMAC-SHA1'],
    ['HMAC-SHA1', 'HMAC-SHA256', 'HMAC-SHA256']
  ];

  for (const method of ['GET', 'POST']) {
    for (const provider of [false, true]) {
      for (const sts of [false, true]) {
        for (const [configured, override, selected] of selections) {
          const label = `${method} provider=${provider} sts=${sts} config=${configured} override=${override}`;
          const credentials = { accessKeyId: 'test-key', accessKeySecret: 'test-secret' };
          if (sts) {
            credentials.securityToken = 'test-token+/=';
          }
          const algorithm = selected === 'HMAC-SHA1' ? 'sha1' : 'sha256';

          it(`RPC ${label}`, async function () {
            const client = new RPCClient(config(credentials, provider, configured));
            mockRequest(function (url, options) {
              const parameters = querystring.parse(method === 'POST' ? options.data : url.split('?')[1]);
              assert.strictEqual(parameters.SignatureMethod, selected);
              assert.strictEqual(parameters.SignatureVersion, '1.0');
              assert.strictEqual(parameters.AccessKeyId, credentials.accessKeyId);
              assert.strictEqual(parameters.SecurityToken, credentials.securityToken);
              assert.strictEqual(parameters.Value, '中文 +/~*');
              const signature = parameters.Signature;
              delete parameters.Signature;
              const canonical = Object.keys(parameters).sort().map(key =>
                encode(key) + '=' + encode(parameters[key])).join('&');
              const stringToSign = method + '&%2F&' + encode(canonical);
              assert.strictEqual(signature, crypto.createHmac(algorithm, 'test-secret&')
                .update(stringToSign).digest('base64'));
            });
            const parameters = { Value: '中文 +/~*' };
            if (override) {
              parameters.SignatureMethod = override;
            }
            try {
              await client.request('DescribeClustersForRegion', parameters, { method });
            } finally {
              muk.restore();
              client.keepAliveAgent.destroy();
            }
          });

          it(`ROA ${label}`, async function () {
            const client = new ROAClient(config(credentials, provider, configured));
            const query = { z: '中文 +/~*', a: 'first' };
            mockRequest(function (url, options) {
              const headers = options.headers;
              assert.strictEqual(headers['x-acs-signature-method'], selected);
              assert.strictEqual(headers['x-acs-signature-version'], '1.0');
              assert.strictEqual(headers['x-acs-security-token'], credentials.securityToken);
              const canonicalHeaders = Object.keys(headers).filter(key => key.startsWith('x-acs-'))
                .sort().map(key => key + ':' + headers[key] + '\n').join('');
              const canonicalResource = '/regions/cn-hangzhou/clusters?a=first&z=' + query.z;
              const stringToSign = [method, headers.accept, headers['content-md5'],
                headers['content-type'] || '', headers.date, ''].join('\n')
                + canonicalHeaders + canonicalResource;
              assert.strictEqual(headers.authorization, 'acs test-key:'
                + crypto.createHmac(algorithm, 'test-secret').update(stringToSign).digest('base64'));
            });
            const headers = override ? { 'X-Acs-Signature-Method': override } : {};
            try {
              await client.request(method, '/regions/cn-hangzhou/clusters', query, '中文 +/~*', headers);
            } finally {
              muk.restore();
              client.keepAliveAgent.destroy();
            }
          });
        }
      }
    }
  }

  for (const Client of [RPCClient, ROAClient]) {
    it(`${Client.name} rejects an unsupported configured algorithm`, function () {
      assert.throws(() => new Client(config({ accessKeyId: 'key', accessKeySecret: 'secret' }, false,
        'HMAC-SHA512')), /signatureMethod must be HMAC-SHA1 or HMAC-SHA256/);
    });
  }

  for (const signatureMethod of ['HMAC-SHA256', 'HMAC-SHA1']) {
    it(`legacy helpers use ${signatureMethod}`, function () {
      const credentials = { accessKeyId: 'key', accessKeySecret: 'secret' };
      const rpc = new RPCClient(config(credentials, false, signatureMethod));
      const roa = new ROAClient(config(credentials, false, signatureMethod));
      try {
        assert.strictEqual(rpc._buildParams().SignatureMethod, signatureMethod);
        assert.strictEqual(roa.buildHeaders()['x-acs-signature-method'], signatureMethod);
        const signature = crypto.createHmac(signatureMethod === 'HMAC-SHA1' ? 'sha1' : 'sha256', 'secret')
          .update('stringtosign').digest('base64');
        assert.strictEqual(roa.signature('stringtosign'), signature);
        assert.strictEqual(roa.buildAuthorization('stringtosign'), 'acs key:' + signature);
      } finally {
        rpc.keepAliveAgent.destroy();
        roa.keepAliveAgent.destroy();
      }
    });
  }
});
