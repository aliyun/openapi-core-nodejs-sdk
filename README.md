# @alicloud/pop-core

The core SDK of POP API.

## Installation

Install it and write into package.json dependences.

```sh
$ npm install @alicloud/pop-core -S
```

## Prerequisite

Node.js >= 6.x

### Notes

You must know your `AK`(`accessKeyId/accessKeySecret`), and the cloud product's `endpoint` and `apiVersion`.

For example, The ECS OpenAPI(https://help.aliyun.com/document_detail/25490.html), the API version is `2014-05-26`.

And the endpoint list can be found at [here](https://help.aliyun.com/document_detail/25489.html), the center endpoint is ecs.aliyuncs.com. Add http protocol `http` or `https`, should be `http://ecs.aliyuncs.com/`.

## Usage

The RPC style client:

```js
var RPCClient = require('@alicloud/pop-core').RPCClient;

var client = new RPCClient({
  accessKeyId: '<accessKeyId>',
  accessKeySecret: '<accessKeySecret>',
  endpoint: '<endpoint>',
  apiVersion: '<apiVersion>'
});

// => returns Promise
client.request(action, params);
// co/yield, async/await

// options
client.request(action, params, {
  timeout: 3000, // default 3000 ms
  formatAction: true, // default true, format the action to Action
  formatParams: true, // default true, format the parameter name to first letter upper case
  method: 'GET', // set the http method, default is GET
  headers: {}, // set the http request headers
});
```

The ROA style client:

```js
var ROAClient = require('@alicloud/pop-core').ROAClient;

var client = new ROAClient({
  accessKeyId: '<accessKeyId>',
  accessKeySecret: '<secretAccessKey>',
  endpoint: '<endpoint>',
  apiVersion: '<apiVersion>'
});

// => returns Promise
// request(HTTPMethod, uriPath, queries, body, headers, options);
// options => {timeout}
client.request('GET', '/regions');
// co/yield, async/await
```

## License
The MIT License
