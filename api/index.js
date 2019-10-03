'use strict'
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

mongoose.Promise = global.Promise;
//conexion a la base de datos
mongoose.connect('mongodb://localhost:27017/redsocial',{ useNewUrlParser: true})
.then(()=>{
	console.log('Conexion establecida');
	
	//crear el servidor
	app.listen(port, ()=>{
		console.log("Servidor corriendo en http://localhost:3800");
	});
}).catch(err=>console.log(err));