let ICOGNITO = chrome.extension.inIncognitoContext;
let IGNORE_NOTIFICATIONS = false;

let LOGIN_REQUIRED = true;
let SYNC_REQUIRED = true;

let AUTH_STATE = {
	error: false,
	message: "You have been logged in!",
}
let CONNECTION_ERROR = false;

//API endpoints
const API_SYNC = "https://api.opz.io/v1/sync";
const API_AUTH = "https://api.opz.io/v1/auth";
const API_BEAT = "https://api.opz.io/v1/logs";


let TRACKING = false;
let PRIVATE = false;

//get browser agent and version
let BROWSER = undefined;

//sync credentials and user details
let sync = undefined;
let user = undefined;
let DEBUG = undefined;
let goDebug = false;

//test data - workable hours and days
let today = new Date().getDay();
let now = new Date().getHours();

let doc_trigger = undefined;

navigator.browserSpecs = (function(){
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return {name:'IE',version:(tem[1] || '')};
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return {name:tem[1].replace('OPR', 'Opera'),version:tem[2]};
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return {name:M[0],version:M[1]};
})();


/*if (navigator.browserSpecs.name == 'Firefox') {
    // Do something for Firefox.
    if (navigator.browserSpecs.version > 42) {
        // Do something for Firefox versions greater than 42.
    }
}
else {
    // Do something for all other browsers.
}*/


function debug(pin){
  if(pin === 123 || pin === "123"){
    goDebug = true;
    chrome.runtime.openOptionsPage();
  }else if(pin === "setup"){
    let obj = {
      bool: false,
      sync: "http://localhost:3030/v1/sync",
      auth: "http://localhost:3030/v1/auth",
      beat: "http://localhost:3030/v1/logs",
      token: "",
    };
    chrome.storage.local.set({'debug': obj}, function() { console.log("Debug mode has been setup.")});
  }else{
    return;
  }
}

//#################################### GOOGLE DOCS ####################################

function googleDocs(req) {

  //console.log(req);

  var stamp = new Date().getTime();

  //console.log(doc_trigger);

  if(doc_trigger){

    let time_diff = diff(stamp, doc_trigger);

    if(time_diff.seconds >= 8){
      //console.log("trigger docs");
      if(req.tabId){
        chrome.tabs.get(req.tabId, function(tab){
          //console.log(tab);
          beat(tab);
        });
        doc_trigger = undefined;
      }
    }else{
      //console.log("not time yet");
    }

  }else{
    //console.log("doc trigger empty");
    doc_trigger = stamp;
  }


}

chrome.webRequest.onBeforeRequest.addListener(
  googleDocs,
  {urls: ["*://docs.google.com/*"]}
);

//#################################### GOOGLE MAIL ####################################

/*function googleMail(req) {

  


}

chrome.webRequest.onBeforeRequest.addListener(
  googleMail,
  {urls: ["*://mail.google.com/*"]}
);*/


//############################# INITIALIZE ADDON ############################################
function init(){
  //console.log("started");
  if(today === 0)
    today = 7;

  BROWSER = navigator.browserSpecs; //Object { name: "Firefox", version: "42" }

  chrome.windows.getCurrent(function(data){
    ICOGNITO = data.icognito;

    if(data.icognito){
      chrome.browserAction.disable();
      chrome.notifications.create({
          "type": "basic",
          "iconUrl": chrome.extension.getURL("img/icon_main.png"),
          "title": "Opzio Disabled",
          "message": "Opzio addon as been disabled to preserve your privacy while browsing in privacy mode."
      });

      return;
    }

  })

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

              if(user['workableWeekDays'].indexOf(today) >= 0 && user['workableHours'].indexOf(now) >= 0){
                //console.log("START TRACKING");
                TRACKING = true;
                status();
                chrome.notifications.create({
                    "type": "basic",
                    "iconUrl": chrome.extension.getURL("img/icon_main.png"),
                    "title": "Opzio Tracking Enabled",
                    "message": "You are currently tracking your workable times."
                });
              }

            }else{
              //no user details -> sync failed
            }
          });     
      }).catch(error => {
        //console.log(error);
      });

    }else{
      //login required -> do nothing but wait
    }
  });

  status();

  //chrome.storage.local.remove("debug", function(){});
  //setup debug
  chrome.storage.local.get("debug", function(items){
    if(items.debug){
      DEBUG = items.debug;
    }
  });//END DEBUG SETUP

}//END INIT()

