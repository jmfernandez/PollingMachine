/**
 * Constants
 */
var dbfile = 'polling.db';
var dbmodel = 'dbmodel.sql';

/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var poll = require('./routes/poll');
var voteLogin = require('./routes/vote');
var candidate = require('./routes/candidate');
var http = require('http');
var path = require('path');
var fs = require('fs');

/**
 * Let's open (or create) the database
 */
var fulldbfile = path.join(__dirname,dbfile);
var dbexists = fs.existsSync(fulldbfile);

/**
 * Let's read the schema!
 */

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(fulldbfile);

if(!dbexists) {
	var fulldbmodel = path.join(__dirname,dbmodel);
	if(!fs.existsSync(fulldbmodel)) {
		process.stderr("ERROR: Unable to find database model");
		process.exit(1);
	}
	var model = fs.readFileSync(fulldbmodel,{'encoding':'utf8'});
	db.serialize(function() {
		var arr = model.split(";");
		arr.forEach(function(val) {
			val = val.trim();
			if(val.length>0)
				db.run(val);
		});
	});
}

/**
 * The app
 */

var app = express();

// Setting it up for usage of the views
voteLogin.db = db;
candidate.db = db;
user.db = db;
poll.db = db;

// all environments
app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'ejs');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(path.join(__dirname, 'public')));
	app.use(express.static(path.join(__dirname, 'public')));

	// development only
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}
});


app.get('/', routes.index);
app.get('/user/index', user.list);

app.get('/user/:id_mail/image', user.image);

//app.get('/poll/create', poll.createPoll);
app.get('/poll/index', poll.list);
app.get('/poll/:poll_id/results', poll.results);
app.get('/poll/:poll_id/winner', poll.winner);
app.get('/poll/:poll_id/image', poll.image);

app.get('/vote', voteLogin.vote);
app.post('/vote', voteLogin.vote);
app.get('/vote/logout', voteLogin.logout);
app.get('/vote/submission', voteLogin.submission);

app.get('/candidate/:cand_id/image', candidate.image);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
