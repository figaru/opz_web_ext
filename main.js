let LOGIN_REQUIRED = true;
let SYNC_REQUIRED = true;

let AUTH_STATE = {
	error: false,
	message: "You have been logged in!",
}

let CONNECTION_ERROR = false;

const API_SYNC = "https://api.opz.io/v1/sync";
const API_AUTH = "https://api.opz.io/v1/auth";
const API_BEAT = "https://api.opz.io/v1/logs";

let TRACKING = false;

let sync = {};
let user = {};

//chrome.storage.local.remove(["sync", "user"]);

//##################################### RUNTIME MESSAGES ####################################	
var openCount = 0;
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name == "panel") {
      if (openCount == 0) {
        console.log("Panel window opening.");

        if(CONNECTION_ERROR){
        	console.log("Connection error");
        	port.postMessage({action: "error", msg: AUTH_STATE['message'] });
        	return;
        }

        if(LOGIN_REQUIRED){
           	port.postMessage({action: "login"});
        }else{
        	port.postMessage({action: "main", data: user});
        }

      }
      openCount++;

      port.onMessage.addListener(function(request, sender){
      	console.log(request);
      	if(request.action === "auth"){
      		let data = JSON.stringify({
	        	user: request.cred.user,
	        	pass: request.cred.pass
	        });

	        loginRequest(data).then(response => {
	        	if(!LOGIN_REQUIRED)
        			port.postMessage({action: "main"});
	        }).catch(error => {
		        port.postMessage({action: "error", msg: AUTH_STATE['message'] });
	        });
      	}else if(request.action === "data"){

      		if(SYNC_REQUIRED){
      			syncRequest().then(syncResponse =>{
					//if loggin not required -> sync data
					if(!LOGIN_REQUIRED)
						chrome.storage.local.get("user", function(items){
							if(items.user){

								SYNC_REQUIRED = false;

								user = items.user;

								port.postMessage({action: "data", data: user, tracking: TRACKING});
							}else{

							}
						});			
				}).catch(error => {
					console.log(error);
				});
      		}else{
      			port.postMessage({action: "data", data: user, tracking: TRACKING});
      		}

      	}else if(request.action === "tracking"){
      		TRACKING = request.status;
      	}else if(request.action === "disconnect"){
      		LOGIN_REQUIRED = true;
      		SYNC_REQUIRED = true;
      		chrome.storage.local.remove(["sync"]);
      		port.postMessage({action: "login"});
      	}

      });

      port.onDisconnect.addListener(function(port) {
          openCount--;
          if (openCount == 0) {
            console.log("Last Panel window closing.");
          }
      });
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	console.log(request);

	if(TRACKING){
		console.log("send beat");
		let beat = {};
		let tabDomain = sender.tab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
        let tabTitle = sender.tab.title;
        let tabUrl = sender.tab.url;

        beat.title = tabTitle;
        beat.domain = tabDomain;
        beat.url = tabUrl;
        beat.timestamp = Math.floor((new Date).getTime() / 1000);

        console.log(beat);

        beatRequest(beat);

	}else{
		console.log("NOT tracking");
	}


	sendResponse({
        farewell: "received"
    });
});

//############################# INITIALIZE ADDON ############################################
function init(){
	console.log("started");

	//get necessary api sync data if exists.
	chrome.storage.local.get("sync", function(items){
		if(items.sync){

			LOGIN_REQUIRED = false;

			sync = items.sync;

			syncRequest().then(syncResponse =>{
				//if loggin not required -> sync data
				if(!LOGIN_REQUIRED)
					chrome.storage.local.get("user", function(items){
						if(items.user){

							SYNC_REQUIRED = false;

							user = items.user;
						}else{

						}
					});			
			}).catch(error => {
				console.log(error);
			});

		}else{
			//login required -> do nothing but wait
		}
	});

}

init();

