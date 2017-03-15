var j = document.createElement('script');
j.src = chrome.extension.getURL('./scripts/gmail/jquery.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('./scripts/gmail/gmail_api.js');
(document.head || document.documentElement).appendChild(g);


var m = document.createElement('script');
m.src = chrome.extension.getURL('./scripts/gmail/gmail_main.js');
(document.head || document.documentElement).appendChild(m);

//console.log("injected");

var hangouts = false;


window.addEventListener('message', function(event) {
	// Only accept messages from same frame
	if (event.source !== window) {
		return;
	}

	var message = event.data;

	// Only accept messages that we know are ours
	if (typeof message !== 'object' || message === null || !message.isHangouts) {
		return;
	}else{
		/*if(!hangouts){
			//console.log("hangouts: " + message.isHangouts);

	        var iframe = $("iframe.a7A")[0];

	        //console.log(iframe);

	        var doc = null;
	           if(iframe.contentDocument) doc = iframe.contentDocument;
	           else if(iframe.contentWindow) doc = iframe.contentWindow.document;
	           else if(iframe.document) doc = iframe.document;
	         
	        if(doc == null) throw "Document not initialized";

	        doc.open();
	        var script   = doc.createElement("script");
	        script.type  = "text/javascript";
	        //script.src = './scripts/gmail/hangouts.js';
	        script.text  = "alert('voila!');"
	        doc.appendChild(script);
	        doc.close();

	        hangouts = true;
	    }*/
	}

	// Only accept messages that we know are ours
	if (typeof message !== 'object' || message === null || !message.hangouts) {
		return;
	}else{
		console.log(message.hangouts.msg);
	}

	//console.log(message);

	// Only accept messages that we know are ours
	if (typeof message !== 'object' || message === null || !message.gmailbeat) {
		return;
	}else{
		try{
			chrome.runtime.sendMessage({
			    greeting: "gmail",
			    data: message.gmailbeat
			});
		}catch(e){
			//console.log(e);
		}
	}
});