console.log("started");


function handleMessage(request, sender, sendResponse) {
  console.log("Message from the content script: " +
    request.greeting);
  sendResponse({response: "Response from background script"});
}

chrome.runtime.onMessage.addListener(handleMessage);