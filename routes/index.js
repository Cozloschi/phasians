var express = require('express');
var connection = require('../mysql.js');
var router = express.Router();

var redis = require('redis');
var client = redis.createClient(); //creates a new client

/* GET home page. */
router.get('/', function(req, res) {
  if(req.cookies.logged_pha){ //if user is logged in
    
	client.get(req.cookies.logged_pha, function(err, reply) {
     
	  if(err || !reply){
	    res.writeHead(302, {
          'Location': '/register'
        });
        res.end();   
	  }else{
	    var rows = JSON.parse(reply);		
	    var lifes = rows.lifes;
		var timestamp = Number(new Date().getTime());
		if((timestamp - rows.timestamp > 43200000) && lifes == 0){ //12 hours passed 43200000
		   lifes = 3;
		   
		   rows.lifes = 3;
		   //update rows
		   client.set(req.cookies.logged_pha, rows);
		   
		   console.log("should work");
        }	     
		
		if(!rows.lifes)
		  rows.lifes = 0;
		  
	    res.render('index', { description: 'Joaca Phasians. Invita-ti prietenii si incepeti sa jucati Phasians, cunoscutul joc fazan al copilariei.' ,title: 'Phasians - Fazan online', money:rows.money, level:rows.level, username:rows.username, lifes:rows.lifes, database_id:rows.database, invitations:rows.accept_invitations });
	  }
	
    });
	

  
  }else{ //else redirect to register
  
    res.writeHead(302, {
      'Location': '/register'
    });
    res.end();
	
  }
  
});
  


module.exports = router;
