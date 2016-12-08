//##################################### TABS ##########################################
let SCRIPT = chrome.extension.getURL("scripts/inject.js");

class Tabs {
  constructor() {
    //console.log("tabs class constructed");
    this.addUpdateListener();
  }

  addUpdateListener(){
    //working injection
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

        //console.log(tab);
        if(!TRACKING || tab.icognito);
          return;

        //check to see if update is new webpage
        if(changeInfo.url){
          chrome.tabs.executeScript(tab.id, {
            file: SCRIPT,
            matchAboutBlank: true,
            runAt: "document_end" 
          }, function(resolve, reject){
            if(resolve)
              console.log("Tab uppdated - injected");
          });
        }
    });
  }

  removeUpdateListener(){
    chrome.tabs.onUpdated.addListener(function() {
      console.log("removed update listener");
    });
  }
  
  injectAll(){
    //console.log("injecting all");

    //verify - Tracking enabled
    if(!TRACKING)
      return;

    //inject content scripts to all tabs
    chrome.tabs.query({}, function(tabs){
      for(let i = 0; i < tabs.length; i++){
        let tab = tabs[i];

        if(tab.icognito)
          return;
        
        //ignore tabs containing "chrome://"
        if(!tab.url.contains("chrome://"))
          chrome.tabs.executeScript(tab.id, {
            file: SCRIPT,
            matchAboutBlank: false,
            runAt: "document_end" 
          }, function(){
            //console.log("injected");
          });
      }//end loop
    });
  }

  inject(tabId){
    chrome.tabs.executeScript(tabId, {
      file: SCRIPT,
      matchAboutBlank: true,
      runAt: "document_end" 
    }, function(){
      console.log("injected");
    });
  }
}// END CLASS TABS