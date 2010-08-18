#!/usr/bin/env node

var sys = require('sys'),
    path = require('path'),
    cfig = require('./config');

var Node = function Node(cfg) {
    this.configure(cfg);
}
exports.Node = Node;
Node.prototype.configure = function(cfg) {
    this._cfg = cfg;
    this._cwd = cfg.cwd;
    this._budsfile = cfg.buds;
    this._configfile = cfg.configfile;

    this.buddies = cfig.loadJsonSync(path.normalize(this._cwd + '/' + this._budsfile));
    this.config = cfig.loadJsonSync(path.normalize(this._cwd + '/' + this._configfile));
}
Node.prototype.insult = function() { 
    var i = Math.floor(Math.random() * this.config.insults.length);
    return this.config.insults[i];
}
Node.prototype.start = function() { 
    var buds = this.buddies;
    for(var bud in buds) {
	buds[bud].name = bud;
	buds[bud].__proto__ = require('./buds');
	buds[bud].echo = this;
	buds[bud].connect();
    }
    var interface = require('./interface');
    this.interface = interface.createInterface(this, process.openStdin(), process.stdout);
}
Node.prototype.stop = function() {
    for(var k in module.moduleCache) {
	delete module.moduleCache[k];
    }
    for(var b in this.buddies) {
	try {
	    this.buddies[b].end();
	}
	catch(e) {
	}
    }
}
Node.prototype.restart = function() {
    this.stop();
    this.start();
}
