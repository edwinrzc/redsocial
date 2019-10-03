"use strict"

var bcrypt = require('bcrypt-nodejs');
var mongoosePagination = require('mongoose-pagination');
var jwt = require('../services/jwt');
var fs = require('fs');
var path = require('path');

var User = require('../models/user');
var Follow = require('../models/follow');

function home(req, res){
	
	res.status(200).send({
		message: 'Hola Mundo'
	});
}


function pruebas(req, res){
	res.status(200).send({
		message: 'Vista de pruebas'
	});
	
}


function saveUser( req, res ){
	
	var params = req.body;
	var user = new User();
	
	if(params.name && params.surname && params.nick && 
	   params.email && params.password){
		
		user.name = params.name;
		user.surname = params.surname;
		user.nick = params.nick;
		user.email = params.email;
		user.image = null;
		user.role = 'ROLE_USER';
		//Validar que el usuario no exista.
		User.find({ $or:[
			{email: user.email.toLowerCase()},
			{nick: user.nick.toLowerCase()}
		]}).exec( (err, users)=>{
			if(err)return res.status(500).send({
				message: 'Error en la peticion de usuario!!!'
			}); 
			
			if(users && users.length >= 1){
				return res.status(200).send({ message: 'El usuario ya existe.'});
			}
			else{
				//Cifrar la contraseña y registar el usuario
				bcrypt.hash(params.password, null, null, (err, hash)=>{
					
					user.password = hash;
					
					user.save( (err, userStored)=>{
						if(err)return res.status(500).send({
							message: 'Error en el servidor al guardar el usuario!!!'
						}); 
						
						if(userStored){
							
							return res.status(200).send({ user:userStored });
							
						}
						else{
							return res.status(404).send({ message: 'No se ha registrado el usuario.'});
						}
					});
				});
				
			}
		});
		
		
		
	}
	else{
		return res.status(200).send({mensaje: 'Existen datos sin definir.'});
	}
}


function loginUser(req, res){
	
	var params = req.body;
	
	var email = params.email;
	var password = params.password;
	
	User.findOne({ email: email}, ( err, user)=>{
		if(err)return res.status(500).send({menssage: 'Error en el servidor.'}); 
		
		if(user){
			
			bcrypt.compare(password, user.password, (err, check)=>{
				
				if(check){
					
					if(params.gettoken){
						return res.status(200).send({
							token: jwt.createToken( user )
						});
					}
					else{
						user.password = undefined;
						return res.status(200).send({ user });
					}
					
				}
				else{
					return res.status(404).send({menssage: 'El usuario no se ha podido identificar.'}); 
				}
				
			});
		}
		else{
			return res.status(404).send({menssage: 'El usuario no se ha podido identificar.'});
		}
	});
	
}


function getUser( req, res ){
	
	var userId = req.params.id;
	
	User.findById(userId, (err, user)=>{
		if(err)return res.status(500).send({menssage: 'Error en el servidor.'});
		
		if(!user){
			return res.status(404).send({menssage: 'El usuario no existe.'});
		}
		
		followThisUser( req.user.sub, userId ).then( (value) =>{
			console.log(value);
			return res.status(200).send({
				user,
				following: value.following, 
				followed: value.followed
			});
		});
		
		
		
	});
}


async function followThisUser(indetity_user_id, user_id){
	
	
	var following = await Follow.findOne({'user':indetity_user_id, 'followed':user_id}).exec((err, follow)=>{
		if(err)return handleError(err);
		
		return follow;
	});
	
	var followed = await Follow.findOne({'user':user_id, 'followed':indetity_user_id}).exec((err, follow)=>{
		if(err)return handleError(err);
		
		return follow;
	});
	
	
	return {
		following: following,
		followed: followed,
	};
}


function findFollowUser( userFollowing, userFollowed){
	Follow.findOne({'user':userFollowing, 'followed':userFollowed}).exec((err, follow)=>{
		if(err)return handleError(err);
		
		return follow;
	});
}


function getUsers( req, res){
	
	var userId = req.user.sub;
	var page = 1;
	
	if(req.params.page){
		page = req.params.page;
	}
	
	var itemsPerPage = 5;
	
	User.find().sort('_id').paginate(page,itemsPerPage,( err, users, total)=>{
		if(err)return res.status(500).send({menssage: 'Error en el servidor.'});
		
		if(!users){
			return res.status(404).send({menssage: 'No existen usuarios.'});
		}
		
		return res.status(200).send({
			users,
			total,
			pages: Math.ceil(total/itemsPerPage)
		});
	});
}


function updateUser( req, res ){
	
	var userId = req.params.id;
	var update = req.body;
	
	delete update.password;
	
	if(userId != req.user.sub){
		return res.status(500).send({menssage: 'No tienes permisos para modificar este usuario.'});
	}
	
	
	User.findByIdAndUpdate(userId, update,{new:true}, (err, userUpdated)=>{
		
		if(err)return res.status(500).send({menssage: 'Error en el servidor.'});
		
		if(!userUpdated){
			return res.status(404).send({menssage: 'No se ha podido actualizar el usuario.'});
		}
		
		return res.status(200).send({user: userUpdated});
		
	});
	
}



function uploadImage( req, res ){
	
	var userId = req.params.id;
	
	
	if(req.files){
		
		var file_path = req.files.image.path;
		var file_split = file_path.split('\/');
		var file_name = file_split[2];
		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];
		
		
		if(userId != req.user.sub){
			return removeFilesOfUpload(res, file_path, 'No tienes permisos para realizar esta accion.');			
		}
		
		
		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || 
		   file_ext == 'gif'){
			
			User.findByIdAndUpdate(userId,{image: file_name}, {new:true},(err, userUpdated)=>{
				if(err)return res.status(500).send({menssage: 'Error en el servidor.'});
				
				if(!userUpdated){
					return res.status(404).send({menssage: 'No se ha podido actualizar el usuario.'});
				}
				
				return res.status(200).send({user: userUpdated});
			});
			
		}
		else{
			return removeFilesOfUpload(res, file_path, 'La extension no es valida');
		}
	}
	else{
		return res.status(500).send({menssage: 'No se ha subido imagen.'});
	}
}

function removeFilesOfUpload(res, file_path, message){
	fs.unlink(file_path, ( err )=>{
		return res.status(401).send({ menssage: message });
	});
}



function getImageFile(req, res){
	
	var image_file = req.params.imageFile;
	var path_file = './uploads/users/'+ image_file;
	
	fs.exists(path_file, (exists)=>{
		if(exists){
			res.sendFile(path.resolve(path_file));
		}
		else{
			return res.status(200).send({ message: 'No existe la imagen...'})
		}
	});
}


module.exports = {
		home,
		pruebas,
		saveUser,
		loginUser,
		getUser,
		getUsers,
		updateUser,
		uploadImage,
		getImageFile
}