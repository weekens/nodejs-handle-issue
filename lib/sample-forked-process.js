'use strict';

var net = require('net');

var server;

process.on('message', (msg, handle) => {
  if (msg == 'server') {
    server = net.createServer();
    server.listen(handle);

    console.log('received server message, handle =', handle);

    // Send hello message on connection.
    server.on('connection', socket => {
      console.log('server connection');

      socket.end('Hello!');
    });

    process.send('listening');
  }
  else if (msg == 'close') {
    console.log('received close message, closing');

    server && server.close(() => {
      process.exit(0);
    });
  }
});