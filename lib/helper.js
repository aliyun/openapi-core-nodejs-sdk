'use strict';

const os = require('os');
const util = require('util');
const assert = require('assert');
const pkg = require('../package.json');

var ALICLOUD_ENDPOINT = 'ALICLOUD_ENDPOINT';
var ALICLOUD_API_VERSION = 'ALICLOUD_API_VERSION';
var ALICLOUD_ACCESS_KEY_ID = 'ALICLOUD_ACCESS_KEY_ID';
var ALICLOUD_ACCESS_KEY_SECRET = 'ALICLOUD_ACCESS_KEY_SECRET';

function _formEnvVariables(){
  var envVariables =  {};
  envVariables[ALICLOUD_ENDPOINT] = 'endpoint';
  envVariables[ALICLOUD_API_VERSION] = 'apiVersion';
  envVariables[ALICLOUD_ACCESS_KEY_ID] = 'accessKeyId';
  envVariables[ALICLOUD_ACCESS_KEY_SECRET] = 'accessKeySecret';
  return envVariables;
}

const ENV_VARIABLES = _formEnvVariables();
const ASSERT_WARNING = '%s must be configured';

function _combindConfigValues(envConfig, config){
  if(!config){
    return envConfig;
  }
  let toBeCombinedValues = Object.values(ENV_VARIABLES);
  toBeCombinedValues.forEach(function(key) {
    if(envConfig && envConfig[key]){
      config[key] = envConfig[key];
    }
  });
  return config;
}

function  _getConfigFromEnv() {
  var config = {};
  Object.keys(ENV_VARIABLES).forEach(
    key => {
      if(process.env[key]){
        config[ENV_VARIABLES[key]] = process.env[key];
      }
    }
  );
  if(Object.keys(config).length === 0){
    return undefined;
  }
  return config;
}

function formatConfig(config){
  config = _combindConfigValues(_getConfigFromEnv(), config);
  assert(config, util.format(ASSERT_WARNING, '"config"'));
  assert(config.endpoint, util.format(ASSERT_WARNING, '"config.endpoint"'));
  if (!config.endpoint.startsWith('https://') &&
    !config.endpoint.startsWith('http://')) {
    throw new Error(`"config.endpoint" must starts with 'https://' or 'http://'.`);
  }
  assert(config.apiVersion, util.format(ASSERT_WARNING, '"config.apiVersion"'));
  assert(config.accessKeyId, util.format(ASSERT_WARNING, '"config.accessKeyId"'));
  config.accessKeySecret = config.secretAccessKey || config.accessKeySecret;
  assert(config.accessKeySecret, util.format(ASSERT_WARNING, '"config.accessKeySecret"'));

  return config;
}


exports.DEFAULT_UA = `AlibabaCloud (${os.platform()}; ${os.arch()}) ` +
  `Node.js/${process.version} Core/${pkg.version}`;
exports.formatConfig = formatConfig;
exports.ASSERT_WARNING = ASSERT_WARNING;
exports.ENV_VARIABLES = ENV_VARIABLES;
exports.DEFAULT_CLIENT = `Node.js(${process.version}), ${pkg.name}: ${pkg.version}`;
