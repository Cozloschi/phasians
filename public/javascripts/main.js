var code = 'first';
 
$(document).ready(function(){


  //setup headers for all ajax calls
  $.ajaxSetup({
	 headers: { 'x_csrf_token': $('meta[name="csrf-token"]').attr('content') }
  });



  // VARS
  var socket = {};
  if(window.location.href.split('/')[3] == ''){
	  var socket = new io('http://phasians.com:1337');
  }
  
  
  var myid;
  var money = money_t ? money_t : 0; //load global var from template
  var level = level_t ? level_t : 1; //load global var from template
  var lifes =  lifes_t ? lifes_t : 3; // load globar var from template
  var connected_users = {};
  var username = username_t ? username_t : 'undefined';
  var countdown = 20;
  var countdown_stop = 1;
  var can_send = 0;
  var current_word = '';
  var sound_on = 1; 
  var my_database_id = database_id_t ? database_id_t : 0;  // load globar var from template
  var playing_type = 0; //0, 1 , 2
  var play_with = '';
  var play_with_username = '';
  var can_win = 0; // you can't win in the first minute
  var can_win_in = 60;//seconds
  
  var moneyInterval;
  
  var can_win_interval;
  
  
  //sounds
  var notification = new Howl({
    urls: ['sound/notification.wav']
  });  
  var alarm = new Howl({
    urls: ['sound/alarm.mp3']
  });
  var invitation = new Howl({
    urls: ['sound/invitation.mp3'],
  });
  
  //if user have no database
  if(my_database_id == 0) window.location.href = '/register';
  
  var life_options =  { no_lifes : lifes > 0 ? 0 : 1,
                        text  : "Ai pierdut deja de 3 ori ! Pentru a invita prieteni la joc din nou, trebuie sa astepti 12 ore. Daca nu doresti sa astepti, poti trimite 6 invitatii prietenilor pe Facebook. <br /> <button id='facebook' > Trimite Invitatii </button>"}	 




  //console.log(lifes);
  if(lifes == 0){
   info_popup(life_options.text);
   //console.log('sadasda'); 
  }
  
  socket.on('connect', function(){ //get my socket id
    myid = socket.io.engine.id;
  });
  
  
  //beat
  socket.on('beat', function(data){
    message('L-ai inchis pe ' + data.username);
	
	setTimeout(function(){
	 
	  stop_game(true);
	  socket.emit('status', {'status':0, 'id': myid, 'userid':myid, 'level':level, 'money': money, 'database':my_database_id, 'username':username, 'playing_type':playing_type, 'lifes':lifes});
      
	},2000);
	
  });
  
  //lost
  socket.on('lost', function(data){
    message('Ai fost inchis de ' + data.username);
	
	if(playing_type == 1){
	     
		 lifes = lifes -1 > 0 ? lifes-1: 0;
		 update_ui(money, level, 0, true, lifes);
		 if(lifes == 0)
		    info_popup(life_options.text);

	}
	
	setTimeout(function(){
	 
	  stop_game(); 

	},2000);
  });
  
  //you where disconnected
  socket.on('you_were_disconnected',function(){
    alert('Cineva s-a conectat cu contul tau, ai fost deconectat');
  });

  socket.emit('username-database', {'username':username, 'database':my_database_id, 'money':money, 'level': level, 'lifes':lifes}); //send username and database to server list

  
  //give me users list
  socket.emit('give_me_users',{});  

  
  //give me users list every 10 seconds if i'm not playing
  setInterval(function(){
    if(playing_type == 0){
	  socket.emit('give_me_users', {});
	}
  },5000);
  
  socket.on('disconnected', function(data){ //user disconnected
    
	message(data.username + ' s-a deconectat.');
	stop_game(true);
	playing_type = 0;
	//change status
	socket.emit('status', {'status':0, 'id': myid, 'userid':myid, 'level':level, 'money': money, 'database':my_database_id, 'username':username, 'playing_type':playing_type});

  });  
  
  socket.on('gave_up', function(data){ //user disconnected
    
	message(data.username + ' a renuntat.');
	stop_game(true);
	playing_type = 0;
	//change status
	socket.emit('status', {'status':0, 'id': myid, 'userid':myid, 'level':level, 'money': money, 'database':my_database_id, 'username':username, 'playing_type':playing_type});

  });
  
  
  socket.on('get_users', function(data){ //when client 
    console.log(data);
	connected_users = data.users;
	if($('input.search_user').val() == ''){
		//add list to tempalte
		var $saved = $('ul.users_list');
		
		//mark all as unnactive 
		$saved.find('li').each(function(){
		  $(this).attr('innactive','1');
		});
		
		var i = $saved.find('li').length; 
		
		$.each(connected_users,function(key, user){
		  if(typeof user.username !== 'undefined' && myid !== key){
			if(++i >= 20) return; //limit to 20 users to show
			if($saved.find('li#'+key).length == 0)
			 $('ul.users_list').append("<li innactive='0' database_id='"+user.database+"' id='"+key+"'>"+user.username+" <span class='active'></span></li>");
		    else
			 $saved.find('li#'+key).attr('innactive','0');
			}
	    });

		//add no results
        if(i == 0) $('ul.users_list').html('<span class="text">Nu sunt utilizatori online</span>');		
		else{
		  $('span.text').remove();
		  //read the new html and delete unnecesary <li>
		  $('ul.users_list').find('li').each(function(){
		    if($(this).attr('innactive') == '1')
		      $(this).remove();
		  });
		}
	}
  });
  
  
  socket.on('invitation_recivied', function(data){
   
     if(sound_on == 1)
	  play_sound_invitation();
  
     message(data.from.username +' te invita. <button accept_id="'+ data.socket_id +'" class="accept"> Accepta [ <span class="count_invitation">10</span> ]', true);
     
	 play_with_username = data.from.username;
	 
	 var $span = $('span.count_invitation');
	 var countDown_interval = setInterval(function(){
	   
	   if(Number($span.text()) == 0){
	    clearInterval(countDown_interval);
	    hide_message();
		socket.emit('send_invitation_status', {'to': $('button.accept').attr('accept_id'),'status':'500'});
	   }else
	    $span.text(Number($span.text()) -1);
	   
	 },1000);
	 
  });
  
  socket.on('invitation_status', function(data){
    var $button  = $('button.start_game');
	  
	if(data.status == '500'){
	  $('ul.users_list li.active').removeClass('active');
	  $button.text('Userul nu raspunde.').removeAttr('disabled');
	  
	  setTimeout(function(){
	    $button.text('Porneste Jocul General');
	  },3000);
	}else{
	  
	  //show info message
	  info('Acum joci cu ' +play_with_username);
	

	  $button.text('Incepe jocul..');
	  
	  playing_type = 1;
	  play_with = $button.attr('play_with');
	  
	  console.log(play_with);
	  
	  
	  setTimeout(function(){
	  
	    $button.text('Porneste jocul general ... ');
	    socket.emit('start_game',{'playing_type':playing_type, 'play_with':play_with});
	    start_game();
	    
		
	  },1000);
	
	}
  });
  
  // ====================================================================== UI 
  
  
  
  //swipe for mobile 
  $('div.overlay').on('swipedown',function(){ $('div.sidebar').addClass('open'); } );
  $('div.overlay').on('swipeup',function(){ $('div.sidebar').removeClass('open'); } );
  
  
  
  //logout
  
  $(document).on('click','button.logout', function(){
    
	var $saved = $(this);
	
	$saved.text('Se incarca..');
	
	$.post('/api',{'action':'logout'}, function(response){
	  
	  if(response.status == 'done')
	    window.location.href = '/register';
	  else
	    $saved.text('Eroare..');
	  
	},'JSON');
	
   
  });
  
  // search for users
  $(document).on('keyup', 'input.search_user', function(){
     
	 if(life_options.no_lifes == 0){
		 var search_w = $(this).val();
		 $('ul.users_list').html('');
		 var i = 0;
		 console.log(connected_users);
		 $.each(connected_users,function(key, user){
		   if(typeof user.username !== 'undefined' && (user.username.toLowerCase().search(search_w.toLowerCase()) > -1)){
			 $('ul.users_list').append("<li database_id='"+user.id+"' id='"+key+"'>"+user.username+" <span class='active'></span></li>");
			 if(++i >= 20) return; //limit to 50 users to show
		   }
		 });
		 
		 if(i == 0) $('ul.users_list').html('<span class="text">Fara rezultate</span>');
     }
	 
      
  });
  
  //give up
  $(document).on('click','button.give_up', function(){
    playing_type = 0;
	if(play_with != ''){
	  
      socket.emit('give_up',{'to':play_with});
	  lifes = lifes >= 1 ? lifes - 1 : 0; 
	  update_ui(money, level, 0, true, lifes);
	  if(lifes == 0){
	     life_options.no_lifes = 1;
		 info_popup(life_options.text);
	  }
	  
	}
    stop_game();
  });
  
  //accept invitation
  $(document).on('click','button.accept', function(){

    //show info message
	info('Acum joci cu ' +play_with_username);
	
	//hide skip button
	$('button.skip').hide();
	$('button.send').css('width','100%');
  
    playing_type = 1; //playing with someone
	
	socket.emit('send_invitation_status', {'to':$(this).attr('accept_id'), 'status':'200'});
	
	play_with = $(this).attr('accept_id');
	
	socket.emit('start_game',{'playing_type':playing_type, 'play_with':play_with});
	start_game();
	
	hide_message();
	
  });
  
  //click the user
  $(document).on('click','ul.users_list li',function(){
  
    if(life_options.no_lifes == 0){
		var user = $(this).text();
		if($(this).hasClass('active')){
		  $(this).removeClass('active');
		  //alert($(this).attr('class'));
		  $('button.start_game').text('Joaca in general').removeAttr('play_with');
		}
		else{
		  $('ul.users_list').find('li.active').removeClass('active');
		  $('button.start_game').text('Joaca cu ' + user).attr('play_with',$(this).attr('id'));
		  $(this).addClass('active');
		  play_with_username = user;
		}
    }else{
	    $(this).hide();
	    info_popup(life_options.text);
	}
	
	return;
  });
  
  //nicescroll
  $("ul.users_list").niceScroll();
  
  //start the game generally
  $('button.start_game').click(function(){
	
	if(!$(this).attr('play_with')){ // play generally
	  
	  info('Joc General');
	  
	  //show sari_peste button
	  
      $('button.skip').show();
	  $('button.send').css('width','50%');
	  
	  //change status
	  playing_type = 2;
	  start_game();
      socket.emit('start_game',{'playing_type':playing_type});	
    }else{ //play with someone
	  //hide 'sari peste' button
      $('button.skip').hide();
	  $('button.send').css('width','100%');
	   
	  //change status
	  $(this).text('Invitatie trimisa, asteptati.').attr('disabled',true);
	  socket.emit('send_invitation', {'to': $(this).attr('play_with')});
	}
  });
  
  //clear input on click
  $('input.text').click(function(){ $(this).val(''); });
  
  //send on enter
  $('input.text').keypress(function(e) {
        if(e.which == 13) {
		 $('button.send').trigger('click');
		}
  });
  
  $('div.status').click(function(){
    if($(this).hasClass('stop')){
	  $(this).removeClass('stop');
	  //sound on
	  sound_on = 1;
	}
	else{
	  //sound off
	  sound_on = 0;
	  $(this).addClass('stop');
	}
  });
  
  //invite facebook friends
  $(document).on('click','button#facebook',function(){
    FB.ui({ method: 'apprequests', 
     message: 'Incearca si tu jocul Phasians. Ai jucat cand erai mic celebrul joc Fazan ? Phasians e acelasi lucru, e fazanul copilariei tale adaptat pentru vremurile noastre.'}, function(response){
        if(response.to){
			var invitations = Math.ceil(response.to.length/2);
			if(invitations > 6)
			 invitations = 3;
			if(invitations > 0){
			  $.post('/api',{'action':'set_no_life_time','timestamp': new Date().getTime(), 'invitations':invitations}, function(response){
			   
				if(response.status == 'done'){
				
				   $('div.info_popup').hide();
				   $('ul.users_list').show();
				   
				   life_options.no_lifes = 1;
				   
				}
			 
			  });
			}
	   }
     });
  });
  
  
  //used words
  if(typeof localStorage['used_words'] == 'undefined')
    localStorage['used_words'] = '';      
  
  //============================================== functions
  
  function waiting(){
    $('div.text').html(" <img src='/images/loading.gif' class='loading' /> Se asteapta cuvantul ..");  
  }
  
  function stop_game(won){
  
    //check if is last word
	var $word = $('div.text');
	
	$('button.start_game').removeAttr('disabled');
	
	if(!won){
		if($word.find('img').length == 0){
		  $.get('/api', {'action':'get_words', 'word': $word.text().split(':')[0].trim()},function(response){
			$('div.text_holder').html("<h1>Puteati folosi urmatoarele cuvinte pentru a raspunde : </h1> <ul class='collumns'>"+response.output_html+"</ul>");
		  },'JSON');
		}
    }else{
      $('div.text_holder').html("<h1 style='text-align:center'>Ai castigat! </h1>");
    }	
	
    //clear used words
	localStorage['used_words'] = '';
    
    clearInterval(moneyInterval); //clear money interval
    countdown_stop = 1;
    playing_type = 0;//make user disponible
	play_with = '';
	
	waiting();
	$('div.overlay, button.start_game').fadeIn();
	
	$('button.start_game').removeAttr('play_with');
	
    //give me users 
	socket.emit('give_me_users',{});  
    
	//clear interval
	clearInterval(can_win_interval);
	can_win_in = 60;
	
	//send user status
	socket.emit('status', {'status':1, 'id': myid, 'userid':myid, 'level':level, 'money': money, 'database':my_database_id, 'username':username, 'playing_type':0, 'lifes':lifes});
  }
  
  function start_game(){
	countdown = 20;
	update_ui(money,level,countdown);
  
    $('button.start_game, div.overlay').fadeOut('fast');

	localStorage['used_words'] = '';
	  
	can_win_interval = setInterval(function(){
	  $('div.close_in').text('Il poti inchide in '+(--can_win_in)+' secunde.');
	  
	  if(can_win_in == 0){
	    can_win = 1;
		clearInterval(can_win_interval);
		$('div.close_in').text('Acum il poti inchide.');
	  }
	},1000);
  }
  
  
  //show message
  function message(text,bool,hide){
    var $message = $('div.message');
    $message.html(text).animate({
	  'bottom': 0
	},200);
	
	if(!bool){
	  setTimeout(function(){
	    $message.animate({
	      'bottom': -45
	    },200);
	  },2000);
	}
	
  }
  
  function info(text){
    var $info = $('div.info');
	$info.find('span.info_text').text(text);
	$info.show();
  }
  
  function hide_info(text){
    var $info = $('div.info');
	$info.hide();
  }
  
  //hide message
  
  function hide_message(){
    var $message = $('div.message');
	$message.animate({
	  'bottom': -45
	},200);
  }
  
  
  function update_ui(money, level, countdown, phsin, lifes){
	
	var $money = $('div.money');
	var $level = $('div.level');
    
	if(lifes)
	 $('div.lifes').html(lifes+' ');
		
	//update money
	if(Number($money.text()) != money){
	  socket.emit('update', {'money':money});
	  $money.text(money).effect("bounce",{times:3},200);
	  if(phsin){
        $money.animate({
		  color: '#ff0000'
		},200,function(){
		  
		  $money.animate({
		    color: '#62bcfa'
		  },200);
		
		});
      }	  
	}

	if(Number($level.text() != Number(level))){
	 socket.emit('update', {'level':level});
	 if(Number($level.text()) > Number(level)){
	   $('div.level').text(level);
	   message('Ai scazut un nivel!'); 
	 }else{
	   $('div.level').text(level);
	   message('Ai urcat un nivel'); 
 	 }
	}
	
	$('input.countdown').val(countdown);

  }
  
  
  function info_popup(html){
    var $info_pop = $('div.info_popup');
	$info_pop.show().html(html);;
	
	$('ul.users_list').hide(); //hide users list
  }
  
  function check_mobile(){
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
	  return true;
	return false;
  }
  
  function play_sound_notification(){
    notification.play();
  }
  
  function play_sound_alarm(){ 
    alarm.play();
  }  
  
  function play_sound_invitation(){ 
    invitation.play();
  }
  
  waiting(); //first waiting
  
 
  
  //SOCKET IO
  socket.on('message', function(data){
    
	if(data.message){
	    $('input.text').val('');
	 
	    if(sound_on == 1)
		  play_sound_notification();
	
		can_send = 1;
		countdown_stop = 0;
		$('button.send').removeAttr('disabled');
		$('button.skip').removeAttr('disabled');
		
		code = data.message.substr(data.message.length-2);
		current_word = data.message;
		
		$('div.text').html(data.message+ ' : <span>' + code + '</span>');
		
    }
  });
  
  
  $('button.skip').click(function(){
  
    var $saved = $(this);
    
	if(can_send == 1){

		 $saved.attr('disabled',true); //disable send button 
		 		 
		 //update money
		 money = money - Math.ceil(level/2);
		 level = Math.ceil((money - level*2)/100);
		 
		 //don't go under 0
		 level =  level < 1 ? 1 : level;
		 money = money < 0 ? 0 : money;
		
		 update_ui(money, level, countdown < 15 ? 15 : countdown);
		 
		 //stop everything
		 can_send = 0;
	     countdown_stop = 1;
		 
		 //change status
		 socket.emit('status', {'status':0, 'id': myid, 'userid':myid, 'level':level, 'money': money, 'database':my_database_id, 'username':username, 'playing_type':playing_type, 'lifes':lifes});
		
         waiting();		
    }
	 
  });
  
  $('button.send').click(function(){
  
  
        var $saved = $(this); 

		var text = $('input.text').val().toLowerCase();
		
		$('button.send').text('Se incarca..');
		
		if((code.toLowerCase() == text.substr(0,2) || code == 'first') && text != current_word){
		
		    
		    //check if this word exists but stop countdown
			
			countdown_stop = 1;
			
			$.get('/words/'+text.substr(0,2)+'.txt', function(response){
			
			
			  var beat = false;// you just defeated a person ?
			
			  countdown_stop = 0;

			  if(response.split('|').indexOf(text) > -1){
			  	
				
				//check if this word is used in past 5 hours, 5 hours = 18 000 s
			
				var absolute_time = new Date().getTime();
				
				try{ //try to parse localStorage json or reset it
				  var used_words_json = JSON.parse(localStorage['used_words']);
				}catch(e){
				  var used_words_json = {};
				}
				
				

				 			
				//update money
				money = money + Math.ceil(countdown/3) + Math.ceil(level/2);
				
				//update level
				level = Math.ceil((money - level*2)/100);
				
				//don't go under 0
				level =  level < 1 ? 1 : level;
				money = money < 0 ? 0 : money;
				
				//reset countdown
				var rest = countdown > 5 ? 5 : countdown; //seconds to get 
				countdown = countdown > 10 ? (countdown + rest) <= 30 ? countdown + rest : countdown : 15; // add to countdown, if not maximum
				
				//check if you are 'phasinus'
				$.get('/api', {'action':'check_file','file': text.substr(text.length-2) + '.txt'}, function(response){
				  console.log(response);
				  if(response.status == 404){
				    money = money + (level * 2);
				    update_ui(money, level, countdown, true);
					
					if(can_win == 1) //if one minute passed
					  beat = true;
					else{
					  $saved.text('Nu poti inchide in primul minut.');
					  return false;
					}
				  }
				  else //update ui
                    update_ui(money, level, countdown);
					
					
				  if(typeof used_words_json[text] == 'undefined'){ //add word to list
				    used_words_json[text] = absolute_time;
				
				  }else{ // check if you can use it again		
				    if((absolute_time - used_words_json[text]) < 3600000){ // you can't use this word
					  $saved.text('Ai mai folosit acest cuvant.');
					  return false;
				    }else{
					  used_words_json[text] = absolute_time; //update new time 
				    }
				  }	
				  
				  localStorage['used_words'] = JSON.stringify(used_words_json);
				
				  console.log(localStorage['used_words']);
				  
				  socket.emit('send', {'status':0,'message': text, 'userid':myid, 'level':level, 'money': money, 'database': my_database_id, 'beat':beat, 'username':username, 'playing_type':playing_type, 'playing_with':play_with, 'lifes':lifes });
			      //console.log(username);
				  
				  								
					
				  $saved.attr('disabled',true); //disable send button
					
					
				  $saved.text('Trimis');
				  setTimeout(function(){
						$saved.text('Trimite');
				  },1000);
					
				  //stop everything
				  can_send = 0;
				  countdown_stop = 1;
					
				  clearInterval(moneyInterval); //clear money interval

				  waiting(); //waiting for next word		
				
				},'JSON');
				
	
			  
			  
			  }else{
			    $('button.send').text('Cuvant inexistent');
				countdown_stop = 0; //countinue countdown
			  }
			
			});
			

		}
		else
			$(this).text('Cuvant Gresit');

    	
  });
  
  //countdown
  var countDown_switch = 0;
  var $countDown_element = $('input.countdown');
  var countDown_inteval = setInterval(function(){
  
    if(countdown_stop == 0 && playing_type > 0){
   
      if(countdown == 0){
	    if(countDown_switch == 0){
		  countDown_switch = 1; //don't come here second time
		  //if countdown == 0, calculate new level and new money
		  money = money - (level*5);
		  
		  level = Math.ceil((money - level*2)/100);
		  
		  //don't go under 0
		  level = level < 1 ? 1 : level;
		  money = money < 0 ? 0 : money;
			
		  update_ui(money, level, 0, true);
		  
		  //create interval for money,
		  
		  moneyInterval = setInterval(function(){
		    
			money = money - level*5;
			level = Math.ceil((money - level*2)/100);
		  
		    //don't go under 0
		    level = level < 1 ? 1 : level;
		    money = money < 0 ? 0 : money;
			
			if(money == 0){
			  socket.emit('give_up',{'to':play_with});
			  stop_game();
			}
		    
			update_ui(money, level, 0, true);
			
		  },10000);
		  
		  
        }
      }else{
	     
		if(countdown <=5){ //add shaking
		  
		  if(countdown == 5 && sound_on == 1) //play_sound
		   play_sound_alarm();
		   
		  $('img.timer').effect("bounce",{times:2},200);
		
	    }
	   
	    countdown--;
	  }
   
      $countDown_element.val(countdown);
    }else{
	  countDown_switch = 0;
	}
  },1000);
  
  
  
  
});
  
