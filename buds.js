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

exports.h_greetings = function(content) {
    this.socket.write("[my_name_is] "+this.name + "\n");
};

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

exports.h_looking_for = function(content) {
    if(content == this.name) {
	this.socket.write("[insult] Looking for oneself is a really wise thing to do. but don't flood\n");
	return;
    }
    var b = this.echo.buddies[content];
    if(!b) return;
    if(b.connectionState == "connected" && b.authState == 'verified') {
	this.socket.write('[buddy_info] ' + b.name + ' ' + b.host + ':' + b.port + "\n");
    }
};

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
    var cfg = this.echo.config.buddyResearch;
    if(this.socket) this.socket.end();
    this.connectionState = 'failed';
    var si = this._searchInterval;
    var si = (si * cfg.refreshIntervalMultiplier) < cfg.maxRefreshInterval ? si * cfg.refreshIntervalMultiplier : cfg.maxRefreshInterval;
    this._searchInterval = si;
    sys.puts("this._searchInterval = "+this._searchInterval);
    this._nextSearchTimeout = setTimeout(function(o, m) {m.call(o)}, this._searchInterval, this, this.search);
};

exports._searchInterval = 500;

exports.search = function() {
    var asked = false;
    for(var bud in this.echo.buddies) {
	var b = this.echo.buddies[bud];
	if(b.connectionState == 'connected' && b.authState == 'verified') {
	    sys.puts("asking "+b.name+" for "+this.name);
	    b.askFor(this);
	    asked = true;
	}
    }
    if(!asked) {
	sys.puts("couldn't ask for "+this.name+"!");
	this.lost();
    }
    else {
	sys.puts("could ask for "+this.name+". expecting response within 10 seconds");
	// TODO
    }
}

exports.askFor = function(buddy) {
    this.socket.write("[looking_for] "+buddy.name);
}

exports.setup = function() {
    if(this._nextSearchTimeout) clearTimeout(this._nextSearchTimeout);
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
