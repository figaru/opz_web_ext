 var inject = '(' + function() {
        if (typeof window.RTCPeerConnection !== "undefined") {
            window.RTCPeerConnection = undefined;
        }
        if (typeof window.webkitRTCPeerConnection !== "undefined") {
            window.webkitRTCPeerConnection = undefined;
        }
    } + ')();';
var isInIFrame = window.frameElement && window.frameElement.nodeName == "IFRAME";
    if(isInIFrame==true){
        var script = document.createElement('script');
        script.src = chrome.extension.getURL('./scripts/gmail/hangouts.js');
        (document.head || document.documentElement)
        .appendChild(script);
        script.parentNode.removeChild(script);

        alert("is in frame################");
    }
else
    {
        /*var script = document.createElement('script');
        script.textContent = inject;
        (document.head || document.documentElement)
        .appendChild(script);
        script.parentNode.removeChild(script);*/
    }