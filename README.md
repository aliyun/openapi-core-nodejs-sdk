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

```js
var Core = require('@alicloud/pop-core');

var client = new Core({
  accessKeyId: '<accessKeyId>',
  secretAccessKey: '<secretAccessKey>',
  endpoint: '<endpoint>',
  apiVersion: '<apiVersion>'
});

// => returns Promise
client.request(action, params);
// co/yield, async/await
```

## License
The MIT License
