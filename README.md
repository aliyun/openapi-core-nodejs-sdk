

module.exports = function (endpoint, apiVersion, action, params, accessKeyId, secretAccessKey) {
  var client = new Core({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    endpoint: endpoint,
    apiVersion: apiVersion
  });

  return client.request(action, params);
};
