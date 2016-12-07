class Tabs {


  constructor() {
    console.log("tabs class constructed");
  }
  
  /*get area() {
    return this.calcArea();
  }

  calcArea() {
    return this.height * this.width;
  }*/

  injectAll(){
    //verify - Tracking enabled
    if(!TRACKING)
      return;

    //inject content scripts to all tabs
    chrome.tabs.query({}, function(tabs){
      for(let i = 0; i < tabs.length; i++){
        let tab = tabs[i];
        
        //ignore tabs containing "chrome://"
        if(!tab.url.contains("chrome://"))
          var p1 = chrome.tabs.executeScript(tab.id, {
            file: "scripts/inject.js",
            matchAboutBlank: false,
            runAt: "document_end" 
          }, function(resolve, reject){
            if(reject)
              console.log(reject)
          });
      }//end loop
    });
  }
}
