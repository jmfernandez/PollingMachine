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
			db.prepare('SELECT p.photo, p.photo_mime FROM PROPOSED_BY p WHERE p.cand_id = ? ORDER BY RANDOM() LIMIT 1',cand_id)
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
