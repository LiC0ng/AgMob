import React from 'react';
import * as Config from "./config";
import Chat from "./Chat";
import Timer from "./Timer"

function getSessionId() {
    return window.location.pathname.match(/\/session\/([a-z0-9-]+)/)![1];
}

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
    mode: string,
    interval: number,
    begin: number;
    connectionState: string;
}

export default class NavigatorApp extends React.Component<Props, State> {
    private stream?: MediaStream;
    private peer?: RTCPeerConnection;
    private dataChannel?: RTCDataChannel;
    private videoRef?: HTMLVideoElement;
    private color?: string;
    private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
        this.videoRef = videoRef;
        if (videoRef === null)
            return;
        if (this.stream)
            videoRef.srcObject = this.stream;

        const sendPointer = (e: any) => {
            const rect = videoRef.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width,
                y = (e.clientY - rect.top) / rect.height;
            this.sendDataChannel({x, y});
        }
        let mousePressed = false;
        videoRef.addEventListener("mousedown", (e: any) => {
            mousePressed = true;
            sendPointer(e);
        }, false);
        videoRef.addEventListener("mouseup", () => {
            mousePressed = false;
        }, false);
        videoRef.addEventListener("mousemove", (e: any) => {
            if (mousePressed)
                sendPointer(e);
        }, false);
    };

    constructor(props: Props) {
        super(props);
        const id = getSessionId();
        const url = `${Config.WORKSPACE_WEBSOCKET_BASE_ADDRESS}/api/session/${id}/navigator`;
        this.state = {
            state: NavigatorState.Disconnected,
            ws: new WebSocket(url),
            mode: "Not connect",
            interval: -1,
            begin: -1,
            connectionState: "No Connection"
        };
        this.getSessInfo(id);
        this.sendWebsocket();
    }

    public reconnect() {
        setTimeout(() => {
            this.sendWebsocket();
        }, 2000);
    }

    private async getSessInfo(id: any) {
        const ret = await fetch(`${Config.WORKSPACE_BASE_ADDRESS}/api/session/${id}`);
        const obj = await ret.json();

        this.setState({
            mode: obj.config.mode,
            begin: obj.config.begin,
            interval: obj.config.interval,
            connectionState: obj.config.state
        });
    }

    private sendWebsocket() {
        let peer: RTCPeerConnection;
        let dataChannel: RTCDataChannel;
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
                    peer = new RTCPeerConnection(Config.RTCPeerConnectionConfiguration);
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
                    peer.onicecandidate = ev => {
                        if (ev.candidate) {
                            console.log(`[RTC] New ICE candidate`);
                            console.log(ev.candidate);
                            this.send(JSON.stringify({
                                kind: "ice_candidate",
                                payload: JSON.stringify(ev.candidate),
                            }));
                        } else {
                            console.log(`[RTC] ICE candidates complete`);
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

                    peer.ondatachannel = (ev) => {
                        dataChannel = ev.channel;
                        dataChannel.onopen = () => {
                            if (dataChannel.readyState === 'open') {
                                console.log("datachannel is ready");
                            }
                        };
                        dataChannel.onclose = () => {
                            if (dataChannel.readyState === 'closed') {
                                console.log("datachannel is closed");
                            }
                        };
                        dataChannel.onmessage = (ev: any) => {
                            let navigator_id: number = ev.data;
                            self.color = Config.Colors[navigator_id % Config.Colors.length];
                            console.log("received via datachannel");
                        };
                        self.dataChannel = dataChannel;
                    };

                    peer.setRemoteDescription(JSON.parse(sdp.payload)).then(() => {
                        console.log('setRemoteDescription(answer) success in promise');
                        peer.createAnswer().then((answer) => {
                            peer.setLocalDescription(answer).then(() => {
                                this.send(JSON.stringify({
                                    "kind": "sdp",
                                    "payload": JSON.stringify(peer.localDescription),
                                }));
                            })
                        })
                    });
                    break;
                case "ice_candidate":
                    self.peer!.addIceCandidate(JSON.parse(message.payload));
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
        const id = getSessionId();
        this.getSessInfo(id);
    };

    private sendDataChannel(data: any) {
        if(this.dataChannel !== undefined) {
            const str = JSON.stringify(data);
            this.dataChannel.send(str);
        }
    }

    handleStart = async (event: any) => {
        event.preventDefault();
        if (this.videoRef)
            await this.videoRef.play();
    };

    render() {
        const token = getSessionId();
        const driverUrl = `agmob-driver:${token}`;
        return (
            <div className="container-fluid d-flex p-3">
                <div className="flex-grow-1 text-center mr-3">
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
                    : <video
                        style={{width: "100%"}}
                        className={this.state.state === NavigatorState.Connected ? "" : "d-none"}
                        autoPlay={true} muted={true} ref={this.setVideoRef}/>}
                </div>
                <div className="w-30 h-100 d-flex flex-column">
                    {this.state.connectionState === "Connected" ? <h1>{this.state.mode}</h1> : <h1>{this.state.connectionState}</h1>}
                    <Timer begin={this.state.begin} startTimeInMinutes={this.state.interval} mode={this.state.mode} status={this.state.connectionState}/>
                    <Chat ws={this.state.ws}/>
                </div>
            </div>
        );
    }
}
