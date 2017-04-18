config = {
	// Extension Id
	appId: "",
    // Extension name
    name: 'Opzio',
    // Extension version
    version: "1.0.0",
    // Time for idle state of the browser
    // The user is considered idle if there was
    // no activity in the browser for x seconds
    detectionIntervalInSeconds: 60,
    //tracking state
    tracking: false,
    //synchronize user settings and data
    apiSync: "http://localhost:3030/app/sync",
    //authenticate user
    apiAuth: "http://localhost:3030/app/auth",
    //heartbeat endpoint
    apiBeat: "https://api.opz.io/v1/logs",
    apiTest: "http://localhost:3030/master",
    token: "7d684330-6651-4a1d-bd21-e886488e2760",
    //user settings obj
    user: undefined,
    //sync credentials
    sync: undefined,
    //auth and sync states
    state: {
        LOGIN_REQUIRED: true,
        SYNC_REQUIRED: true,
        CONNECTION_ERROR: false,
    },
    //
    today: new Date().getDay(),
    now: new Date().getHours(),
}