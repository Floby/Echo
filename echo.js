#!/usr/bin/env node

var node = require('./echoNode');
var echo = new node.Node({
   cwd: './',
   configfile: 'config.json',
   buds: 'buddies.json'
});
echo.start();

var repl = require('repl');
var net = require('net');
net.createServer(function(socket) {
    console.log('someone connected to the repl');
    var r = repl.start('echo repl> ', socket);
    r.context.echo = echo;
    r.context.mainModule = module;
}).listen('/tmp/node.repl');