init();


//STATUS update - updating browser action on track or private
function status(){
  if (!TRACKING) {
      //tabs.removeUpdateListener();
      chrome.browserAction.setBadgeBackgroundColor({
          color: "#CC0000"
      });
      chrome.browserAction.setBadgeText({
          text: " "
      });
  } else {
      tabs.injectAll();
      chrome.browserAction.setBadgeText({
          text: " "
      });
      if(PRIVATE){
        chrome.browserAction.setBadgeBackgroundColor({
          color: "#ffd640"
        });
      }else{
        chrome.browserAction.setBadgeBackgroundColor({
          color: "#009933"
        });
      }

      if(DEBUG && DEBUG.bool){
        chrome.notifications.create({
            "type": "basic",
            "iconUrl": chrome.extension.getURL("img/icon_debug.png"),
            "title": "Debug Mode Enabled",
            "message": "Welcome to debugger mode."
        });
        chrome.browserAction.setBadgeText({
            text: "Debug"
        });
      }
  }
}

//##################################### RUNTIME MESSAGES ####################################	

//----------------------------------- PANEL MESSAGING ------------------------------------
var openCount = 0;
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name == "panel") {
      if (openCount == 0) {

        //console.log("panel opening");
        if(CONNECTION_ERROR){
        	//console.log("Connection error");
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
              if(!LOGIN_REQUIRED){

                if(!user){
                  chrome.storage.local.get("user", function(items){
                    if(items.user){

                      SYNC_REQUIRED = false;

                      user = items.user;

                      port.postMessage({action: "data", data: user, tracking: TRACKING, private: PRIVATE});
                    }else{

                    }
                  });
                }else{
                  port.postMessage({action: "data", data: user, tracking: TRACKING, private: PRIVATE});
                }
              }

    				}).catch(error => {
    					//console.log(error);
    				});
      		}else{
      			port.postMessage({action: "data", data: user, tracking: TRACKING, private: PRIVATE});
      		}

      	}else if(request.action === "tracking"){
      		TRACKING = request.status;
          port.postMessage({action: "data", data: user, tracking: TRACKING, private: PRIVATE});

          if(!TRACKING)
            PRIVATE = false;

          status();
      	}else if(request.action === "private"){
          PRIVATE = request.status;
          status();
        }else if(request.action === "disconnect"){
      		LOGIN_REQUIRED = true;
      		SYNC_REQUIRED = true;
          TRACKING = false;
          PRIVATE = false;
      		chrome.storage.local.remove(["sync"]);
      		port.postMessage({action: "login"});
          status();
      	}

      });

      port.onDisconnect.addListener(function(port) {
          openCount--;
          if (openCount == 0) {
            //console.log("Last Panel window closing.");
          }
      });
    }else if(port.name === "debug"){
      port.onMessage.addListener(function(request, sender){
        if(request.action === "debug"){
          // Save it using the Chrome extension storage API.
            // Notify that we saved.
            chrome.storage.local.get("debug", function(items){
              items.debug.bool = request.status;
              chrome.storage.local.set({'debug': items.debug}, function() {});
            });
        }else if(request.action === "data"){
          // Save it using the Chrome extension storage API.
            // Notify that we saved.
            chrome.storage.local.get("debug", function(items){
              port.postMessage({action: "data", data: items.debug});
              goDebug = false;
            });
        }else if(request.action === "auth"){
          // Save it using the Chrome extension storage API.
            // Notify that we saved.
            chrome.storage.local.get("debug", function(items){
              items.debug.auth = request.val;
              chrome.storage.local.set({'debug': items.debug}, function() {});
            });
        }else if(request.action === "sync"){
          // Save it using the Chrome extension storage API.
            // Notify that we saved.
            chrome.storage.local.get("debug", function(items){
              items.debug.sync = request.val;
              chrome.storage.local.set({'debug': items.debug}, function() {});
            });
        }else if(request.action === "beat"){
          // Save it using the Chrome extension storage API.
            // Notify that we saved.
            chrome.storage.local.get("debug", function(items){
              items.debug.beat = request.val;
              chrome.storage.local.set({'debug': items.debug}, function() {});
            });
        }else if(request.action === "token"){
          // Save it using the Chrome extension storage API.
            // Notify that we saved.
            chrome.storage.local.get("debug", function(items){
              items.debug.token = request.val;
              chrome.storage.local.set({'debug': items.debug}, function() {});
            });
        }else if(request.action === "reset"){
          // Save it using the Chrome extension storage API.
            // Notify that we saved.
            let obj = {
              bool: false,
              sync: "http://localhost:3030/v1/sync",
              auth: "http://localhost:3030/v1/auth",
              beat: "http://localhost:3030/v1/logs",
              token: "",
            };

            chrome.storage.local.set({'debug': obj}, function() {});
        }
      });// END DEBUG LISTENER
    }else if(port.name === "options"){
      port.onMessage.addListener(function(request, sender){
        if(request.action === "data"){
          port.postMessage({action: "data", data: {name: user.name, company: user.company, token: user.token } });
        }else if(request.action === "check"){
          port.postMessage({action: "check", debugMode: goDebug});
        }
      });// END options LISTENER
    }
});


