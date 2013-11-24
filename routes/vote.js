/*
 * GET home page.
 */
var events = require('events');
var EventEmitter = events.EventEmitter;

exports.logout = function(req,res) {
	if(req.session.poll_id) {
		req.session.destroy();
	}
	res.redirect('..');
};

exports.submission = function(req,res) {
	var flowC = new EventEmitter();
	
	flowC.on('start',function(db) {
		if(req.session.poll_id) {
			var poll_id = req.session.poll_id;
			// Let's check whether the user is available
			db.prepare('SELECT COUNT(*) AS count FROM VOTE v, CANDIDATE c WHERE v.voter_id = ? AND v.cand_id = c.cand_id AND c.poll_id = ?',req.session.voter_id,poll_id)
				.get(function(err,row) {
					if (err) throw err;
					
					if(row.count > 0) {
						flowC.emit('render',true);
					} else {
						var colours = {};
						db.each('SELECT vt.name, vt.colour, vv.score \
							FROM VOTETYPE vt, VOTEVALUE vv \
							WHERE vv.poll_id = ? \
							AND vv.name = vt.name',
							poll_id,function(err,row) {
								
							if (err) throw err;
							
							var theColour = {name: row.name, colour: row.colour, score: row.score};
							colours[row.name] = theColour;
						},function(err,num) {
							if(err)  throw err;
							
							var stmt = db.prepare('INSERT INTO VOTE(voter_id,vote,cand_id,moment) VALUES (?,?,?,CURRENT_TIMESTAMP)');
							var count = 0;
							var inserted = 0;
							for(var vote in req.query) {
								if(vote in colours) {
									count++;
								}
							}
							db.serialize(function() {
								for(var vote in req.query) {
									if(vote in colours) {
										stmt.run(req.session.voter_id,vote,req.query[vote],function(err) {
											if(err)  throw err;
											
											inserted++;
										});
									}
								}
							});
							stmt.finalize(function(err) {
								if(err)  throw err;
								
								// Let's set the end mark for the vote
								db.run('UPDATE POLL SET pollend = CURRENT_TIMESTAMP  WHERE poll_id = ? AND pollend IS NULL AND (SELECT COUNT(*) FROM VOTER vt LEFT JOIN VOTE v ON vt.poll_id = ? AND vt.voter_id = v.voter_id WHERE v.voter_id IS NULL) = 0',poll_id,poll_id,function(err) {
									flowC.emit('render',false);
								});
							});
						});
					}
				});
		} else {
			flowC.emit('render',true);
		}
	});
	
	flowC.on('render', function(error) {
		req.session.destroy();
		if(error) {
			res.render('voteDiscarded', { title: 'Vote Discarded'});
		} else {
			res.render('voteRegistered', { title: 'Vote Registered!'});
		}
	});
	
	flowC.emit('start',exports.db);
};

exports.vote = function(req, res){
	var flowC = new EventEmitter();
	
	/*
	flowC.on('init',function(db) {
		if(req.session.colours && req.session.coloursArray) {
			flowC.emit('start',db);
		} else {
			var coloursArray = [];
			var colours = {};
			req.session.coloursArray = coloursArray;
			req.session.colours = colours;
			db.each('SELECT name, colour FROM VOTETYPE',function(err,row) {
				if (err) throw err;
				
				var theColour = {name: row.name, colour: row.colour};
				console.log(row.name);
				coloursArray.push(theColour);
				colours[row.name] = theColour;
			},function(err,num) {
				flowC.emit('start',db);
			});
		}
	});
	*/
	
	flowC.on('start',function(db) {
		if('user' in req.query) {
			req.session.poll_id = null;
			req.session.voter_id = null;
			
			// Let's check whether the user is available
			db.each('SELECT poll_id FROM VOTER where voter_id = ?',req.query.user,function(err,row) {
				if (err) throw err;
				
				req.session.poll_id = row.poll_id;
				req.session.voter_id = req.query.user;
			},function(err,num) {
				flowC.emit('render',(num == 0),db);
			});
		} else {
			flowC.emit('render',false,db);
		}
	});
	
	flowC.on('render', function(error,db) {
		if(req.session.poll_id) {
			var poll_id = req.session.poll_id;
			var coloursArray = [];
			var colours = {};
			var rObj = {
				title: 'Welcome to the ballot!!!!',
				colours: colours,
				coloursArray: coloursArray
			};
			db.each('SELECT vt.name, vt.colour, vv.score \
				FROM VOTETYPE vt, VOTEVALUE vv \
				WHERE vv.poll_id = ? \
				AND vv.name = vt.name \
				ORDER BY 3 DESC',
				poll_id,function(err,row) {
					
				if (err) throw err;
				
				var theColour = {name: row.name, colour: row.colour, score: row.score};
				coloursArray.push(theColour);
				colours[row.name] = theColour;
			},function(err,num) {
				if(err)  throw err;
				
				// The title and description
				db.prepare('SELECT title, description FROM POLL where poll_id = ?',poll_id)
					.get(function(err,row) {
						if(err) throw err;
						
						rObj.poll_id = poll_id;
						rObj.poll_title = row.title;
						rObj.poll_descr = row.description;
					})
					.finalize(function(err) {
						if(err) throw err;
						
						// The user data
						db.prepare('SELECT p.id_mail, p.name, p.surname, (SELECT COUNT(*) FROM VOTE vt WHERE vt.voter_id = v.voter_id) AS numvotes FROM VOTER v, POLLUSER p WHERE v.voter_id = ? AND v.id_mail = p.id_mail',req.session.voter_id)
							.get(function(err,row) {
								if(err) throw err;
								
								rObj.voter_id = req.session.voter_id;
								rObj.voter_name = row.name;
								rObj.voter_surname = row.surname;
								rObj.voter_id_mail  = row.id_mail;
								rObj.voter_voted = (row.numvotes != 0) ;
							})
							.finalize(function(err) {
								if(err)  throw err;
								
								var cand = [];
								rObj.cand = cand;
								// The candidates
								db.each(
									'SELECT DISTINCT c.cand_id, c.title, c.description, vt.vote \
									FROM VOTER v, PROPOSED_BY p, CANDIDATE c LEFT JOIN VOTE vt ON c.cand_id = vt.cand_id  AND vt.voter_id=? \
									WHERE v.poll_id = ? \
									AND v.voter_id <> ? \
									AND c.poll_id = v.poll_id \
									AND c.cand_id = p.cand_id \
									AND p.id_mail = v.id_mail \
									ORDER BY RANDOM()',
									req.session.voter_id,
									poll_id,
									req.session.voter_id
								,function(err,row) {
									if(err) throw err;
									
									cand.push({cand_id: row.cand_id, title: row.title, description: row.description, vote: row.vote});
								},function(err) {
									res.render('vote', rObj);
								});
							});
					});
			});
		} else if(error) {
			res.render('voteUnknown', { title: 'Unknown user',unknown_user: req.query.user });
		} else {
			res.render('voteLogin', { title: 'Please introduce your voting personal id' });
		}
	});
	
	flowC.emit('start',exports.db);
};
