// Create an immediately invoked functional expression to wrap our code
(function() {
  //encode
  var Base64 = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

  //private config file
  //more secure to temporarily save runtime data
  var config = {
    //auth and sync states
    today: new Date().getDay(),
    now: new Date().getHours(),
    local_storage: false,
    manage_storage: true,
  };

  // Define our constructor
  this.OPZ = function() {
    // Define option defaults
    this.defaults = {
      // Extension name
      name: 'Opzio',
      // Extension version
      version: "1.0.0",
      // Time for idle state of the browser
      // The user is considered idle if there was
      // no activity in the browser for x seconds
      detectionIntervalInSeconds: 60,
      //api_generic link
      api_generic: "http:localhost:3030/v1",
      //synchronize user settings and data
      api_sync: "http://localhost:3030/v1/sync",
      //authenticate user
      api_auth: "http://localhost:3030/v1/auth",
      //heartbeat endpoint
      api_beat: "http://localhost:3030/v1/logs",
    }
  }

  //INITIALIZE PLUGIN 
  OPZ.prototype.init = function(params, promise){
    console.log("########## OPZ PlUGIN ##############")
    console.log("#-> Initializing @ ", new Date());

    //####################### TASK 1 SYSTEM START ############################
    //validate localstorage
    //check if the plugin contains a generated unique app id from server
    //request one if not -> if failed -> generate a personal one
    
    //validate localstorage
    if(window.localStorage) config.local_storage = true; //default is false

    //check if app_id exists
    //if not -> request unique app id
    var app_id = get('app_id');
    if(app_id){ console.log("#-> App id: ", app_id) }
    else{
      this.unique(function(err, data){
        if(err){ console.log(err) }
        else{ console.log("#-> App id generated: ", data.app_id) }
      });
    }

    //###################### TASK 2 SYNCHRONIZE #############################
    var sync = get('sync');
    if(sync){
      this.sync(function(err, data){
        if(err){ console.log(err) }
        else{ console.log(data) }
      });
    }else{
      console.log("authentication required");
    }

  }

  //setup response for function promise 
  function callback(err, data, promise) {
    if(err && !err.code && !err.status && !err.reason)
      err = {code: 400, status:"failed", reason: "The endpoint seems to be incorrect" };

    // Return a new promise.
    if (typeof callback == 'function') { // make sure the callback is a function
        return promise(err, data);
    }
  }

  //validate http status code response
  function validResponse(code, data){
    if(code === 200 && data){
      return true;
    }else{
      return false;
    }
  }

  //encode data
  function encode(data){
    if(typeof data === "object")
        data = JSON.stringify(data);

    data = Base64.encode(data);

    return data;
  }

  //decode data
  function decode(data){
      if(data){
        data = Base64.decode(data);

        try{
          data = JSON.parse(data);
        }catch(e){ /*ignore*/ }
      }

      return data;
  }

  function clear(){
    window.localstorage.clear();
  }

  function reset(){
    window.localstorage.removeItem("sync");
    window.localstorage.removeItem("user_details");
  }

  //set local storage
  function set(key, data){
    if(config.local_storage){
      window.localStorage.setItem(key, encode(data) );
    }

    return "storage not available"
  }

  //get local storage
  function get(key){
    if(config.local_storage){
      var data = window.localStorage.getItem(key);

      return decode(data);
    }

    return "storage not available"
  }



  //##################################### REQUESTS #############################################
  //send heartbeat
  OPZ.prototype.heartbeat = function(data, promise) {
    //data as object
    $.post({
      url: this.defaults.api_beat,
      data: data,
      success: (res) => {
        if(validResponse(res.statusCode, res.data)){
            set('app_id', res.data.app_id);
            //success callback
            callback(null, {code: res.statusCode, status: res.status, app_id: res.data.app_id}, promise);
        }else{
          //error callback
          callback({code: res.statusCode, status: res.status, reason: res.reason}, null, promise);
        }
      },
      error: (xhr, status, err) => {
        callback("An error occured. Server not responding.", null);
      }
    });
  }


    //AUTHENTICATE PLUGIN WITH VALID USER 
  OPZ.prototype.auth = function(params, promise) {
    var app_id = get('app_id');

    if(typeof params !== "object" || !params.user || !params.pass)
      return promise('Invalid Parameters', null);

    $.post({
      url: this.defaults.api_auth,
      headers: {
        "x-app-id": app_id
      },
      data: {
        user: params.user,
        pass: params.pass,
        app_id: app_id,
      },
      success: (res) => {
        console.log(res);
        if(validResponse(res.statusCode, res.data)){
          set('sync', res.data);
          //success callback
          callback(null, {code: res.statusCode, status: res.status, data: res.data}, promise);
        }else{
          //error callback
          callback({code: res.statusCode, status: res.status, reason: res.reason}, null, promise);
        }
      },
      error: (xhr, status, err) => {
        callback("An error occured. Server not responding.", null, promise);
      }
    });
  }
  //SYNCHRONIZE USER SETTINGS AND INFO
  OPZ.prototype.sync = function(promise) {
    var sync = get('sync');
    var app_id = get('app_id');

    if(typeof sync !== "object" || !sync.auth_token || !sync.user_id || !app_id)
      return callback('Authentication required before synchronization', null);

    //console.log(sync.auth_token);
    $.get({
      url: this.defaults.api_sync,
      headers: {
        "x-auth-token": sync.auth_token,
        "x-user-id": sync.user_id,
        "x-app-id": app_id
      },
      success: (res) => {
        if(validResponse(res.statusCode, res.data)){
          set('user_details', res.data);
          //config.user_details = get('user_details');
          //success callback
          console.log(res);
          callback(null, {code: res.statusCode, status: res.status, data: res.data}, promise);
        }else{
          //error callback
          callback({code: res.statusCode, status: res.status, reason: res.reason}, null, promise);
        }
      },
      error: (xhr, status, err) => {
        callback("An error occured. Server not responding.", null, promise);
      }
    });
  }

  //GENERATE UNIQUE KEY
  OPZ.prototype.logout = function(promise) {
    var sync = get('sync');
    var app_id = get('app_id');

    $.get({
      url: this.defaults.api_generic + "/logout",
      headers: {
        "x-auth-token": sync.auth_token,
        "x-user-id": sync.user_id,
        "x-app-id": app_id
      },
      success: (res) => {
        if(validResponse(res.statusCode, res.data)){
            reset();
            //success callback
            callback(null, {code: res.statusCode, status: res.status, data: res.data}, promise);
        }else{
          //error callback
          callback({code: res.statusCode, status: res.status, reason: res.reason}, null, promise);
        }
      },
      error: (xhr, status, err) => {
        callback("An error occured. Server not responding.", null);
      }
    });
  }

  //GENERATE UNIQUE KEY
  OPZ.prototype.unique = function(promise) {
    $.get({
      url: this.defaults.api_generic + "/unique",
      success: (res) => {
        if(validResponse(res.statusCode, res.data)){
            set('app_id', res.data.app_id);
            //success callback
            callback(null, {code: res.statusCode, status: res.status, app_id: res.data.app_id}, promise);
        }else{
          //error callback
          callback({code: res.statusCode, status: res.status, reason: res.reason}, null, promise);
        }
      },
      error: (xhr, status, err) => {
        callback("An error occured. Server not responding.", null);
      }
    });
  }//########################### END REQUESTS ###################################
}());