//------------------------------- CONTENT SCRIPT MESSAGING ----------------------------
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if(request.greeting === "gmail"){
    var tab = sender.tab;
    var data = request.data;

    if(data.action === "open"){
      tab.title = data.subject + " " + data.from + " " + data.from_email;
    }else if(data.action === "draft"){
      tab.title = data.subject + " " + data.to;
    }else if(data.action === "send"){
      tab.title = data.subject + " " + data.to;
    }

    //console.log(tab);
    beat(tab); 
  }else if(request.greeting === "beat"){
    beat(sender.tab);
  }else if(request.greeting === "hangouts"){
    //console.log(sender);
    //console.log(request.data);
    request.data.active = sender.tab.active;
    request.data.selected = sender.tab.selected;
    request.data.windowId = sender.tab.windowId;

    beat(request.data);
  }
});

function beat(tab){
  chrome.windows.get(tab.windowId, function(info){
    if(info.focused){
      if(TRACKING && !LOGIN_REQUIRED && !ICOGNITO && tab.active && tab.selected){
        //console.log("send beat");
        let beat = {};
        let tabDomain = tab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
            let tabTitle = tab.title;
            let tabUrl = tab.url;

            beat.title = tabTitle;
            beat.domain = tabDomain;
            beat.url = tabUrl;
            beat.timestamp = Math.floor((new Date).getTime() / 1000);

            beatRequest(beat);

      }else{

        //console.log("NOT tracking");

        /*sendResponse({
          status: false,
        });*/
      }
    }else{
      //console.log("not focused - ignore");
    }
  });
}
//########################################## CLASSES #################################

class Tabs {
  constructor() {
    //console.log("tabs class constructed");
    this.addUpdateListener();
    this.addActivatedListener();
  }

  addActivatedListener(){
    chrome.tabs.onActivated.addListener(function(activeInfo) {
        //console.log( this.getTab(activeInfo.tabId) );

        if(!TRACKING){
          //console.log("returning");
          return;
        }


        chrome.tabs.get(activeInfo.tabId, function(tab){
          //console.log(tab);

          //return tab;

          //ignore tabs containing "chrome://"
          if(tab.url.indexOf("chrome://") >= 0 || tab.url.indexOf("chrome-extension://") >= 0){
              //console.log("ignore");
          }else{
            if(TRACKING && !LOGIN_REQUIRED && !ICOGNITO){
              //console.log("send beat");
              let beat = {};
              let tabDomain = tab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
              let tabTitle = tab.title;
              let tabUrl = tab.url;

              beat.title = tabTitle;
              beat.domain = tabDomain;
              beat.url = tabUrl;
              beat.timestamp = Math.floor((new Date).getTime() / 1000);

              //console.log(beat);

              beatRequest(beat);

            }
          }
        });
        
    });
  }

