// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import {log} from "util";

const driverStartButton = document.querySelector("#driver_start_button");
const websocketStartButton = document.querySelector("#websocket_create_button");
const websocketCloseButton = document.querySelector("#websocket_close_button");

let uuid;


driverStartButton.addEventListener("click", () => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/api/session");
    xhr.send();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            uuid = xhr.responseText;
            // tslint:disable-next-line:no-console
            console.log(uuid);
        }
    };
});

let connection: WebSocket;
const socketUrl = "wss://echo.websocket.org";

websocketStartButton.addEventListener("click", () => {
    console.log("!");
    connection = new WebSocket(socketUrl);
    connection.onopen = (e) => {
        connection.send("hoge");
    };
    connection.onmessage = (e) => {
        // tslint:disable-next-line:no-console
        console.log(e.data);
    };
    connection.onerror = (e) => {
        console.log(e);
    };
    connection.onclose = (e) => {
        console.log(e);
    };

});

websocketCloseButton.addEventListener("click", () => {
    connection.close();
});
