let backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
});

backgroundPageConnection.onMessage.addListener(function(request, sender){
	//console.log(request);
	

	if(request.action === "login"){
		$("#form-login").removeClass("loading");
		$("#body").removeClass();
		$("#body").addClass("action-login");
	}else if(request.action === "main"){
		setupMain();
	}else if(request.action === "data"){
		setupData(request.data, request.tracking);
	}else if(request.action === "error"){
		$("#form-login").removeClass("loading");
		$("#body").removeClass();
		$("#body").addClass("action-login");


		$("#form-login").addClass("error");
		$("#login-error").html(request.msg);
	}	
});

function setupMain(){
	$("#form-login").removeClass("loading");
	$("#body").removeClass();
	$("#body").addClass("action-main");

	backgroundPageConnection.postMessage({action: "data"});
}

function setupData(data, status){
	//lets setup user display data
	$("#data-company").html(data.company);
	$("#data-name").html(data.name);
	$("#status").prop('checked', status);
}

$('document').ready(function() {

	$("#form-login").submit(function( event ) {
		event.preventDefault();
	    //do not reload page;

	    $("#form-login").removeClass("loading").addClass("loading");

	    let cred = {
	        user: $('#form-user').val(),
	        pass: $('#form-pass').val(),
	    }

	    backgroundPageConnection.postMessage({action:"auth", cred: cred});

	    return false;
	});

	$('#status').on('change', function(){ // on change of state

        if(this.checked) // if changed state is "CHECKED"
        {	
        	//validate private hours and days
            if(true){
                backgroundPageConnection.postMessage({action: "tracking", status: true});
            }else{
                $("#status").prop('checked', false);
            }   
        }else{
           backgroundPageConnection.postMessage({action: "tracking", status: false});
        }
    });

	$('#dashboard').on('click', function(){ // on change of state
        chrome.tabs.create({ url: "https://opz.io/dashboard" });
    });

    $('#disconnect').on('click', function(){ // on change of state

        backgroundPageConnection.postMessage({action: "disconnect"});
    });

});

function validatePrivate(){
    var today = new Date().getDay();
    var now = new Date().getHours();

    var settings = appParams.user;

    for(let day of settings.privateDays){
        if(today == day){
            return false;
        }
    }

    for(let hour of settings.privateHours){
        if(now == hour){
            return false;
        }
    }


    return true;
}