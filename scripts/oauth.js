/*// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details){
	chrome.storage.local.get("appId", function(items) {
	    if(typeof items['appId'] !== 'undefined'){
	    	//console.log(items['appId']);
	    	config.appId = items['appId'];
	    }else{
	    	var appKey = guid();
	    	chrome.storage.local.set({appId: appKey});
	    	config.appId = appKey;
	    }
	});
});*/

var opz = undefined;

$(function(){

	opz = new OPZ();

	opz.init();

	//chrome.storage.local.set({appId: ""});

/*	//####################### TASK 1 SYSTEM START ############################
	//check if the plugin contains a generated unique app id from server
	//request one if not -> if failed -> generate a personal one
	chrome.storage.local.set({appId: ""});
	chrome.storage.local.get("appId", function(items) {
	    if(typeof items.appId !== 'undefined' && items.appId){
	    	//console.log(items['appId']);
	    	opz.config.app_id = items['appId'];
	    }else{
    		opz.unique("", function(err, data){
	    		if(err){
	    			console.log(err);
	    		}else{
	    			console.log("APP ID GENERATED: " + data.app_id);
	    			chrome.storage.local.set({appId: data.app_id});
	    			opz.config.app_id = data.app_id;
	    		}
	    	});
	    }
	});*/

});



function authenticate() {
  opz.auth({
  	user: "daniel.abrantes@dengun.com",
  	pass: "123"
  }, function(err, data){
  	if(err){
  		console.log(err);
  	}{
  		console.log(data);
  		//chrome.local.storage.set({sync: data.data});
  	}
  });
}

function sync2(){
	opz.sync(function(err, data){
		if(err){
			console.log(err);
		}else{
			console.log(data);
			//chrome.local.storage.set({sync: data.data});
		}
	});
}


function testOpz(){
	chrome.storage.local.set({appId: ""});
	chrome.storage.local.get("appId", function(items) {
	    if(typeof items.appId !== 'undefined' && items.appId){
	    	//console.log(items['appId']);
	    	opz.config.app_id = items['appId'];
	    }else{
    		opz.unique("", function(err, data){
	    		if(err){
	    			console.log(err);
	    		}else{
	    			//console.log(data);
	    			chrome.storage.local.set({appId: data.app_id});
	    			opz.config.app_id = data.app_id;
	    		}
	    	});
	    }
	});
}

function synchronize() {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
  	var url = "http://localhost:3030/app/sync";

 	$.get({
		url: url,
		headers: {
			"x-auth-token": auth.auth_token,
			"x-user-id": auth.user_id,
			"x-app-id": config.appId
		},
		success: (res) => {
		  resolve();
		},
		error: (xhr, status, err) => {
		  //console.log(status);
		  reject();
		}
	});
  });
}