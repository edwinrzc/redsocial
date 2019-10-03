'use strict'

var express = require('express');
var userController = require('../controllers/user');
var md_auth = require('../middlewares/authenticate');

var api = express.Router();
var multipart = require('connect-multiparty');
var md_upload = multipart({ uploadDir: './uploads/users'});

api.get('/home', userController.home);
api.get('/pruebas', md_auth.ensureAuth,  userController.pruebas);
api.post('/register', userController.saveUser);
api.post('/login', userController.loginUser);
api.get('/user/:id', md_auth.ensureAuth,  userController.getUser);
api.get('/users/:page?', md_auth.ensureAuth,  userController.getUsers);
api.put('/update-user/:id', md_auth.ensureAuth,  userController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload],  userController.uploadImage);
api.get('/get-image-user/:imageFile?', md_auth.ensureAuth,  userController.getImageFile);


module.exports = api;