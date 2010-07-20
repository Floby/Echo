#!/usr/bin/env node

var sys = require('sys');
var net = require('net');

exports.parseMessage = function(message) {
    sys.puts("parsing "+ message);
    if(!/^\[[a-z_]+\] .*$/.test(message)) {
	sys.puts('invalid message: '+message);
	return;
    }
    var matches = message.match(/\[([a-z_]+)\] (.*)/);
    try {
	this["h_"+matches[1]].call(this, matches[2]);
    } catch (e) {
	sys.puts(e.message+" on "+matches[1]);
    }
}

exports.h_my_name_is = function(content) {
    sys.puts(this.name+"'s name is "+content);
    if(this.name != content) {
	sys.puts("wrong number");
	this.socket.end();
	delete this.socket;
	delete this.authState;
	this.connectionState = 'wrong';
	this.echo.lostBuddies.push(this);
    }
    else {
	this.authState = 'verified';
	sys.puts("identity confirmed");
    }
}

exports.h_buddy_info = function(content) {
    sys.puts(content);
    var regex = /^([a-zA-Z0-9_-]+) (.+)$/;
    if(!regex.test(content)) {
	sys.puts("invalid buddy info");
	return;
    }
    var m = content.match(regex);
    var contact = m[2].split(':');
    this.echo.buddies[m[1]].updateInfo(contact[0], parseInt(contact[1]));
}

exports.h_message = function(message) {
    sys.puts("received message from "+this.name+": "+message);
}

exports.write = function(message) {
    this.socket.write("[message] "+message+"\n");
}

exports.updateInfo = function(host, port) {
    // include verifications
    this.host = host;
    this.port = port;
    this.connect();
}

exports.connect = function() {
    if(this.socket) {
	this.socket.end();
	delete this.socket;
	delete this.authState;
	delete this.connectionStation;
    }
    this.socket = net.createConnection(this.port, this.host);
    this.socket.buddy = this;
    this.socket.buddyname = this.name;
    this.socket.setEncoding('utf8');
    this.socket.addListener('connect', function() {
	sys.puts("successfully connected to "+ this.buddyname);
	this.buddy.connectionState = 'connected';
	this.buddy.authState = 'unsure';
	this.write("[greetings] "+this.buddyname+"?\n");
	this.buddy.setup();
    });
    this.socket.addListener('error', function(e) {
	sys.puts("connection failed to " + this.buddyname);
	this.buddy.lost();
    });
}

exports.lost = function() {
    this.socket.end();
    this.connectionState = 'failed';
    this.echo.lostBuddies.push(this);
}

exports.askFor = function(buddy) {
    this.socket.write("[looking_for] "+buddy.name);
}

exports.setup = function() {
    sys.puts("setting "+this.name+" up");
    this._buffer = "";
    this.socket.addListener('data', function(data) {
	for(var i=0 ; i<data.length ; ++i) {
	    if(data[i] == "\r") continue;
	    if(data[i] != "\n") {
		this.buddy._buffer += data[i]
	    }
	    else {
		var message = this.buddy._buffer;
		this.buddy._buffer = "";
		this.buddy.parseMessage(message);
	    }
	}
    });
}
