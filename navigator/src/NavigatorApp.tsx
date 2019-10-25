import React from 'react';
import Chat from "./Chat";

function getSessionId() {
    return window.location.pathname.match(/\/session\/([a-z0-9-]+)/)![1];
}

const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";
const pcConfig = {
    iceServers: [
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "stun:160.16.213.209"},
        {urls: "turn:160.16.213.209", credential: "ZPu5tyGmdsAEn6dlYJkNBse/x/UQnMj2", username: "agmob"},
    ]
};

enum NavigatorState {
    // Not connected to WebSocket
    Disconnected,
    // Connected to WebSocket, not connected with Driver
    WaitingDriver,
    // Connected to Driver
    Connected,
};

interface Props {
    history: any;
}

interface State {
    state: NavigatorState,
    ws: WebSocket,
}

export default class NavigatorApp extends React.Component<Props, State> {
    private stream?: MediaStream;
    private peer?: RTCPeerConnection;
    private videoRef?: HTMLVideoElement;
    private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
        if (videoRef === null) return;
        if (this.stream)
            videoRef.srcObject = this.stream;
        this.videoRef = videoRef;
    };

    constructor(props: Props) {
        super(props);
        const id = getSessionId();
        const url = `${WORKSPACE_WEBSOCKET_BASE_ADDRESS}/api/session/${id}/navigator`;
        this.state = {
            state: NavigatorState.Disconnected,
            ws: new WebSocket(url),
        };
        this.sendWebsocket();
    }

    public reconnect() {
        setTimeout(() => {
            this.sendWebsocket();
        }, 2000);
    }

    private sendWebsocket() {
        let peer: RTCPeerConnection;
        this.state.ws.onopen = () => {
            console.log("WebSocket connected");

            let sendObject = {
                "kind": "request_sdp",
                "payload": "",
            };
            this.state.ws.send(JSON.stringify(sendObject));

            this.setState({state: NavigatorState.WaitingDriver});
        };
        const self = this;
        this.state.ws.onmessage = function (evt) {
            const message = JSON.parse(evt.data);
            switch (message.kind) {
                case "sdp":
                    console.log(message);
                    const sdp = message;
                    peer = new RTCPeerConnection(pcConfig);
                    self.peer = peer;
                    peer.ontrack = evt => {
                        console.log('-- peer.ontrack()');
                        console.log(evt.track);
                        console.log(evt.streams);
                        evt.streams[0].addTrack(evt.track);
                        self.stream = evt.streams[0];
                        if (self.videoRef) {
                            self.videoRef.srcObject = self.stream;
                        }
                    };

                    // ICE Candidateを収集したときのイベント
                    peer.onicecandidate = evt => {
                        if (evt.candidate) {
                            console.log(evt.candidate);
                        } else {
                            console.log('empty ice event');
                            const sdp = peer.localDescription;
                            const sendObject = {
                                "kind": "sdp",
                                "payload": JSON.stringify(sdp)
                            };
                            this.send(JSON.stringify(sendObject));
                        }
                    };
                    peer.onconnectionstatechange = evt => {
                        switch (peer.connectionState) {
                            case "connected":
                                self.setState({state: NavigatorState.Connected});
                                // The connection has become fully connected
                                break;
                            case "disconnected":
                                self.handleDriverQuit();
                                break;
                            case "failed":
                                // One or more transports has terminated unexpectedly or in an error
                                if (self.videoRef) {
                                    self.videoRef.pause();
                                    self.videoRef.currentTime = 0;
                                }
                                break;
                            case "closed":
                                // The connection has been closed
                                if (self.videoRef) {
                                    self.videoRef.pause();
                                    self.videoRef.currentTime = 0;
                                }
                                break;
                        }
                    };

                    peer.setRemoteDescription(JSON.parse(sdp.payload)).then(() => {
                        console.log('setRemoteDescription(answer) success in promise');
                        peer.createAnswer().then((answer) => {
                            peer.setLocalDescription(answer).then(() => {
                                // const sdp = peer.localDescription;
                                // const sendObject = {
                                //   "kind": "sdp",
                                //   "payload": JSON.stringify(sdp)
                                // };
                                // ws.send(JSON.stringify(sendObject));
                            })
                        })
                    });
                    break;
                case "driver_ready":
                    let sendObject = {
                        "kind": "request_sdp",
                        "payload": "",
                    };
                    this.send(JSON.stringify(sendObject));

                    break;
                case "driver_quit":
                    self.handleDriverQuit();
                    break;
            }
        };

        this.state.ws.onclose = () => {
            console.log("WebSocket onclose");

            this.setState({state: NavigatorState.Disconnected});
        };

        this.state.ws.onerror = (event: any) => {
            console.log("WebSocket onerror, reconnecting...:");
            console.log(event);
            this.reconnect();
        };
    }

    // Called when driver_quit event is received on WebSocket or WebRTC connection dies.
    // The latter is not always reliable.
    handleDriverQuit = () => {
        this.setState({state: NavigatorState.WaitingDriver});
    };

    handleStart = async (event: any) => {
        event.preventDefault();
        if (this.videoRef)
            await this.videoRef.play();
    };

    render() {
        const token = getSessionId();
        const driverUrl = `agmob-driver:${token}`;
        return (
            <div style={{textAlign: "center"}}>
                {this.state.state === NavigatorState.Disconnected ?
                    <div>
                        <h1>Connecting to server</h1>
                        <p>Please wait for a little while longer.</p>
                    </div>
                    : this.state.state === NavigatorState.WaitingDriver ?
                        <div>
                            <h1>Waiting for new driver</h1>
                            <p>Please wait for a little while longer.</p>
                            <div className="mt-3">
                                <h4>Become a driver</h4>
                                <a href={driverUrl}>{driverUrl}</a>
                            </div>
                        </div>
                        : <div/>}
                <video width="960"
                       className={this.state.state === NavigatorState.Connected ? "" : "d-none"}
                       autoPlay={true} muted={true} ref={this.setVideoRef}/>
                <Chat ws={this.state.ws}/>
            </div>
        );
    }
}
