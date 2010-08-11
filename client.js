#!/usr/bin/env node

var sys = require('sys'),
    cfg = require('./config'),
    evt = require('events'),
    net = require('net');

var local_port = 8000;
var echo = {};
echo.buddies = cfg.loadJsonSync("./buddies.json");
echo.config = cfg.loadJsonSync('./config.json');
echo.lostBuddies = [];

sys.puts("initializing");
sys.puts("my buddies:\n"+sys.inspect(echo.buddies));

var buds = echo.buddies;
function initial_on_error(e) {
    sys.puts("connection failed to " + this.buddyname);
    this.end();
    this.removeListener('error', initial_on_error);
    this.buddy.connectionState = 'failed';
    echo.lostBuddies.push(this.buddy);
}

for(var bud in buds) {
    buds[bud].name = bud;
    buds[bud].__proto__ = require('./buds');
    buds[bud].echo = echo;
    buds[bud].connect();
}

var stdin = process.openStdin();
stdin.setEncoding('utf8');
sys.lines(stdin);
stdin.addListener('line', function(data) {
    sys.puts("received: "+ data);
    data = data.replace(/\n|\r/g, "");
    var m = data.match(/^(w) ([a-zA-Z_0-9-]+) (.*)$/);
    try {
	if(m[1] == 'w') {
	    var buddy = m[2];
	    var message = m[3];
	    try {
		echo.buddies[buddy].write(message);
	    } catch(e) {
		sys.puts(sys.inspect(e));
	    }
	}
    } catch(e) {
	sys.puts('invalid command');
    }
});
/*
setInterval(function() {
    if(echo.lostBuddies.length == 0) return;
    var lb = echo.lostBuddies;
    sys.puts(lb.length);
    var lost = lb[0];
    lb.shift();
    //sys.puts(sys.inspect(lost)+" is lost");
    searchBuddy(lost);
}, 500);
*/

function searchBuddy(buddy) {
    var asked = false;
    for(var bud in echo.buddies) {
	var b = echo.buddies[bud];
	if(b.connectionState == 'connected' && b.authState == 'verified') {
	    sys.puts("asking "+b.name+" for "+buddy.name);
	    b.askFor(buddy);
	    asked = true;
	}
    }
    if(!asked) {
	sys.puts("couldn't ask for "+buddy.name);
	echo.lostBuddies.push(buddy);
    }
}
