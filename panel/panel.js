let backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
});

backgroundPageConnection.onMessage.addListener(function(request, sender){
	console.log(request);
	

	if(request.action === "login"){
		$("#body").removeClass();
		$("#body").addClass("action-login");
	}else if(request.action === "main"){
		setupMain();
	}else if(request.action === "data"){
		setupData(request.data);
	}	
});

function setupMain(){
	$("#body").removeClass();
	$("#body").addClass("action-main");

	backgroundPageConnection.postMessage({action: "data"});
}
function setupData(data){
	//lets setup user display data
	$("#data-company").html(data.company);
	$("#data-name").html(data.name);
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