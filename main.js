let LOGIN_REQUIRED = true;
let SYNC_REQUIRED = true;

let sync = {};
let user = {};

chrome.storage.local.remove(["sync", "user"]);

//##################################### RUNTIME MESSAGES ####################################	
var openCount = 0;
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name == "panel") {
      if (openCount == 0) {
        console.log("Panel window opening.");

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
	        	username: request.cred.user,
	        	password: request.cred.pass
	        });

	        loginRequest(data).then(response => {
	        	if(!LOGIN_REQUIRED)
        			port.postMessage({action: "main"});
	        }).catch(error => {

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

								port.postMessage({action: "data", data: user});
							}else{

							}
						});			
				}).catch(error => {
					console.log(error);
				});
      		}else{
      			port.postMessage({action: "data", data: user});
      		}

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
function syncRequest(){
    // Promises require two functions: one for success, one for failure
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', "http://localhost:5000/api/v1/sync");

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


        xhr.open('POST', "http://localhost:5000/api/v1/login", true);
        xhr.setRequestHeader("Content-type", "application/json");

        xhr.onload = () => {
            if (xhr.status === 200) {
                // We can resolve the promise

                let response = JSON.parse(xhr.response);

				if(response.status === "success"){
					setStorage("sync", response.data).then(() => {
						console.log("stored data");

						LOGIN_REQUIRED = false;

						init();

						resolve();
					}).catch(() => {	
						console.log("failed to store");
					});

				}else{
					console.log(response.status);
					console.log(response);
				}
            } else {
                // It's a failure, so let's reject the promise
                reject(xhr.response);
            }
        
        }

        xhr.onerror = () => {
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





/*
function handleMessage(request, sender, sendResponse) {
  console.log("Message from the content script: " +
    request.greeting);
  sendResponse({response: "Response from background script"});
}

chrome.runtime.onMessage.addListener(handleMessage);
*/


/*var connections = {};

chrome.runtime.onConnect.addListener(function (port) {

    var extensionListener = function (message, sender, sendResponse) {

        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name == "init") {
          connections[message.tabId] = port;
          return;
        }

	// other message handling
    }

    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        port.onMessage.removeListener(extensionListener);

        var tabs = Object.keys(connections);
        for (var i=0, len=tabs.length; i < len; i++) {
          if (connections[tabs[i]] == port) {
            delete connections[tabs[i]]
            break;
          }
        }
    });
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
      var tabId = sender.tab.id;
      if (tabId in connections) {
        connections[tabId].postMessage(request);
      } else {
        console.log("Tab not found in connection list.");
      }
    } else {
      console.log("sender.tab not defined.");
    }
    return true;
});

// Create a connection to the background page
var backgroundPageConnection = chrome.runtime.connect({
    name: "panel"
});

backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});*/