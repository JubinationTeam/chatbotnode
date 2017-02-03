
var express = require('express');
var bodyParser = require('body-parser');
var request = require("request");
var morgan = require("morgan");
var mongoose = require("mongoose");

var app = express();
var port = process.env.PORT||80;
var jsonParser = bodyParser.json();


mongoose.connect("mongodb://root:jubination1234@ds139909.mlab.com:39909/jubination",function(err){
    if(err){
        console.log("Not connected to db"+ err);
    }
    else{
        console.log("Sucessfully connected");
    }
});


app.use(jsonParser);
app.use(morgan('dev'));


//get webhook - should always return 200
app.get('/', function(req, res) {
    res.send("Chatbot under development!!");
    res.status(200);
});

//get- should always return 200
app.get('/webhook', function(req, res) {
    res.status(200);
});


app.post('/webhook',function (req, res) {
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
        } else {
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
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'fuck':
        sendGenericMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
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

function sendGenericMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: 'Crossing limits my dear friend'
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token:"EAAC0h8KIPFsBAHqaxnZAkFWZB6WgmdpdKylm1NKW15GcXm3uInH7EQgy3x2ju19adbE8fygvSXfB0Csmmhm1dCwh1zGCY3KLtxtVEzvykiev64ZBEZBN3k8LtILSZChgMCj1PrxQXOYypkqmuDDnlZAbkD3ZAFUcnjgej0Yba0bLgZDZD" },
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

app.listen(port)

//app.listen(80);
