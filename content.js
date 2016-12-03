// content.js
var didClick = false;
var didKey = false;
var didmove = false;
var focused = true;
var focusevent = null;
var focusclick = null;
var intervalevent = null;

start();

function tick() {
    if (didClick || didKey || didmove) {
        if (focused) {
            didClick = false;
            didKey = false;
            didmove = false;

            chrome.runtime.sendMessage({
                greeting: "beat"
            }, function(response) {
                console.log(response.farewell);
            });
        } else {
            //not focused do nothing
            didClick = false;
            didKey = false;
            didmove = false;
        }
    } // restart the timer
};

function start() { // use a one-off timer
    intervalevent = setInterval(tick, 10000);
};

function stop() {
    clearInterval(intervalevent);
};

//--------------Page OnScroll------------
//-------------MouseClick---------------
window.addEventListener("click", function() {
    didClick = true;
});

//-------------key pressed------------
window.addEventListener("keydown", function() {
    didKey = true;
});

window.addEventListener("mousemove", function() {
    didmove = true;
});

window.addEventListener("blur", function() {
    stop();
    didClick = false;
    didKey = false;
    didmove = false;
    focused = false;
    clearInterval(intervalevent);
});

var focusevent = window.addEventListener("focus", function(e) {
    start();
    chrome.runtime.sendMessage({greeting: "beat"}, function() {
        focused = true;
        didClick = false;
        didKey = false;
        didmove = false;
    });
});

window.addEventListener("mouseover", function() {
    focused = true;
});

window.addEventListener("mouseout", function() {
    didClick = false;
    didKey = false;
    didmove = false;
    focused = false;
});

document.addEventListener('visibilitychange', function() {
    didClick = false;
    didKey = false;
    didmove = false;
    chrome.runtime.sendMessage({greeting: "beat"}, function(response) {
        console.log(response.farewell);
    });
})