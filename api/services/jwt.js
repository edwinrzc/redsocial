'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = "C0nt4ct0G4r4nt1d0";

exports.createToken = function(user){
	
	var payload = {
			sub: user._id,
			name: user.name,
			surname: user.surname,
			nick: user.nick,
			email: user.email,
			role: user.role,
			image: user.image,
			iat: moment().unix(),
			exp: moment().add(30, 'days').unix()
	};
	
	return jwt.encode(payload, secret);
};
