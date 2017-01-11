# @alicloud/pop-core

The core SDK of POP API.

## Installation

Install it and write into package.json dependences.

```sh
$ npm install @alicloud/pop-core -S
```

## Usage

```js
module.exports = function (endpoint, apiVersion, action, params, accessKeyId, secretAccessKey) {
  var client = new Core({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    endpoint: endpoint,
    apiVersion: apiVersion
  });

  return client.request(action, params);
};
```

## License
The MIT License
