function handleResponse(message) {
  console.log(`Message from the background script:  ${message.response}`);
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

function notifyBackgroundPage(e) {
	console.log("clicked");
  var sending = chrome.runtime.sendMessage({
    greeting: "Greeting from the content script"
  });
  sending.then(handleResponse, handleError);  
}



var button = document.getElementById("button");

button.addEventListener("click", function(){
	console.log("click");
    notifyBackgroundPage("test");
});