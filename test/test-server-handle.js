/*
 * Copyright (c) 2016 Untu, Inc.
 * This code is licensed under Eclipse Public License - v 1.0.
 * The full license text can be found in LICENSE.txt file and
 * on the Eclipse official site (https://www.eclipse.org/legal/epl-v10.html).
 */

'use strict';

var net = require('net');
var path = require('path');
var childProcess = require('child_process');
var P = require('bluebird');
var expect = require('chai').expect;

var workerProcess;

describe('net.Server handle', function() {
  afterEach(() => {
    workerProcess && workerProcess.kill();
  });

  for (var i = 0; i < 100; i++) {
    it('should successfully pass server handle to forked process', P.coroutine(function*() {
      var server = net.createServer();

      yield P.fromCallback(cb => {
        server.listen(8889, '127.0.0.1', cb);
      });

      workerProcess = childProcess.fork(path.join(__dirname, '../lib/sample-forked-process.js'));

      try {
        yield P.fromCallback(cb => {
          workerProcess.send('server', server, cb);
        });

        yield P.fromCallback(cb => {
          workerProcess.once('message', msg => {
            console.log('process response, msg =', msg);

            if (msg == 'listening') cb();
          });
        });

        console.log('after process response');

        var serverMessage = yield P.fromCallback(cb => {
          var clientSocket = new net.Socket();

          clientSocket.setEncoding('UTF8');

          clientSocket.on('data', data => {
            cb(null, data);
          });

          clientSocket.connect(8889, '127.0.0.1', err => {
            console.log('connect callback, err =', err);

            if (err) return cb(err);
          });
        });

        expect(serverMessage).to.be.equal('Hello!');
      }
      finally {
        yield P.fromCallback(cb => {
          workerProcess.send('close', cb);
        });
        yield P.fromCallback(cb => {
          server.close(cb);
        });
      }
    }));
  }
});