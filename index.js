'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const callApis = require('./callApis');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  let messageObj;
  let replyToken;
  let jsonFile;
  let opts;
  let req;
  let data;
  let replyData;

  let lon = 140.08531;
  let lat = 36.103543;


  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  console.log(event.source.userId);


  // create a echoing text message
  const echo = {
    type: 'text',
    text: '入力された地点の標高を取得中・・・・。'
  };

  noticeInfo(event.source.userId, event.message.text);

  // jsonFile = require("./dialogue.json");
  // messageObj = getMessageObj(event, jsonFile);
  // console.log(messageObj);

  return client.replyMessage(event.replyToken, echo);

  // use reply API
  // return client.replyMessage(event.replyToken, messageObj);
}

// listen on port
const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});


function noticeInfo(userId, address) {
  callApis.main(address).then(function (value) {
    // sendMessage(userId, '指定された場所の標高は、' + value.lat + 'です。\n 経度は、' + value.lng + 'です。')
    // sendMessage(userId, '指定された場所の経度は、' + value.lng + 'です。')
    sendLocation(userId, address, value);
    sendMessage(userId, '指定された場所の標高は、' + value.elv + 'メートルです。\n\n(その他の情報)\n緯度：' + value.lat + '\n経度：' + value.lng + '\n測定方法：' + value.elvSrs);
  });

}


// function getEchoMap(lon, lat) {
//   let res = {
//     type: "location",
//     title: "東京スカイツリー",
//     address: "〒131-0045 東京都墨田区押上１丁目１−２",
//     latitude: lat,
//     longitude: lon
//   }
//   return res;

// }


function sendMessage(userId, txt) {
  client.pushMessage(userId, {
    type: 'text',
    text: txt
  });
}

function sendLocation(userId, name, value) {
  client.pushMessage(userId, {
    type: "location",
    title: name,
    address: value.address,
    latitude: value.lat,
    longitude: value.lng
  });
}




/**
 * 入力されたデータに応じて、返すメッセージを生成する関数
 * @param {} data 入力されたデータ
 * @param {} jsonFile 外部ファイルから読み込んだJSON形式のデータ
 * @return メッセージオブジェクト
 */
let getMessageObj = (data, jsonFile) => {
  switch (data.type) {
    case 'message':
      console.log('メッセージの場合');
      if (data.message.type != 'text') {
        // テキストメッセージ以外の場合
        console.log('テキスト以外のメッセージが入力された');
        return jsonFile.otherType;
      } else {
        // テキストメッセージの場合、入力された文字列に応じて分岐
        if (data.message.text == '住所') {
          return jsonFile.dialogue2;
        } else {
          return jsonFile.dialogue1;
        }
      }
    case 'postback':
      console.log('postbackの場合');
      return jsonFile[data.postback.data];
    default:
      console.log('それ以外の場合');
      console.log(data);
      return jsonFile.otherType;
  }
};