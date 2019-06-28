// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import {log} from "util";

const driverStartButton = document.querySelector("#driver_start_button");
const websocketStartButton = document.querySelector("#websocket_create_button");
const websocketCloseButton = document.querySelector("#websocket_close_button");
const peerCreateButton = document.querySelector("#peer_create_button");

let uuid;
let socketUrl: string;


driverStartButton.addEventListener("click", () => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/api/session");
    xhr.send();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            uuid = JSON.parse(xhr.responseText);
            // tslint:disable-next-line:no-console
            console.log(uuid);
            socketUrl = `ws://localhost:8080/api/session/${uuid.id}/driver`

        }
    };
});

let connection: WebSocket;
let navigatorSdp: string;
let driverSdp: RTCSessionDescriptionInit;


websocketStartButton.addEventListener("click", () => {
    console.log("start websocket");
    connection = new WebSocket(socketUrl);
    connection.onopen = (e) => {

    };
    connection.onmessage = (e) => {
        // tslint:disable-next-line:no-console
        console.log(e.data);
        const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        navigatorSdp = JSON.parse(e.data).payload;
        driverSdp = new RTCSessionDescription({type: "offer", sdp: navigatorSdp});
        peer.setRemoteDescription(driverSdp).then(() => {
            peer.createAnswer().then((sdp) => {
                peer.setLocalDescription(sdp).then(() => {
                    const sendObject = {
                        kind: "sdp",
                        payload: driverSdp.sdp,
                    }
                    connection.send(JSON.stringify(sendObject));
                });
            });
        });
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

// const RTCPeerConnection , RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
// @ts-ignore
peerCreateButton.addEventListener("click", () => {
    // @ts-ignore
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    console.log(peer);
})