  addUpdateListener(){
    //working injection
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

        //console.log(tab);
        if(!TRACKING || tab.incognito){
          //console.log("returning");
          return;
        }
        //check to see if update is new webpage
        if(changeInfo.url){
          if(/*changeInfo.url.indexOf("mail.google.com") >= 0 ||*/ changeInfo.url.indexOf("docs.google.com") >= 0 || changeInfo.url.indexOf("chrome://") >= 0 || changeInfo.url.indexOf("chrome-extension://") >= 0){
            //if "google" in url .... use requests
            //console.log(tab);
            //console.log("send beat google changed");
            //beat(tab);
          }else{
            chrome.tabs.executeScript(tab.id, {
              file: "scripts/inject.js",
              matchAboutBlank: false,
              runAt: "document_end"
            }, function(resolve, reject){
              //if(resolve)
                //console.log("Tab uppdated - injected");
            });
          }
        }
    });
  }

  removeUpdateListener(){
    chrome.tabs.onUpdated.addListener(function() {
      //console.log("removed update listener");
    });
  }

  static getTab(tabId){
    chrome.tabs.get(tabId, function(tab){
      //console.log(tab);

      return tab;
    });
  }
  
  injectAll(){
    //console.log("injecting all");

    //verify - Tracking enabled
    if(!TRACKING){
      return;
    }

    //inject content scripts to all tabs
    chrome.tabs.query({}, function(tabs){
      for(let i = 0; i < tabs.length; i++){
        let tab = tabs[i];

        if(tab.incognito){
          return;
        }
        
        //ignore tabs containing "chrome://"
        if(!tab.url.contains("chrome://")){
          //console.log(tab);
          chrome.tabs.executeScript(tab.id, {
            file: "scripts/inject.js",
            matchAboutBlank: false,
            runAt: "document_end" 
          }, function(){
            //console.log("injected");
          });
        }
      }//end loop
    });
  }

  inject(tabId){
    chrome.tabs.executeScript(tabId, {
      file: "scripts/inject.js",
      matchAboutBlank: true,
      runAt: "document_end" 
    }, function(){
      //console.log("injected");
    });
  }
}// END CLASS TABS



// CLASS CONSTRUCTOR
const tabs = new Tabs();


