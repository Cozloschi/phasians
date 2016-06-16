$(document).ready(function(){
 
  //setup headers for all ajax requests
  $.ajaxSetup({
    headers: { 'x_csrf_token': $('meta[name="csrf-token"]').attr('content') }
  });
  
  //load text
  $.get('/api',{'action':'get_text', 'file':'about.html'}, function(response){
    
	var $element = $('div.left_holder');
	
	if(response.status == 'done'){
	
	  $element.html(response.text);
	
	}else{
	
	  $element.html('Error');
	  
	}
  },'JSON');
  
  //reset password
  $('button.reset_password').click(function(){
    
	var $saved = $(this);
	var email = $('input[name=reset_password_email]').val();
	
	$saved.text('.....');
	
	if(email.search('@') < 0 || email == ''){
	  $(this).text('Invalid');
	}
	else{
	
	  var obj = {'action': 'reset_password',
	             'email' : email};
				 
	  $.post('/api', obj,function(response){
	    
		if(response.status == 'done')
		  $saved.text('Done');
		else
		  $saved.text('Error');
	  
	  });
	}
  });
  
  
  $('span.lost_password').click(function(){
    $('div.overlay').show();
  });
  
  $('div.overlay').click(function(e){
    if($(e.target).is($('div.overlay')))
      $(this).hide();
  }); 
  
  $('button').click(function(event){
    event.preventDefault();
  });
  
  $('button.log, button.reg').click(function(){
    
	if(!$(this).hasClass('active')){
	 $('button.active').removeClass('active');
	 $(this).addClass('active');
	}
	
	if($(this).hasClass('reg')){
	 $('input[name=username], input[name=confirm_password]').show();
	}else{
	 $('input[name=username], input[name=confirm_password]').hide();
	}
  
  });
  
  $('button.send').click(function(){
    var $saved = $(this);
    var sw = 1;
    if($('button.reg').hasClass('active')){ //registration
	 
	 var obj = { 'username'   : $('input[name=username]').val(),
	             'email'      : $('input[name=email]').val(),
				 'password'   : $('input[name=password]').val(),
				 'c_password' : $('input[name=confirm_password]').val(),
				 'action'     : 'registration'};
				 
	 $.each(obj, function(index, val){ //check for empty values
	   if(val == ''){
	     $saved.text('Completeaza tot.');
	     sw = 0;
	   }
	 });
	 if(sw == 0) return;
	 
	 
	 if(obj.c_password !== obj.password){
	   $saved.text('Parolele nu se potrivesc');
	   return;
	 }
	 
	 if(obj.password.length < 5){ //check password length
	   $saved.text('Parola prea scurta');
	   return;
	 }
	 
	 if(obj.email.search('@') < 0 || obj.email.search('.') < 0){ //check for email
	   $saved.text('Email invalid');
	   return;
	 }
	 
	 $.post('/api',obj,function(response){
	    
		 if(response.status == 'done'){
		  // window.location.href = '/';
		 }
		 
		 if(response.status == 'email_'){
		   $saved.text('Acest email deja exista');
		 }
		 
		 if(response.status == 'error'){
		   $saved.text('Incearca din nou');
		 }
	   
	 },'JSON');

	
	}else{ //login
	
	  var obj = {'email'    : $('input[name=email]').val(),
				 'password' : $('input[name=password]').val(),
				 'action'   : 'login'};
				 
	  var sw = 1;
				 
	  $.each(obj, function(index, val){ //check for empty values
	    if(val == ''){
	       $saved.text('Completeaza tot.');
	       sw = 0;
		   return;
	    }
	  });
	  if(sw == 0) return;
	  
	  
	  $.post('/api', obj, function(response){
	  
	    if(response.status == 'error'){
		  $saved.text('Error')
		}
		
		if(response.status == 'wrong'){ 
		  $saved.text('Date gresite.');
		}
		
		if(response.status == 'done'){
		  $saved.text('Logat');
	          //window.location.href = '/';
		}
		
	  },'JSON');
	}
  
  });

});
