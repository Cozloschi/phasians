$(document).ready(function(){
  $.get('/api',{'action':'get_text','file':'about_content-about.html'}, function(response){
    
	var $element = $('div.left_holder');
	
	if(response.status == 'done'){
	  $element.html(response.text);
	}else{
	  $element.html('Error');
	}
  },'JSON');
});