//##################################### REQUESTS ########################################
function beatRequest(beat){
    // Promises require two functions: one for success, one for failure
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();


        var data = {
	        'token': user['token'],
	        'data': {
	            'domain': beat['domain'],
	            'url': beat['url'],
	            'title': beat['title'],
	            'time': beat['timestamp']

	        }
	    };

	    console.log(data);

	    data = JSON.stringify(data); //Convert to actual Json

        xhr.open('POST', API_BEAT, true);
        xhr.setRequestHeader("Content-type", "application/json");

        xhr.onload = () => {
            if (xhr.status === 200) {
                // We can resolve the promise
                console.log(xhr.response);
                resolve(xhr.response);
            } else {
                // It's a failure, so let's reject the promise
                reject(xhr);
            }
        
        }

        xhr.onerror = () => {
            // It's a failure, so let's reject the promise
            reject("Unable to load RSS");
        };

        xhr.send(data);
    });
}

function syncRequest(){
    // Promises require two functions: one for success, one for failure
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', API_SYNC);

        xhr.setRequestHeader("Content-type", "application/json");
        xhr.setRequestHeader("X-User-Id", sync.userId);
        xhr.setRequestHeader("X-Auth-Token", sync.authToken);

        xhr.onload = () => {
            if (xhr.status === 200) {
                // We can resolve the promise

                let syncResponse = JSON.parse(xhr.response);

                if(syncResponse.status === "success"){
					
					setStorage("user", syncResponse.data).then(() => {
						console.log("stored data");

						SYNC_REQUIRED = false;

						resolve();
					}).catch(() => {	
						console.log("failed to store");
					});


				}else if(syncResponse.status === "error"){
					sync = {};

					chrome.storage.local.remove("sync");

					LOGIN_REQUIRED = true;
				}else{
					console.log(syncResponse.message);
				}

                resolve();
            } else {
                // It's a failure, so let's reject the promise
                reject("Unable to load RSS");
            }
        
        }

        xhr.onerror = () => {
            // It's a failure, so let's reject the promise
            reject("Unable to load RSS");
        };

        xhr.send();
    });
}

function loginRequest(data){
    // Promises require two functions: one for success, one for failure
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        data = JSON.parse(data);

        xhr.open('GET', API_AUTH + "?user=" + data.user + "&pass=" + data.pass, true);
        xhr.setRequestHeader("Content-type", "application/json");

        xhr.onload = () => {
        	console.log(xhr);
            if (xhr.status === 200) {
              // We can resolve the promise

              let response = JSON.parse(xhr.response);
      				if(!response.error){


      					setStorage("sync", response).then(() => {
      						console.log("stored data");

      						LOGIN_REQUIRED = false;

      						init();

      						resolve();
      					}).catch(() => {	
      						console.log("failed to store");
      					});

      				}else{
      					AUTH_STATE['error'] = true;
	            	AUTH_STATE['message'] = "The credentials entered are not valid.";

	                // It's a failure, so let's reject the promise
	                reject(xhr.response);
      				}
            }else if(xhr.status === 401) {
            	AUTH_STATE['error'] = true;
            	AUTH_STATE['message'] = "The credentials entered are not valid.";

              // It's a failure, so let's reject the promise
              reject(xhr.response);
            }
        
        }

        xhr.onerror = () => {
        	console.log(xhr);

        	CONNECTION_ERROR = true;
        	AUTH_STATE['error'] = true;
            AUTH_STATE['message'] = "Error! Unable to connect to server.";
            // It's a failure, so let's reject the promise
            reject("Unable to load RSS");
        };

        xhr.send(data);
    });
}

//###################################### STORAGE #########################################
function setStorage(key, data) {
	return new Promise(function (resolve, reject) {
	    // Check that there's some code there.
	    if (!key || !data) {
	      console.log('Error: No value specified');
	      reject();
	    }

	    let store = {};

		store[key] = data;

	    // Save it using the Chrome extension storage API.
	    chrome.storage.local.set(store, function() {
	      // Notify that we saved.
	      resolve();
	    });
	});
}

function getStorage(key){
	chrome.storage.local.get(key, function(items) {
	    sync = items.sync;
	});
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
     	var storageChange = changes[key];
  		console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is "%s".',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue);

  		if(key === "sync")
  			sync = storageChange.newValue;
  		else if(key === "user")
  			user = storageChange.newValue;
    }
});