//##################################### REQUESTS ########################################
function beatRequest(beat){
    //send debug beat
    if(DEBUG.bool){
          //if debug mode change to local server
          beatDebug(beat);
    }

    // Promises require two functions: one for success, one for failure
    if(beat['url'].contains("chrome://")){
      //console.log("ignore");
      return;
    }

    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();


        var data = {
	        'token': user['token'],
	        'data': {
              'enforcePrivate': PRIVATE,
              'browser': BROWSER['name'],
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

        xhr.timeout = 2000;

        xhr.onload = () => {
            if (xhr.status === 200) {
                // We can resolve the promise
                //console.log(xhr.response);
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

        try{
          xhr.send(data);
        }catch(e){
          //console.log(error);
        }
    });
}

function beatDebug(beat){

    // Promises require two functions: one for success, one for failure
    if(beat['url'].contains("chrome://")){
      //console.log("ignore");
      return;
    }

    var xhr = new XMLHttpRequest();

    var data = {
      'token': user['token'],
      'data': {
          'enforcePrivate': PRIVATE,
          'browser': BROWSER['name'],
          'domain': beat['domain'],
          'url': beat['url'],
          'title': beat['title'],
          'time': beat['timestamp']

      }
    };


    if(DEBUG.token != ""){
      data.token = DEBUG.token;
    }

    //console.log(data);

    data = JSON.stringify(data); //Convert to actual Json


    xhr.open('POST', DEBUG.beat, true);

    xhr.setRequestHeader("Content-type", "application/json");

    xhr.timeout = 2000;

    xhr.onload = () => {
        if (xhr.status === 200) {
            // We can resolve the promise
            //console.log(xhr.response);
            //console.log()
        } else {
            // It's a failure, so let's reject the promise
            console.log(xhr);
        }

    }

    xhr.onerror = () => {
        // It's a failure, so let's reject the promise
        console.log("Unable to load RSS");
    };

    try{
      xhr.send(data);
    }catch(e){
      //console.log(error);
    }
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

            //console.log(syncResponse);

            if(syncResponse.status === "success"){
    					
    					chrome.storage.local.remove(["user"], function(){
                setStorage("user", syncResponse.data).then(() => {
                  //console.log("stored data");

                  SYNC_REQUIRED = false;

                  resolve();
                }).catch(() => {  
                  //console.log("failed to store");
                  reject();
                });
              });


				    }else if(syncResponse.status === "error"){
    					sync = {};

    					chrome.storage.local.remove("sync");

    					LOGIN_REQUIRED = true;

              reject();
    				}else{
    					//console.log(syncResponse.message);
              reject();
    				}

            //resolve();
          } else {
              // It's a failure, so let's reject the promise
              reject("Unable to load RSS");
          }
        
        }//end onload

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
            if (xhr.status === 200) {
              // We can resolve the promise

              let response = JSON.parse(xhr.response);

              console.log(response);
      				if(!response.error){

      					setStorage("sync", response).then(() => {
      						//console.log("stored data");

      						LOGIN_REQUIRED = false;

      						init();

      						resolve();
      					}).catch(() => {	
      						//console.log("failed to store");
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
	      //console.log('Error: No value specified');
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
    //console.log("changes");
    for (key in changes) {
     	var storageChange = changes[key];
  		/*console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is "%s".',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue);*/

      //console.log(storageChange.newValue);

      if(key === "sync"){
  			sync = storageChange.newValue;
      }else if(key === "user"){
  			user = storageChange.newValue;
      }else if(key === "debug"){
        DEBUG = storageChange.newValue;
        status();
      }
    }
});

//################################################# ALARM ###################################################
const syncDelay = 10.0;
const syncDelayPeriod = 10.0;
const reminderDelay = 60.0;
const reminderDelayPeriod = 60.0;

function alarmSync(){

  if(!LOGIN_REQUIRED){
    syncRequest().then(syncResponse =>{
      //sync user    
    }).catch(error => {
      //console.log(error);
    });
  }
}

function handleAlarm(alarmInfo) {
  if(alarmInfo.name === "reminder-alarm"){
    //console.log("reminder");
    if(TRACKING && !ICOGNITO){
      if(user['workableWeekDays'].indexOf(today) < 0 || user['workableHours'].indexOf(now) < 0 && !IGNORE_NOTIFICATIONS){
        chrome.notifications.create({
            "type": "basic",
            "iconUrl": chrome.extension.getURL("img/icon_main.png"),
            "title": "Tracking Reminder",
            "message": "Your are logging outside your tracking period, the system will not store these times. ",
            "buttons":[
              {"title": "Don't remind me"},
              {"title": "Review your privacy settings."},
            ]
        });
      }
    }

  }else if(alarmInfo.name === "sync-alarm"){
    alarmSync();
  }
}


chrome.alarms.create("sync-alarm", {
  delayInMinutes: syncDelay,
  periodInMinutes: syncDelay
});

chrome.alarms.create("reminder-alarm", {
  delayInMinutes: reminderDelay,
  periodInMinutes: reminderDelay
});

chrome.alarms.onAlarm.addListener(handleAlarm);


//########################################## NOTIFICATIONS #############################################
function notificationButton(event){
  //console.log(event);
}

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex){
  //0 = dont reminde me
  //1 = dismiss
  //console.log(buttonIndex);

  if(buttonIndex === 0)
    IGNORE_NOTIFICATIONS = true;
  else if(buttonIndex === 1)
    chrome.tabs.create({ url: "https://opz.io/" });

  chrome.notifications.clear(notificationId);
});

//########################################## PROTOTYPE ###############################################
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

//########################################## DATE DIFF ###############################################
function DateDiff(date1, date2) {
    this.days = null;
    this.hours = null;
    this.minutes = null;
    this.seconds = null;
    this.date1 = date1;
    this.date2 = date2;

    this.init();
  }

  DateDiff.prototype.init = function() {
    var data = new DateMeasure(this.date1 - this.date2);
    this.days = data.days;
    this.hours = data.hours;
    this.minutes = data.minutes;
    this.seconds = data.seconds;
  };

  function DateMeasure(ms) {
    var d, h, m, s;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;
    
    this.days = d;
    this.hours = h;
    this.minutes = m;
    this.seconds = s;
  };

  function diff(date1, date2) {
    return new DateDiff(date1, date2);
  };