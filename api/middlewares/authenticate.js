'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = "C0nt4ct0G4r4nt1d0";

exports.ensureAuth = function(req, res, next){
	
	if(!req.headers.authorization)
	{
		return res.status(403).send({
			message: 'La peticion no tiene la autenticacion'
		});
	}
	
	var token = req.headers.authorization.replace(/['"]+/g, '');
	
	try
	{
		var payload = jwt.decode(token, secret);
		
		if( payload.exp <= moment().unix() )
		{
			return res.status(401).send({
				message: 'El token ha expirado'
			});
		}
	}
	catch(e)
	{
		return res.status(404).send({
			message: 'El token no es valido'
		});
	}
	
	req.user = payload;
	
	next();
	
};