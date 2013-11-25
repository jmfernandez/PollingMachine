/*
 * GET home page.
 */

var events = require('events');
var EventEmitter = events.EventEmitter;

/*
exports.createPoll = function(req, res){
	if(in req.query) {
		res.render('createdPoll', { title: 'Poll has been created' });
	} else {
		res.render('createPollForm', { title: 'New Poll Creation' });
	}
};
*/

exports.list = function(req, res) {
	var db = exports.db;
	db.all('SELECT poll_id, title FROM poll', function(err, rows) {
		var polls = [];
		rows.forEach(function(row) {
			polls.push({poll_id: row.poll_id,title: row.title});
		});
		res.render('pollList',{polls:polls});
	});
};

exports.results = function(req, res) {
	var db = exports.db;
	if('poll_id' in req.params) {
		var poll_id = req.params.poll_id;
		var rObj = {
			title: 'Welcome to the ballot!!!!',
		};
		db.prepare('SELECT title, description, pollstart, pollend FROM POLL where poll_id = ?',poll_id)
			.get(function(err,row) {
				if(err) throw err;
				
				if('title' in row) {
					rObj.poll_id = poll_id;
					rObj.poll_title = row.title;
					rObj.poll_descr = row.description;
					rObj.poll_start = row.pollstart;
					rObj.poll_end = row.pollend;
				}
			})
			.finalize(function(err) {
				if('poll_id' in rObj) {
					if(rObj.poll_end) {
						db.all('SELECT c.cand_id, COALESCE(SUM(vv.score),0) AS score, c.title, c.description \
							FROM CANDIDATE c LEFT JOIN VOTE v ON c.cand_id = v.cand_id LEFT JOIN VOTEVALUE vv ON v.vote = vv.name AND vv.poll_id = c.poll_id \
							WHERE c.poll_id = ? \
							GROUP BY 1 \
							ORDER BY 2 DESC',poll_id, function(err, rows) {
								
							var ranking = [];
							var rankHash = {};
							
							rObj.ranking = ranking;
							
							rows.forEach(function(row) {
								var candStats = {cand_id: row.cand_id, score: row.score, title:row.title, description: row.description, votes:{}};
								ranking.push(candStats);
								rankHash[row.cand_id] = candStats;
							});
							
							db.all('SELECT v.cand_id, v.vote, COUNT(v.vote) AS num_votes \
								FROM VOTE v, CANDIDATE c \
								WHERE c.poll_id = ? \
								AND c.cand_id = v.cand_id \
								GROUP BY 1,2',poll_id, function(err, rows) {
									
								rows.forEach(function(row) {
									rankHash[row.cand_id].votes[row.vote] = row.num_votes;
								});
								
								db.all('SELECT vt.name, vt.colour, vv.score \
									FROM VOTETYPE vt, VOTEVALUE vv \
									WHERE vv.poll_id = ? \
									AND vv.name = vt.name \
									ORDER BY vv.isblind,vv.score DESC',poll_id, function(err, rows) {
									
									var coloursArray = [];
									var colours = {};
									
									rObj.coloursArray = coloursArray;
									rObj.colours = colours;
									
									rows.forEach(function(row) {
										var theColour = {name: row.name, colour: row.colour, score: row.score};
										coloursArray.push(theColour);
										colours[row.name] = theColour;
									});
									
									res.render('pollResults',rObj);
								});
							});
							
						});
					} else if(rObj.poll_start) {
						res.render('pollNotFound',{ title: 'Poll still in progress',unknown_poll: poll_id });
					} else {
						res.render('pollNotFound',{ title: 'Poll has not started yet',unknown_poll: poll_id });
					}
				} else {
					res.render('pollNotFound',{ title: 'Unknown poll',unknown_poll: poll_id });
				}
			});
	} else {
		res.render('pollNotFound',{ title: 'Unknown poll',unknown_poll: null });
	}
};

