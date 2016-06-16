var express = require('express');
var fs = require('fs');
var connection = require('../mysql.js');
var router = express.Router();
var generatePassword = require('password-generator');
var nodemailer = require('nodemailer');

var redis = require('redis');
var client = redis.createClient(); //creates a new client

router.get('/', function(req, res) {

  if(req.query.action == 'check_file'){
    if(typeof req.query.file !== 'undefined'){
  
      if(fs.existsSync('public/words/' + req.query.file)){
	    res.json({'status':200});
	    res.end();
	  }
	  else{
	    res.json({'status':404});
	    res.end();
	  }

    }
  }
  
  if(req.query.action == 'get_text'){
    
	var file = req.query.file.search('-') > -1 ? req.query.file.replace('-','/') : req.query.file;
	console.log(file);
    
    if(fs.existsSync('public/'+file)){
      res.json({
	    'status':'done',
		'text'  : fs.readFileSync('public/'+file).toString()
	  });
	  res.end();
	}else{
	  res.json({
	    'status':'error'
	  });
	  res.end();
	}
  
  }
  
  if(req.query.action == 'get_words'){
    
	var file = req.query.word.substr(-2)+'.txt';
	
	var content = fs.readFileSync('public/words/'+file).toString().split('|').slice(1,18);
	
	var html = '';
	
	for(i = 0;i<content.length; i++)
	 html += "<li>"+content[i]+"</li>";
	
    res.json({'output_html':html});
	res.end();
  }
  
});


/* login and register api */
router.post('/', function(req, res){

   
   if(req.body.action == 'reset_password'){
   
      if(!req.session.password_sent){
	    console.log('working');
	    res.json({'status':'error'});
		return;
	  }
    
      connection.query('Select * from users where email = ? limit 1', req.body.email, function(err, rows){
	   
	    if(!err){
		  
		  var new_password = generatePassword(12, false);
          
		  //mailer
			var transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'phasiansgame@gmail.com',
					pass: 'phasians123456'
				}
			}, {
				// default values for sendMail method
				from: 'phasiansgame@gmail.com',
				headers: {
					'Phasians-password-reset': '123'
				}
			});
			transporter.sendMail({
				to: req.body.email,
				subject: 'Resetare parola',
				text: 'Buna ! Tocmai ti-ai resetat parola in joc, noua ta parola este :' +new_password
			}, function(error, info){
			  
			    if(!error){
				  connection.query("Update users set password = ? where email = ?", [new_password, req.body.email], function(err,rows){ 
				    
					if(!err){
					  req.session.password_sent = 1;
				      res.json({'status':'done'});
					}else{
					  res.json({'status':'error'});
				      console.log(err);
					}
				  });
				}else{
				  console.log(error);
				  res.json({'status':'error'});
				}
			
			});
		 
		 
		
		}
	   
	  });
   }
 
   if(req.body.action == 'logout'){
      res.cookie('logged_pha', '', { maxAge:-1});
	  res.json({'status':'done'});
   }
 
   if(req.body.action == 'registration'){ //register
    
	 var query_obj = {'username' : req.body.username, 
	                  'email'    : req.body.email,
					  'password' : req.body.password};
					  
					  
	 connection.query('Select * from users where email = "'+ query_obj.email +'" limit 1',function(err,rows){
	   
	    if(!err){
		  if(rows.length == 0){
		   
		    connection.query("Insert into users SET ?", query_obj ,function(err, rows){
			 
			  if(!err){ 
			    res.cookie('logged_pha', rows.insertId, {httpOnly:true});
				res.json({'status':'done'});
			  }else 
			    res.json({'status':'error'});
				
				
			});
		   
		  }else
		    res.json({'status':'email_'});
		}else
		  res.json({'status':'error'});
		
	 });
					  
   }
   
   if(req.body.action == 'login'){ //login
   
     var query_obj = {'email'   : req.body.email,
	                  'password': req.body.password};
					  
	
	 // console.log("Select * from users where email = '" + query_obj.email + "' and password = '" + query.obj.password + "' limit 1");
					
	 connection.query("Select * from users where email = ? and password = ?", [query_obj.email, query_obj.password] , function(err, rows){
	   //console.log(err);
	   if(err){
	     res.json({'status':'error'});
	   }
	   else{
	     if(rows.length == 1){
		   
		   //configure
		   rows[0].database = rows[0].id;
		   
		   client.set(rows[0]['id'], JSON.stringify(rows[0]));
           client.expire(rows[0]['id'], 60*60*24*2);
		 
		   res.cookie('logged_pha', rows[0]['id'], {httpOnly:true});
		   res.json({'status':'done'});
		 }else
		   res.json({'status':'wrong'});
	   }
	 });
    
   
   
   }
   
   
   if(req.body.action == 'facebook'){
   
   
     var query_obj = {'username' : req.body.username, 
					  'facebook_account' : req.body.facebook_account};
					  	  
	 connection.query('Select * from users where facebook_account = "'+ query_obj.facebook_account +'" limit 1',function(err,rows){
	    if(!err){
		  if(rows.length == 0){
		   
		    connection.query("Insert into users SET ?", query_obj ,function(err, rows){
			 
			  if(!err){
                
				var new_user_data = {'username': query_obj.username, 'email':'', money:0, 'level':1, 'lifes':3, 'database':rows.insertId}
				//configure
		   
		        client.set(new_user_data.database, JSON.stringify(rows[0]));
                client.expire(new_user_data.database, 60*60*24*2);	
				
			    res.cookie('logged_pha', rows.insertId, {httpOnly:true});
				res.json({'status':'done'});
			  }else{ 
			    res.json({'status':'error'});
				
			  } 
			});
		   
		  }else{
		    //configure
		    rows[0].database = rows[0].id;
		   
		    client.set(rows[0]['id'], JSON.stringify(rows[0]));
            client.expire(rows[0]['id'], 60*60*24*2);
			
		    res.cookie('logged_pha', rows[0]['id'], {httpOnly:true});
		    res.json({'status':'done'});
			
		  }
		}else{
		  res.json({'status':'error'});
		}
	 });
   
   }
   
   if(req.body.action == 'set_no_life_time'){ 
     console.log(req.body.timestamp);
	 console.log(typeof req.body.timestamp);
    
	 connection.query("Update users set no_life_timestamp = ?, lifes = ? where id = ?", [req.body.timestamp, req.body.invitations, req.cookies.logged_pha],function(err,rows){
         console.log(err);
		 console.log(rows);
		 
		 if(!err)
		   res.json({'status':'done'});
		 else 
		   res.json({'status':'error'});
     });	 
     
   }

});

module.exports = router;
