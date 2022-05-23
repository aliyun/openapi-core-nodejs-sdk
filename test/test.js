'use strict';

const Core = require('../lib/rpc');

let UserPanes = [
  {
    Texts: [
      {
        FontType: 0,
        FontColor: 255,
        Y: 0,
        Text: '桌面标识',
        ZOrder: 0,
        X: 0,
        FontSize: 50
      }
    ],
    SourceType: 'shareScreen',
    PaneId: 0,
    UserId: this.userId
  }
];
let UserList = ['d006f335-4647-4dca-b4a1-8851b13ad3f0'];
let params = {
  'TaskId': this.TaskId,
  'AppId': this.AppId,
  'ChannelId': 'ChannelId',
  'TemplateId': this.TemplateId,
  'UserPanes': UserPanes,
  'LayoutIds': [
    6
  ],
  'MixMode': 1,
  'TaskProfile': '4IN_720P',
  'MediaEncode': 20,
  'CropMode': 1,
  'SubSpecUsers': UserList,
  'SubSpecCameraUsers': UserList,
  'SubSpecShareScreenUsers': UserList
};
let requestOption = {
  method: 'POST',
  formatParams: false
};
var client = new Core({
  accessKeyId: 'config.accessKeyId',
  accessKeySecret: 'config.accessKeySecret',
  // securityToken: '<your-sts-token>', // use STS Token
  endpoint: 'https://rtc.aliyuncs.com',
  apiVersion: '2018-01-11'
});
client.request('StartRecordTask', params, requestOption).then((result) => {
  console.log(JSON.stringify(result));
}, (ex) => {
  console.log(ex);
});