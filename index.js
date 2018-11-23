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

  if (event.type !== 'message') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  console.log('userId:' + event.source.userId);
  console.log('inputMsg:' + event.message.text);


  if (event.message.type === 'text') {

    excecByMsg(event);

  }

  if (event.message.type === 'location') {

    excecByLoc(event);

  }

}

/**
 * メッセージを受信したときの処理
 * @param {*} event 
 */
function excecByMsg(event) {
  // create a echoing text message
  const echo = {
    type: 'text',
    text: '入力された地点の標高を取得中・・・・。'
  };

  callApis.getLocByAddress(event.message.text).then(function (value) {
    sendLocation(event.source.userId, event.message.text, value);
    sendMessage(event.source.userId, '指定された場所の標高は、' + value.elv + 'メートルです。\n\n(その他の情報)\n緯度：' + value.lat + '\n経度：' + value.lng + '\n測定方法：' + value.elvSrs);
  });

  return client.replyMessage(event.replyToken, echo);

}

/**
 * Locationが送られてきた場合の処理
 * @param {*} event 
 */
function excecByLoc(event) {
  callApis.getEleveByLatLng(event.message.latitude, event.message.longitude).then(function (value) {
    sendMessage(event.source.userId, '指定された場所の標高は、' + value.elv + 'メートルです。\n\n(その他の情報)\n緯度：' + value.lat + '\n経度：' + value.lng + '\n測定方法：' + value.elvSrs);
  });

  const echo = {
    type: 'text',
    text: '送信された地点の標高を取得中・・・・。'
  };

  return client.replyMessage(event.replyToken, echo);

}

// listen on port
const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});


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