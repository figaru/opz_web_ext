let debugPageConnection = chrome.runtime.connect({
    name: "debug"
});

let optionsPageConnection = chrome.runtime.connect({
    name: "options"
});

debugPageConnection.onMessage.addListener(function(request, sender){
    //console.log(request);
    if(request.action === "data"){

        $("#authInput").val(request.data.auth);
        $("#beatInput").val(request.data.beat);
        $("#syncInput").val(request.data.sync);
        $("#tokenInput").val(request.data.token);
        $("#debug_mode").prop('checked', request.data.bool);
    }
});

optionsPageConnection.onMessage.addListener(function(request, sender){
    //console.log(request);
    if(request.action === "data"){
        $("#nameField").html(request.data.name);
        $("#companyField").html(request.data.company);
        $("#tokenField").html(request.data.token);
    }else if(request.action === "check" && request.debugMode){
        $("#container-options").removeClass();
        $("#container-options").addClass("debug");
        debugPageConnection.postMessage({action: "data"});
    }else{
        $("#container-options").removeClass();
        $("#container-options").addClass("options");
        optionsPageConnection.postMessage({action: "data"});
    }
});

$('document').ready(function() {
    //############################ OPTIONS PAGE ###############################
    optionsPageConnection.postMessage({action: "check"});


    //############################# DEBUG MODE #################################
    //debugPageConnection.postMessage({action: "data"});

    $('#debug_mode').on('change', function(){ // on change of state
        //console.log("switch");
        if(this.checked) // if changed state is "CHECKED"
        {	
        	//validate private hours and days
            if(true){
                debugPageConnection.postMessage({action: "debug", status: true});

            }else{
                $("#status").prop('checked', false);
            }   
        }else{
           debugPageConnection.postMessage({action: "debug", status: false});
        }
    });

    $('#authInput').on('change', function(){ // on change of state
        if(this.value != "")
            debugPageConnection.postMessage({action: "auth", val: this.value});
    });

    $('#syncInput').on('change', function(){ // on change of state
        if(this.value != "")
            debugPageConnection.postMessage({action: "sync", val: this.value});
    });

    $('#beatInput').on('change', function(){ // on change of state
        if(this.value != "")
            debugPageConnection.postMessage({action: "beat", val: this.value});
    });

    $('#tokenInput').on('change', function(){ // on change of state
        debugPageConnection.postMessage({action: "token", val: this.value});
    });

});