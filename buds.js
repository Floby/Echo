#!/usr/bin/env node

var sys = require('sys');

exports.parseMessage = function(message) {
    if(!/^\[[a-z_]+\] .*$/.test(message)) {
	sys.puts('invalid message: '+message);
	return;
    }
    var matches = message.match(/\[([a-z_]+)\] (.*)/);
    try {
	this[matches[1]].call(this, matches[2]);
    } catch (e) {
	sys.puts(e.message+" on "+matches[1]);
    }
}

exports.my_name_is = function(content) {
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

exports.buddy_info = function(message) {
    var infos = JSON.parse(message); 
    sys.puts(message);
    sys.puts(sys.inspect(infos));
}

exports.message = function(message) {
    sys.puts("received message from "+this.name+": "+message);
}

exports.Write = function(message) {
    this.socket.write("[message] "+message+"\n");
}

exports.AskFor = function(buddy) {
    this.socket.write("[looking_for] "+buddy.name);
}

exports.setup = function() {
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
