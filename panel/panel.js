
let backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
});

backgroundPageConnection.onMessage.addListener(function(request, sender){
	console.log(request);
	

	if(request.action === "login"){
		$("#body").removeClass();
		$("#body").addClass("action-login");
	}else if(request.action === "main"){
		$("#body").removeClass();
		$("#body").addClass("action-main");
	}

	setText("Response from main");
});

function setText(string){
	$("text").html(string);
}

$('document').ready(function() {

	$("#form-login").submit(function( event ) {
		event.preventDefault();
	    //do not reload page;

	    let cred = {
	        user: $('#form-user').val(),
	        pass: $('#form-pass').val(),
	    }

	    backgroundPageConnection.postMessage({action:"auth", cred: cred});

	    return false;
	});
});