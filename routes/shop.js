var express = require('express');
var connection = require('../mysql.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  if(req.cookies.logged_pha){ //if user is logged in
    
	console.log(req.cookies.logged_pha);
   
    connection.query("Select * from users where id = ?",req.cookies.logged_pha,function(err,rows){
	  if(err)
	   res.end('Error, try again');
	  else{
	   if(rows.length == 0)
	     res.end('Error');
	   else{
	   
	     console.log(rows[0].money);
	       		
	     res.render('shop', { description: 'Joaca Phasians. Invita-ti prietenii si incepeti sa jucati Phasians, cunoscutul joc fazan al copilariei.' ,title: 'Phasians - Fazan online', 'money':Number(rows[0].money), 'level':rows[0].level, 'username':rows[0].username, 'lifes':Number(rows[0].lifes), 'database_id':rows[0].id });
	  
	    }
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
