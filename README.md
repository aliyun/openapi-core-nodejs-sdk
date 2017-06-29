# @alicloud/pop-core

The core SDK of POP API.

## Installation

Install it and write into package.json dependences.

```sh
$ npm install @alicloud/pop-core -S
```

## Prerequisite

Node.js >= 6.x

## Usage

The RPC style client:

```js
var RPCClient = require('@alicloud/pop-core').RPCClient;

var client = new RPCClient({
  accessKeyId: '<accessKeyId>',
  secretAccessKey: '<secretAccessKey>',
  endpoint: '<endpoint>',
  apiVersion: '<apiVersion>'
});

// => returns Promise
client.request(action, params);
// co/yield, async/await
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
