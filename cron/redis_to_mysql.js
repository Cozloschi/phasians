var redis = require('redis');
var connection = require('../mysql.js');

var client = redis.createClient();

client.keys("*", function(err, list){
   var count = 0;
   function update(id){
     if(Number(id)){
	  // console.log(id);
       var data = client.get(id, function(err, reply){
	     var reply = JSON.parse(reply);
             console.log(reply);
		 
		 connection.query("Update users set money = ?, level = ?, lifes = ? where id = ?", [reply.money, reply.level, reply.lifes, id], function(err, status){
		   ++count;
		   if(list[count] && Number(list[count]))
		    update(list[count]);		   
		 });
	   });
     }
   }
   update(list[count]);
});
