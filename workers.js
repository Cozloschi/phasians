var express = require('express');
var path = require('path');
var logger = require('morgan');
var connection = require('./mysql.js');
var app = express();

var redis = require('redis');
var client = redis.createClient(); //creates a new client


var worker = function(){

	app.use(logger('dev'));
	app.use(express.static(path.join(__dirname, 'public')));


	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// error handlers

	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: err
			});
		});
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {}
		});
	});


	var io = require('socket.io').listen(app.listen(1337));
	var users = {}; // general play
	var disponible_users = {};
	//var all_users = {}; // all connected users 
	var users_waiting = {}; //list of users waiting for words generally

	var words_list = ['osul', 'mancat', 'ros', 'obraz', 'chel' ,'negru' ,'eoliana', 'mama', 'tata', 'copil', 'bunic' ,'randunica', 'apicultura',
					  'durere', 'anatomie', 'biologie', 'programare', 'nebun', 'monitor', 'muritor', 'uragan' ,'vijelie', 'caine',
					  'pisica', 'copac', 'prajitura', 'energie', 'electric' , 'bufnita'];

	//switch
	var set_interval = 0;
	var single_user_interval;
	//socket io

	  
	//SAVE TO REDIS
	function save_user(userid, callback){
	  if(users[userid]){ //if user is connected
		if(users[userid].database){
			  //console.log(users[userid]); 
			  client.set(users[userid].database, JSON.stringify(users[userid]));
			  
			  if(callback) callback();
		}
	  }
	}


	function must_send(users){
	  
	  var num_waiting = 0;
	  var num_thinking = 0;
	  
	  for(var user in users){
		 if(user.status == 1)
		   num_thinking++;
		 else
		   num_waiting++
	  }
	  
	  if(Math.round(num_thinking / 3) < Math.round(num_waiting / 2))
		 return true;
	  else
		 return false;
	}

	io.sockets.on('connection', function (socket) {
	  
	  console.log('connected');
	  //playing type 0 == waiting for invitation
	  //playing type 1 == playing with someone
	  //playing type 2 == generally playing
	  users[socket.id] = {'status':1, 'money':0, 'level':1, 'last_active':new Date().getTime(),'playing_type':0}; // status 0 = waiting for word, playing_type 2 = playing generally
	  
           
	  
	  //send connected users to client
	  
	  for( var userid in users){
		if(users[userid].lifes > 0)
		  disponible_users[userid] = users[userid]; //refresh disponible ussers
	  }
	  
          //send disponible users to user
          /*
          socket.on('give_me_users', function(data){
	  });
	  */
	  
	  //give up
	  socket.on('give_up', function(data){
	   // console.log(data);
		if(io.sockets.connected[data.to])
		  io.sockets.connected[data.to].emit('gave_up', users[socket.id]); //tell other users that is disconnected
		
		//clear users to
		if(users[data.to])
		  if(users[data.to].play_with != '')
			users[data.to].play_with = '';
			
		if(users[socket.id])
		  if(users[socket.id].play_with != '')
			users[socket.id].play_with = '';

	  });
	  
	  socket.on('start_game',function(data){
		  users[socket.id].playing_type = data.playing_type; //playing generally
		  users[socket.id].play_with = data.play_with; //play with someone?
		  //users[socket.id].status = 0;
		  //users_waiting[socket.id] = 'valid';
		  //console.log('activate_game');
		  setTimeout(function(){
			if(must_send(users) && data.playing_type == 2){ //if playing with someone 
			  console.log('must_send');
			  if(io.sockets.connected[socket.id]){
				io.sockets.connected[socket.id].emit('message', {
				  'message': words_list[Math.round(Math.random() * (words_list.length - 0) + 0)]
				
				});
				users[socket.id].status = 1;
				delete users_waiting[socket.id];
			  }
			}
		  },2000);
	  });
	  //send user id to javascript
	  //io.sockets.connected[socket.id].emit('id', {'userid': socket.id});
	  
	  
	  socket.on('send', function(data){

	   //console.log(data);
	   if(users[socket.id]){
		//console.log('socket id');
		//change user status to 0 and renew data
		users[socket.id].status = 0;
		users[socket.id].money = data.money;
		users[socket.id].level = data.level;
		users[socket.id].last_active = new Date().getTime();
		users[socket.id].database = data.database;
		users[socket.id].username = data.username;
		users[socket.id].lifes = data.lifes;

		save_user(socket.id);
		
		var beat = data.beat;

		//find a valid user to send data to
		
		if(users[socket.id].playing_type == 2){ //if user is playing generally
		  users_waiting[socket.id] = 'valid';
		  for(var userid in users_waiting){
		  
			if(io.sockets.connected[userid]){ 
			  if(users[userid].status == 0 && userid !== socket.id){
				io.sockets.connected[userid].emit('message', data);
			  
				if(beat){
				  io.sockets.connected[socket.id].emit('beat', users[userid]);//you beat user x
				  io.sockets.connected[userid].emit('lost', users[socket.id]);// you lost
				  users[userid].status = 0;
				  users[socket.id].status = 0;
				}
				users[userid].status = 1; //user have word
				delete users_waiting[userid];
				break;
			  }
			}else{
			  delete users[userid]; //remove disconnected user
			  if(users_waiting[userid])
				delete users_waiting[userid];
				
			}
		  }
		
		}
		else{ //play with someone
		
			console.log(data);
		
			if(io.sockets.connected[data.playing_with]){ 
			  if(users[data.playing_with].status == 0 && data.playing_with !== socket.id){
				io.sockets.connected[data.playing_with].emit('message', data);
			  
				if(beat){
				  io.sockets.connected[socket.id].emit('beat', users[data.playing_with]);//you beat user x
				  io.sockets.connected[data.playing_with].emit('lost', users[socket.id]);// you lost
				}
				users[data.playing_with].status = 1; //user have word
			  }
			}else{
			  delete users[data.playing_with]; //remove disconnected user
			  if(users_waiting[data.playing_with])
				delete users_waiting[data.playing_with];
				
			  io.sockets.connected[socket.id].emit('disconnected', users[data.playing_with]);
				
			}
		
		}

		
	   }else{ //user reconnected
		 users[socket.id] = data;
		 console.log('user_reconnected');
		 //register him as waiting user
		 users_waiting[socket.id] = 'valid';

		}

	  });
	  
	  
	  socket.on('status', function(data){
	   
	   if(users[data.id])
	   {
		 users[data.id].money = data.money;
		 users[data.id].level = data.level;
		 users[data.id].status = data.status;
		 users[data.id].last_active = new Date().getTime();
		 users[data.id].database = data.database;
		 users[data.id].playing_type = data.playing_type;
		 users[data.id].lifes = data.lifes;
		 if(data.timestamp)
		   users[data.id].timestamp = data.timestamp;
		 
		 save_user(data.id);
		 
		 console.log(users);
		 if(data.status == 0 && data.playing_type == 2){
		   users_waiting[data.id] = 'valid';
		   if(must_send(users)){
			if(io.sockets.connected[data.id]){ //send to echilibrate.
				io.sockets.connected[data.id].emit('message', {
				  'message': words_list[Math.round(Math.random() * (words_list.length - 0) + 0)]
				});
				users[data.id].status = 1;
				delete users_waiting[data.id];
			}
		   }
		   
		 }
		 else
		   if(data.playing_type == 0)
			 io.sockets.connected[socket.id].emit('get_users',{'users': disponible_users}); //send users list	   
		   
	   }else{ //user reconnected
		 users[socket.id] = data;
		 //register him as waiting user
		 users_waiting[socket.id] = 'valid';
	   }
	   
	  });
	  
	  //update
	  socket.on('update', function(data){
	   
		for(var key in data)
		  users[socket.id][key] = data[key];
		
		console.log(data);
		
		save_user(socket.id);
	   
	  });
	 
	   //get username
	  socket.on('username-database', function(data){ //get user username
		
		//check for duplicate users
		for(user in users) 
		  if(users[user]['database'] == data.database && user !== socket.id){ 
			if(io.sockets.connected[user])
			  io.sockets.connected[user].emit('you_were_disconnected');
			
			delete users[user];
			if(typeof disponible_users[user] !== 'undefined') 
			  delete disponible_users[user];
		  }
		
		users[socket.id].username = data.username;
		users[socket.id].database = data.database;
		users[socket.id].money = data.money;
		users[socket.id].level = data.level;
		users[socket.id].lifes = data.lifes;
                users[socket.id].lat = data.lat;
                users[socket.id].lng = data.lng;
		
		if(data.lifes > 0)
		  disponible_users[socket.id] = users[socket.id];
		
		save_user(users[socket.id]);
	  
                //announe other users
                io.sockets.emit('get_users',{'users': disponible_users});
	  });

	  //on disconnect
	  socket.on('disconnect',function(){ 
		//delete from local var
		
		console.log(users);
		
		console.log('disconnected');

		save_user(socket.id, function(){
		
		  console.log('user_saved');
		
		  if(users[socket.id].play_with != '' && io.sockets.connected[users[socket.id].play_with])
			io.sockets.connected[users[socket.id].play_with].emit('disconnected', users[socket.id]); //tell other users that is disconnected
		  
		  //save database_id
		  var database_id_to_delete = users[socket.id].database;
		  

		  if(users[socket.id])
			delete users[socket.id];
		  if(users_waiting[socket.id])
			delete users_waiting[socket.id];
			
		  if(disponible_users[socket.id])
			delete disponible_users[socket.id];
			
		  //parse users list and delete users with the same database
		  for(user in users){
			if(users[user].database == database_id_to_delete){
			  delete users[user];
			  break;  
			}
		  }
			
		
		});

             
             socket.broadcast.emit('get_users',{'users': disponible_users});
		
	  });
	   
	  

	  
	  
	  
	  //===================================================== PVP ==========================//
	  
	  socket.on('send_invitation', function(data){ //invitation recivied
	   
		if(io.sockets.connected[data.to] && disponible_users[data.to] && users[data.to].lifes > 0){
		  
		  //delete disponible users 
		   delete disponible_users[data.to];
		   delete disponible_users[socket.id];
		   
		   io.sockets.connected[data.to].emit('invitation_recivied',{'from': users[socket.id], 'socket_id': socket.id}); //userul este disponibil, trimite-i invitatia
		}else
		   io.sockets.connected[socket.id].emit('invitation_status',{'status':'500'}); //userul nu este disponibil, afiseaza mesaj
	  
	  });
	  
	  socket.on('send_invitation_status', function(data){
		//console.log(data);
		if(io.sockets.connected[data.to]){
		  io.sockets.connected[data.to].emit('invitation_status', {'status':data.status});
		  if(data.status == 200){//send word to user
			io.sockets.connected[data.to].emit('message', {
				  'message': words_list[Math.round(Math.random() * (words_list.length - 0) + 0)]
				
			});
			users[data.to].status = 1;
			users[socket.id].status = 0;
		  }else{
			
			//re-enable disponible users
			disponible_users[data.to] = disponible_users[data.to];
			disponible_users[socket.id] = disponible_users[socket.id];
		  
		  }
		}
	  });
	  
	});


	//interval for waiting users
	//console.log('only_one');
	setInterval(function(){
	  console.log(users_waiting);
	  if(Object.keys(users_waiting).length > 0){
		user_key = Object.keys(users_waiting)[0];
		if(io.sockets.connected[user_key] && users[user_key].status == 0){
		  io.sockets.connected[user_key].emit('message', {
			 'message': words_list[Math.round(Math.random() * (words_list.length - 0) + 0)]
		  });
		  users[user_key].status = 1;
		  if(users_waiting[user_key])
			 delete users_waiting[user_key];
		}
		else{ //if they're not connected, delete them
		  if(users_waiting[user_key]) delete users_waiting[user_key];
		  if(users[user_key]) delete users[user_key];
		  if(disponible_users[user_key]) delete disponible_users[user_key];
		}
	  }
	},10000);


	//interval for inactive users
	setInterval(function(){ //delete inactive users

	  for(user in users){
		if(users[user].status == 1){
		  //if player is generally playing
		  if((new Date().getTime() - users[user].last_active > 60000) && users[user].playing_type == 2){
		
			if(io.sockets.connected[user]){
			  console.log('delete_user');

			  delete users[user];
			  delete users_waiting[user];
			  delete disponible_users[user];
		  
			}
			else{
		
			  delete users[user];
			  delete users_waiting[user];
			  delete disponible_users[user];
		  
			}
		  } 
		}
	  }

	}, 10000);


	//set interval for update disponible users and delete junk
	setInterval(function(){
	 for(user in users){
	   if(users[user].playing_type == 0 && users[user].lifes > 0){
		 if(!disponible_users[user]) disponible_users[user] = users[user]; //add user to list
	   }else{
		 if(disponible_users[user]) delete disponible_users[user]; //delete if not waiting
	   }
	   
	   if(!users[user].database) delete users[user];
	 }
	},5000);

}

worker();

module.exports = worker;
