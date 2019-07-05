// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import {log} from "util";
import dialog = Electron.dialog;

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
            socketUrl = `ws://localhost:8080/api/session/${uuid.id}/driver`;

        }
    };
});

let connection: WebSocket;
let navigatorSdp: string;
let driverSdp: RTCSessionDescriptionInit;
const peerList: any = {};
const pcConfig = {iceServers: [{urls: "stun:stun.webrtc.ecl.ntt.com:3478"}]};


// @ts-ignore
const defaultConstraints = {
    audio: false,
    video: {
        mandatory: {
            chromeMediaSource: "screen",
            maxFrameRate: 25,
            maxHeight: screen.availHeight,
            maxWidth: screen.availWidth,
        },
    },
};

websocketStartButton.addEventListener("click", () => {
    console.log("start websocket");
    connection = new WebSocket(socketUrl);
    connection.onopen = (e) => {
    };
    connection.onmessage = (e) => {
        const obj = JSON.parse(e.data);
        if (obj.kind === "request_sdp") {
            const peer = new RTCPeerConnection(pcConfig);
            const navigator_id = obj.navigator_id;

            peer.ontrack = (ev) => {
                console.log(ev);
            };

            peer.onicecandidate = (ev) => {
                if (ev.candidate){
                    console.log(ev);
                }else{
                    const sdp = peer.localDescription;
                    const sendObject = {
                        kind: "sdp",
                        payload: JSON.stringify(sdp),
                        navigator_id: navigator_id,
                    };
                    connection.send(JSON.stringify(sendObject));
                }
            };

            peer.onnegotiationneeded = async () => {
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    const sdp = peer.localDescription;
                    const sendObject = {
                        kind: "sdp",
                        payload: JSON.stringify(sdp),
                        navigator_id: navigator_id,
                    };
                    connection.send(JSON.stringify(sendObject));
                } catch(err){
                    console.error(err);
                }
            };
            navigator.mediaDevices.getUserMedia({video: true, audio: false}).then((stream) => {
                console.log(stream);
                stream.getTracks().forEach((track) => {peer.addTrack(track); });
            });
            peerList[obj.navigator_id] = peer;
        }else if(obj.kind === "sdp"){
            const peer = peerList[obj.navigator_id];
            const sdp = JSON.parse(obj.payload);
            peer.setRemoteDescription(sdp);
        }

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
});

