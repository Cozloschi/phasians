  function statusChangeCallback(response) {
   //do nothing for the moment
  }
  function checkLoginState(){
  
  }

window.fbAsyncInit = function() {
  FB.init({
    appId      : '168233820191307',
    cookie     : true,  // enable cookies to allow the server to access 
                        // the session
    xfbml      : true,  // parse social plugins on this page
    version    : 'v2.2' // use version 2.2
  });

  // Now that we've initialized the JavaScript SDK, we call 
  // FB.getLoginStatus().  This function gets the state of the
  // person visiting this page and can return one of three states to
  // the callback you provide.  They can be:
  //
  // 1. Logged into your app ('connected')
  // 2. Logged into Facebook, but not your app ('not_authorized')
  // 3. Not logged into Facebook and can't tell if they are logged into
  //    your app or not.
  //
  // These three cases are handled in the callback function.

 // FB.getLoginStatus(function(response) {
   // statusChangeCallback(response);
  //});


  };

  // Load the SDK asynchronously
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

  // Here we run a very simple test of the Graph API after login is
  // successful.  See statusChangeCallback() for when this call is made.
  function button_pressed_facebook(element) {
    $(element).text('Asteptati..');
    FB.login(function(response){
	
      FB.api('/me', function(response) { 
        console.log(response); 	
		$.post('/api',{'action':'facebook', 'username':response.name, 'facebook_account': response.id}, function(response){
	      
		  if(response.status == 'done'){
		    window.location.href = '/'; 
		  }else{
		    $(element).text('Eroare, reincercati');
		  }
	    },'JSON');
      });
    },{scope: 'public_profile'});
  }

 