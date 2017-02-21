//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
const DEFAULT_ROOM = 'DefaultRoom';
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = {};
messages[DEFAULT_ROOM] = [];
var sockets = [];

io.on('connection', function(socket) {

  messages[DEFAULT_ROOM].forEach(function(data) {
    socket.emit('message', data);
  });

  sockets.push(socket);

  socket.on('disconnect', function() {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  socket.on('message', function(msg) {
    var text = String(msg || '');

    if (!text)
      return;

    socket.get('room', function(err, room) {
      room = String(room || DEFAULT_ROOM);
      var data = {
        time: Date.now(),
        text: text
      };
      if (!(room in messages)) {
        messages[room] = [];
      }
      messages[room].push(data);
      broadcast(room, 'message', data);
    });
  });

  socket.on('room', function(room) {
    socket.set('room', String(room || DEFAULT_ROOM), function(err) {});
    socket.emit('cls');
    if (room in messages) {
      messages[room].forEach(function(data) {
        socket.emit('message', data);
      });
    }
  });
});

function broadcast(targetRoom, event, data) {
  sockets.forEach(function(socket) {
    socket.get('room', function(err, room) {
      if (room === targetRoom) {
        socket.emit(event, data);
      }
    });
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
