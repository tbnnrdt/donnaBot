'use strict';

const bodyParser = require('body-parser');
const config = require('config');
const express = require('express');
const http = require('http');
const request = require('request');

var app = express();

app.set('port', process.env.PORT || 5555);
app.use(bodyParser.json());

const VALIDATION_TOKEN = "i_love_minions";
const PAGE_ACCESS_TOKEN = "EAAMmr2WJqv4BAMUSpgLvH1yA2CQk5pAaSlnG3BjNPXBtQ2wSjkYh5Ikqq1fcQkTkBZAojH67PXZAd4lZAiFJNk1z7tGVEBDi1BFswP00tfJEtaVWuZBECouRTlo0ZC5TyQauzNUKLxkuZAEOvsblSPTnJxz7utmQ1pMuS3PyO6PQZDZD";

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);
        }else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendTypingMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_on'
  };

  callSendAPI(messageData);
}

function sendHelloMessage(recipientId, messageText) {
  sendTypingMessage(recipientId);
  
  wait(3000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: 'Coucou toi, ca marche bien'
    }
  };

  callSendAPI(messageData);
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageTextSwitch = message.text.toLowerCase();
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageTextSwitch) {
      case /hey|hello|bonjour|salut|yo|coucou/.test(messageTextSwitch) && messageTextSwitch:
        sendHelloMessage(senderID, messageTextSwitch);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'color':
        sendButtonMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageTextSwitch);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
} 

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

function sendButtonMessage(recipientId) {
  var buttonData = {
    recipient: {
      id: recipientId
    },
    message:{
    text:"Pick a color:",
    quick_replies:[
      {
        content_type:"text",
        title:"Red",
        payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED",
        image_url:"https://i2.tudocdn.net/img/max_width1000/id97067_1.jpg"
      },
      {
        content_type:"text",
        title:"Green",
        payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN",
        image_url:"http://petersfantastichats.com/img/green.png"
      }
    ]
  }
  };  

  callSendAPI(buttonData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "https://i2.tudocdn.net/img/max_width1000/id97067_1.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://img1.lemondeinformatique.fr/fichiers/telechargement/daydream-home.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

app.listen(app.get('port'), function() {
  console.log('Bot is running on port ', app.get('port'));
});