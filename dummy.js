#!/usr/bin/env node

/**
 * A simple program that listens on a port and allows
 * to write to the last connected socket
 */

var sys = require('sys'),
    net = require('net');

var sock;
var port = parseInt(process.argv[2]);

var cin = process.openStdin();
cin.setEncoding('utf8');
cin.addListener('data', function(data) {
    sock.write(data); 
});

net.createServer(function(socket) {
    socket.setEncoding('utf8');
    //socket.write("[my_name_is] Florent\n");
    socket.addListener('data', function(data) {
	sys.puts('received: '+data);
    });
    socket.addListener('end', function() {
	socket.end();
    });
    //socket.write("[message] how you're doing?\n");
    sock = socket;
}).listen(port);
sys.puts('listening on '+port);