exports.winner = function(req, res) {
	var db = exports.db;
	if('poll_id' in req.params) {
		var poll_id = req.params.poll_id;
		var rObj = {
			title: 'Welcome to the ballot!!!!',
		};
		db.prepare('SELECT title, description, pollstart, pollend FROM POLL where poll_id = ?',poll_id)
			.get(function(err,row) {
				if(err) throw err;
				
				if('title' in row) {
					rObj.poll_id = poll_id;
					rObj.poll_title = row.title;
					rObj.poll_descr = row.description;
					rObj.poll_start = row.pollstart;
					rObj.poll_end = row.pollend;
				}
			})
			.finalize(function(err) {
				if(err) throw err;
				if('poll_id' in rObj) {
/*					
SELECT vr.id_mail, p.cand_id, COALESCE(CAST(SUM(vv.score) AS REAL)/ (SELECT COUNT(*) FROM PROPOSED_BY pp WHERE pp.cand_id = p.cand_id),0)
FROM VOTER vr JOIN PROPOSED_BY p ON vr.id_mail = p.id_mail LEFT JOIN VOTE v ON p.cand_id = v.cand_id LEFT JOIN VOTEVALUE vv ON v.vote = vv.name
WHERE vr.poll_id = 'maromos'
GROUP BY 1,2
*/
					if(rObj.poll_end) {
						var winners = [];
						var winnersHash = [];
						rObj.winners = winners;
						db.all('SELECT p.id_mail, MAX(s.score) AS score, p.name, p.surname \
							FROM POLLUSER p, PROPOSED_BY pb, \
							( \
								SELECT c.cand_id, COALESCE(SUM(vv.score),0) AS score, c.title, c.description \
								FROM CANDIDATE c LEFT JOIN VOTE v ON c.cand_id = v.cand_id LEFT JOIN VOTEVALUE vv ON v.vote = vv.name AND vv.poll_id = c.poll_id \
								WHERE c.poll_id = ? \
								GROUP BY 1 \
							) s \
							WHERE p.id_mail = pb.id_mail \
							AND s.cand_id = pb.cand_id \
							GROUP BY p.id_mail \
							ORDER BY 2 DESC',poll_id, function(err, rows) {
								
							if(err) throw err;
								
							rows.forEach(function(row) {
								var win = {id_mail:row.id_mail, name:row.name, surname: row.surname, score:row.score};
								winnersHash[win.id_mail] = win;
								winners.push(win);
							});
							
							db.all('SELECT p.id_mail, SUM(s.score) AS score, p.name, p.surname \
								FROM POLLUSER p, \
								( \
									SELECT vr.id_mail, p.cand_id, COALESCE(CAST(SUM(vv.score) AS REAL)/ (SELECT COUNT(*) FROM PROPOSED_BY pp WHERE pp.cand_id = p.cand_id),0) AS score \
									FROM VOTER vr JOIN PROPOSED_BY p ON vr.id_mail = p.id_mail LEFT JOIN VOTE v ON p.cand_id = v.cand_id LEFT JOIN VOTEVALUE vv ON v.vote = vv.name AND NOT vv.isblind \
									WHERE vr.poll_id = ? \
									GROUP BY 1,2 \
								) s \
								WHERE p.id_mail = s.id_mail \
								GROUP BY 1 \
								ORDER BY 2 DESC',poll_id, function(err, rows) {
								
								if(err) throw err;
								
								rows.forEach(function(row) {
									winnersHash[row.id_mail].oldScore = row.score;
								});
								
								res.render('pollWinners',rObj);
							});
						});
					} else if(rObj.poll_start) {
						res.render('pollNotFound',{ title: 'Poll still in progress',unknown_poll: poll_id });
					} else {
						res.render('pollNotFound',{ title: 'Poll has not started yet',unknown_poll: poll_id });
					}
				} else {
					res.render('pollNotFound',{ title: 'Unknown poll',unknown_poll: poll_id });
				}
			});
	} else {
		res.render('pollNotFound',{ title: 'Unknown poll',unknown_poll: null });
	}
};

exports.image = function(req, res) {
	var flowC = new EventEmitter();
	
	flowC.on('start',function(db) {
		if('poll_id' in req.params) {
			var poll_id = req.params.poll_id;
			var photo = undefined;
			var photo_mime = undefined;
			db.prepare('SELECT photo, photo_mime FROM POLL WHERE poll_id = ?',poll_id)
				.get(function(err,row) {
					if(err) throw err;
					
					photo = row.photo;
					photo_mime = row.photo_mime;
				})
				.finalize(function(err) {
					if(err) throw err;
					
					flowC.emit('render',poll_id,photo,photo_mime);
				});
		} else {
			flowC.emit('render',null,undefined,undefined);
		}
	});
	
	flowC.on('render',function(poll_id,imageBuffer,imageMime) {
		if(imageBuffer) {
			res.set('Content-Type',imageMime);
			res.send(imageBuffer);
		} else {
			res.render('pollNotFound',{ title: 'Unknown poll',unknown_poll: poll_id });
		}
	});
	
	flowC.emit('start',exports.db);
};
