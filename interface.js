#!/usr/bin/env node

var sys	    = require('sys');

var interface = function interface(echo, instream, outstream) {
    this.echo = echo;
    this._in = instream;
    this._out = outstream;

    if(!this._in.readable) throw new TypeError("input stream must be readable");
    //if(!this._out.writeable) throw new TypeError("output stream must be writeable");

    this._in._interface = this;
    this._out._interface = this;

    this._in.setEncoding('utf8');
    this._out.setEncoding('utf8');

    var self = this;

    sys.lines(this._in);
    
    var handling = function(data) {
	self.handleRequest(data);
    }
    this._in.on('line', handling);
    this._in.on('error', function(err) {
	console.log('something bad happened. I can probably not handle request anymore');
    });

    for(var b in this.echo.buddies) {
	var buddy = this.echo.buddies[b];
	buddy.on('message', function(message) {
	    var info = {};
	    info.type = "message";
	    info.message = message;
	    info.buddy = this.name;
	    info.timestamp = new Date();
	    self._out.write(JSON.stringify(info)+"\n");
	});
    }
}

interface.prototype.handleRequest = function handleRequest(line) {
    var regex = /^([a-z]+) (.*)$/;
    var m = line.match(regex);
    if(!m[1]) throw new SyntaxError("Invalid command syntax: "+line);
    var symbol = 'h_' + m[1];
    try {
	this[symbol](m[2]);
    }
    catch(e) {
	console.log(e);
	var info = {};
	info.type = "error";
	info.what = "couldn't handle command "+m[1]+ " properly. " + e;
	this._out.write(JSON.stringify(info)+"\n");
    }
};

interface.prototype.h_w = interface.prototype.h_write = function write(args) {
    var regex = /^([-a-zA-Z0-1]+) (.*)$/;
    var m = args.match(regex);
    if(!m) throw new SyntaxError("bad syntax for write");
    if(!m[1]) throw new Error("not enough arguments for write()");
    var msg;
    if(/^".+"$/.test(m[2])) msg = m[2];
    else msg = JSON.stringify(m[2]);
    var bud = this.echo.buddies[m[1]];
    if(!bud) throw new Error("unknown buddy "+m[1]);
    bud.write(msg);
};

exports.createInterface = function(echo, i, o)  {
    return new interface(echo, i, o)
}
