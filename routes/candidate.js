/*
 * GET home page.
 */

var events = require('events');
var EventEmitter = events.EventEmitter;

exports.image = function(req, res){
	var flowC = new EventEmitter();
	
	flowC.on('start',function(db) {
		if(req.params.cand_id) {
			var cand_id = req.params.cand_id;
			var cand_photo = undefined;
			var cand_photo_mime = undefined;
			var poll_id = req.session.poll_id;
			var voter_id = req.session.voter_id;
			
			if('owner' in req.query) {
				if(voter_id === undefined) {
					flowC.emit('render',cand_id,cand_photo,cand_photo_mime);
				} else {
					db.prepare(	'SELECT p.photo, p.photo_mime \
							FROM PROPOSED_BY p, VOTER v \
							WHERE p.cand_id = ? \
							AND p.id_mail = v.id_mail \
							AND v.voter_id = ?',cand_id,voter_id)
						.get(function(err,row) {
							if(err) throw err;
							
							cand_photo = row.photo;
							cand_photo_mime = row.photo_mime;
						})
						.finalize(function(err) {
							if(err) throw err;
							
							flowC.emit('render',cand_id,cand_photo,cand_photo_mime);
						});
				}
			} else {
				// Assuring it is a defined value
				if(voter_id === undefined) {
					db.prepare(	'SELECT p.photo, p.photo_mime \
							FROM PROPOSED_BY p \
							WHERE p.cand_id = ? \
							ORDER BY RANDOM() \
							LIMIT 1',cand_id)
						.get(function(err,row) {
							if(err) throw err;
							
							cand_photo = row.photo;
							cand_photo_mime = row.photo_mime;
						})
						.finalize(function(err) {
							if(err) throw err;
							
							flowC.emit('render',cand_id,cand_photo,cand_photo_mime);
						});
				} else {
					db.prepare(	'SELECT p.photo, p.photo_mime \
							FROM PROPOSED_BY p \
							WHERE p.cand_id = ? \
							AND ( (SELECT pollend IS NOT NULL FROM poll WHERE poll_id = ?) \
							OR p.id_mail <> (SELECT v.id_mail FROM VOTER v WHERE v.voter_id = ?)) \
							ORDER BY RANDOM() \
							LIMIT 1',cand_id,poll_id,voter_id)
						.get(function(err,row) {
							if(err) throw err;
							
							cand_photo = row.photo;
							cand_photo_mime = row.photo_mime;
						})
						.finalize(function(err) {
							if(err) throw err;
							
							flowC.emit('render',cand_id,cand_photo,cand_photo_mime);
						});
				}
			}
		} else {
			flowC.emit('render',null,undefined,undefined);
		}
	});
	
	flowC.on('render',function(cand_id,imageBuffer,imageMime) {
		if(imageBuffer) {
			res.set('Content-Type',imageMime);
			res.send(imageBuffer);
		} else {
			res.render('candidateNotFound',{ title: 'Unknown candidate',unknown_candidate: cand_id });
		}
	});
	
	flowC.emit('start',exports.db);
}
