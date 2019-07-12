import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
/*

const WORKSPACE_BASE_ADDRESS = "160.16.213.209:8080/";

const websocketStartButton = document.querySelector("#websocket_create_button");
const websocketCloseButton = document.querySelector("#websocket_close_button");
const peerCreateButton = document.querySelector("#peer_create_button");

let uuid;
let socketUrl: string;


let connection: WebSocket;
let navigatorSdp: string;
let driverSdp: RTCSessionDescriptionInit;
const peerList: any = {};


// @ts-ignore
const defaultConstraints = {
    audio: false,
    video: {
        mandatory: {
            chromeMediaSource: "screen",
            maxFrameRate: 25,
            maxHeight: window.screen.availHeight,
            maxWidth: window.screen.availWidth,
        },
    },
};

websocketStartButton!.addEventListener("click", () => {


});

websocketCloseButton!.addEventListener("click", () => {
    connection.close();
});

// const RTCPeerConnection , RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
// @ts-ignore
peerCreateButton.addEventListener("click", () => {
    // @ts-ignore
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    console.log(peer);
});
*/