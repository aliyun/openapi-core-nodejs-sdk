'use strict';

const expect = require('expect.js');

const RPCClient = require('../lib/rpc');

describe('rpc request', function() {
  var client = new RPCClient({
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    endpoint: 'https://ecs.aliyuncs.com',
    apiVersion: '2014-05-26'
  });

  it('should ok', async function() {
    this.timeout(15000);

    var params = {
      key: ['1', '2', '3', '4', '5', '6', '7', '8', '9',
        '10', '11']
    };

    var requestOption = {
      method: 'POST',
      timeout: 15000
    };

    const result = await client.request('DescribeRegions', params, requestOption);
    expect(result).to.have.key('RequestId');
    expect(result).to.have.key('Regions');
  });

  it('should ok with repeat list less 10 item', async function() {
    this.timeout(15000);

    var params = {
      key: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    };

    var requestOption = {
      method: 'POST',
      timeout: 15000
    };

    const result = await client.request('DescribeRegions', params, requestOption);
    expect(result).to.have.key('RequestId');
    expect(result).to.have.key('Regions');
  });
});
