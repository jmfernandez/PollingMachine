
/*
 * GET users listing.
 */

var events = require('events');
var EventEmitter = events.EventEmitter;

exports.list = function(req, res){
  res.send("respond with a resource");
};


exports.image = function(req, res) {
	var flowC = new EventEmitter();
	
	flowC.on('start',function(db) {
		if(req.params.id_mail) {
			var id_mail = req.params.id_mail;
			var photo = undefined;
			var photo_mime = undefined;
			db.prepare('SELECT photo, photo_mime FROM POLLUSER WHERE id_mail = ?',id_mail)
				.get(function(err,row) {
					if(err) throw err;
					
					photo = row.photo;
					photo_mime = row.photo_mime;
				})
				.finalize(function(err) {
					if(err) throw err;
					
					flowC.emit('render',id_mail,photo,photo_mime);
				});
		} else {
			flowC.emit('render',null,undefined,undefined);
		}
	});
	
	flowC.on('render',function(id_mail,imageBuffer,imageMime) {
		if(imageBuffer) {
			res.set('Content-Type',imageMime);
			res.send(imageBuffer);
		} else {
			res.render('userNotFound',{ title: 'Unknown user',unknown_user: id_mail });
		}
	});
	
	flowC.emit('start',exports.db);
};
