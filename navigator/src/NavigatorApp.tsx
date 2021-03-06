import React from 'react';
import {Button} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import * as Config from "./config";
import {NavigatorState, SessionMode} from "./types";
import Chat from "./Chat";
import Timer from "./Timer"

require("webrtc-adapter");

class PeerInfo {
    constructor(public localId: number, public remoteId: number, public pc: RTCPeerConnection) {
    }
}

interface Props {
    history: any;
}

interface State {
    sessionId: string;
    state: NavigatorState;
    ws: WebSocket;
    mode: SessionMode;
    interval: number;
    begin: number;
    name?: string;
    color: string;
    videoPlaying: boolean;
    fullscreen: boolean;
    driverPeer: RTCPeerConnection | undefined;
    navigatorPeers: PeerInfo[]
}

export default class NavigatorApp extends React.Component<Props, State> {
    private stream?: MediaStream;
    private receivedAudioStream: MediaStream = new MediaStream();
    private dataChannel?: RTCDataChannel;
    private videoRef?: HTMLVideoElement;
    private canvasRef?: HTMLCanvasElement;
    private color?: string;
    private audioRef?: HTMLAudioElement;
    private localId?: number = -1;

    private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
        this.videoRef = videoRef;
        if (videoRef === null)
            return;
        if (this.stream) {
            try {
                videoRef.srcObject = this.stream;
            } catch (e) {
                videoRef.src = URL.createObjectURL(this.stream)
            }
            this.setState({videoPlaying: false});
        }
        videoRef.addEventListener("resize", this.setCanvasSize);
    };
    private readonly setCanvasRef = (canvasRef: HTMLCanvasElement) => {
        this.canvasRef = canvasRef;
        if (canvasRef === null)
            return;

        const sendPointer = (e: any) => {
            const rect = canvasRef.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width,
                y = (e.clientY - rect.top) / rect.height;
            this.sendDataChannel({x, y});
        };
        let mousePressed = false;
        canvasRef.addEventListener("mousedown", (e: any) => {
            mousePressed = true;
            sendPointer(e);
            this.updateCanvas(e.clientX, e.clientY);
        }, false);
        canvasRef.addEventListener("mouseup", () => {
            mousePressed = false;
            const canvas = this.canvasRef;
            if (!canvas)
                return;
            const context = canvas.getContext("2d");
            if (!context)
                return;
            context.clearRect(0, 0, canvas.width, canvas.height);
        }, false);
        canvasRef.addEventListener("mousemove", (e: any) => {
            if (mousePressed) {
                sendPointer(e);
                console.log("mousemove");
                this.updateCanvas(e.clientX, e.clientY);
            }
        }, false);
        canvasRef.addEventListener("touchmove", (e: any) => {
            const p = e.targetTouches[0];
            sendPointer(p);
            this.updateCanvas(p.clientX, p.clientY);
        });
    };

    private readonly setAudioRef = (audioRef: HTMLAudioElement) => {
        this.audioRef = audioRef;
        if (audioRef === null) {
            return;
        }
        if (this.receivedAudioStream) {
            try {
                audioRef.srcObject = this.receivedAudioStream;
            } catch (e) {
                audioRef!.src = URL.createObjectURL(this.receivedAudioStream);
            }
        }
    };

    constructor(props: Props) {
        super(props);

        // Just to avoid null reference when accessed without the session ID
        // For now, let getSessInfo() and sendWebsocket() fail
        const id_ = window.location.pathname.match(/\/session\/([a-z0-9-]+)/);
        const id = id_ !== null ? id_[1] : "INVALID-SESSION-ID";

        const url = `${Config.WORKSPACE_WEBSOCKET_BASE_ADDRESS}/api/session/${id}/navigator`;
        this.state = {
            sessionId: id,
            state: NavigatorState.Disconnected,
            ws: new WebSocket(url),
            mode: SessionMode.Free,
            interval: -1,
            begin: -1,
            color: "",
            videoPlaying: false,
            fullscreen: false,
            driverPeer: undefined,
            navigatorPeers: []
        };
        this.getSessInfo();
        this.sendWebsocket();
    }

    public reconnect() {
        setTimeout(() => {
            this.sendWebsocket();
        }, 2000);
    }

    public componentDidMount(): void {
        // press F2 to speak
        window.addEventListener("keydown", (e) => {
            if (e && e.key === "F2") {
                this.startSpeak();
            }
        });
        window.addEventListener("keyup", (e) => {
            if (e && e.key === "F2") {
                this.stopSpeak();
            }
        })
    }

    private startSpeak() {
        if (this.state.driverPeer) {
            this.state.driverPeer.getTransceivers().forEach((transceiver) => {
                if (transceiver.sender.track) {
                    transceiver.sender.track.enabled = true;
                }
            })
        }
        if (this.state.navigatorPeers) {
            for (let i: number = 0; i < this.state.navigatorPeers.length; i++) {
                this.state.navigatorPeers[i].pc.getTransceivers().forEach((transceiver) => {
                    if (transceiver.sender.track) {
                        transceiver.sender.track.enabled = true;
                    }
                })
            }
        }
    }

    private stopSpeak() {
        if (this.state.driverPeer) {
            this.state.driverPeer.getTransceivers().forEach((transceiver) => {
                if (transceiver.sender.track) {
                    transceiver.sender.track.enabled = false;
                }
            })
        }
        if (this.state.navigatorPeers) {
            for (let i: number = 0; i < this.state.navigatorPeers.length; i++) {
                this.state.navigatorPeers[i].pc.getTransceivers().forEach((transceiver) => {
                    if (transceiver.sender.track) {
                        transceiver.sender.track.enabled = false;
                    }
                })
            }
        }
    }

    handleButtonDown = (e: any) => {
        e.preventDefault();
        this.startSpeak();
    };

    handleButtonUp = (e: any) => {
        e.preventDefault();
        this.stopSpeak();
    };

    private closeNavigatorPeers () {
        for (let i = 0; i < this.state.navigatorPeers.length; i++) {
            this.state.navigatorPeers[i].pc.close();
        }
        this.setState({
            navigatorPeers: [],
        })
    }

    private deletePeerFromPeers() {
        for (let i: number = 0; i < this.state.navigatorPeers.length; i++) {
            if (this.state.navigatorPeers[i].pc.connectionState === "failed" ||
                this.state.navigatorPeers[i].pc.connectionState === "disconnected") {
                this.state.navigatorPeers[i].pc.close();
                this.state.navigatorPeers.splice(i, 1);
            }
        }
    }

    private async getSessInfo() {
        const ret = await fetch(`${Config.WORKSPACE_BASE_ADDRESS}/api/session/${this.state.sessionId}`);
        const obj = await ret.json();

        this.setState({
            mode: obj.config.mode,
            begin: obj.config.begin,
            interval: obj.config.interval,
        });
    }

    private sendWebsocket() {
        const ws = this.state.ws;
        let peer: RTCPeerConnection;
        let newPeers: PeerInfo[];
        ws.onopen = () => {
            console.log("WebSocket connected");

            let sendObject = {
                "kind": "request_sdp",
                "payload": "",
            };
            ws.send(JSON.stringify(sendObject));

            this.setState({state: NavigatorState.WaitingDriver});
        };
        ws.onmessage = async evt => {
            const message = JSON.parse(evt.data);
            switch (message.kind) {
                // request sdp from other navigators
                case "navigator_request_sdp":
                    console.log("navigator_request_sdp");
                    const localPeer = new PeerInfo(message.navigator_id, message.remoteId, new RTCPeerConnection(Config.RTCPeerConnectionConfiguration));
                    newPeers = [...this.state.navigatorPeers, localPeer];
                    this.setState({
                        navigatorPeers: newPeers,
                    });
                    try {
                        navigatorGetUserMedia().then((stream) => {
                            const audioTrack = stream.getTracks()[0];
                            audioTrack.enabled = false;
                            localPeer.pc.addTrack(audioTrack);
                            localPeer.pc.createOffer({
                                offerToReceiveAudio: true,
                            }).then((offer) => {
                                localPeer.pc.setLocalDescription(offer)
                                    .then(() => {
                                        ws.send(JSON.stringify({
                                            "kind": "navigator_sdp",
                                            "payload": JSON.stringify(localPeer.pc.localDescription),
                                            "navigator_id": message.navigator_id,
                                            "remoteId": message.remoteId,
                                        }));
                                    });
                            });
                        })
                    } catch (err) {
                        console.error(err);
                    }

                    localPeer.pc.ontrack = evt => {
                        console.log("local navigator on track");
                        this.receivedAudioStream.addTrack(evt.track);

                        if (this.audioRef) {
                            try {
                                this.audioRef.srcObject = this.receivedAudioStream;
                            } catch (e) {
                                this.audioRef!.src = URL.createObjectURL(this.receivedAudioStream);
                            }
                            this.audioRef.play().then(() => {
                                console.log("start audio play");
                            }, () => {
                                console.log("can not play audio, please check permission");
                            })
                        }
                    };

                    localPeer.pc.onicecandidate = ev => {
                        if (ev.candidate) {
                            console.log(`[RTC] New ICE candidate`);
                            console.log(ev.candidate);
                            ws.send(JSON.stringify({
                                kind: "navigator_ice",
                                payload: JSON.stringify(ev.candidate),
                                navigator_id: this.localId,
                                remoteId: message.remoteId,
                            }));
                        } else {
                            console.log(`[RTC] ICE candidates complete`);
                            ws.send(JSON.stringify({
                                kind: "navigator_ice",
                                payload: "",
                                navigator_id: this.localId,
                                remoteId: message.remoteId,
                            }));
                        }
                    };

                    localPeer.pc.onconnectionstatechange = () => {
                        switch (localPeer.pc.connectionState) {
                            case "disconnected":
                                console.log("peer disconnect");
                                this.deletePeerFromPeers();
                                break;
                            case "failed":
                                console.log("peer failed");
                                this.deletePeerFromPeers();
                                break;
                        }
                    };
                    break;
                case "navigator_sdp":  // send sdp to other navigators
                    console.log("navigator_sdp");
                    const remotePeer = new PeerInfo(message.navigator_id, message.remoteId, new RTCPeerConnection(Config.RTCPeerConnectionConfiguration));
                    newPeers = [...this.state.navigatorPeers, remotePeer];
                    this.setState({
                        navigatorPeers: newPeers,
                    });
                    remotePeer.pc.setRemoteDescription(JSON.parse(message.payload))
                        .then(() => navigatorGetUserMedia()
                            .then((stream) => {
                                remotePeer.pc.getTransceivers().forEach((transciver) => {
                                    try {
                                        if (transciver.receiver.track.kind === "audio") {
                                            let track = stream.getTracks()[0];
                                            console.log(stream.getTracks().length);
                                            track.enabled = false;
                                            transciver.sender.replaceTrack(track);
                                            transciver.direction = "sendrecv";
                                        }
                                    } catch (e) {
                                        // @ts-ignore
                                        peer.addStream(stream);
                                    }
                                });
                            }).then(() => remotePeer.pc.createAnswer())
                            .then((answer) => remotePeer.pc.setLocalDescription(answer))
                            .then(() => {
                                console.log("send answer");
                                ws.send(JSON.stringify({
                                    "kind": "navigator_answer",
                                    "payload": JSON.stringify(remotePeer.pc.localDescription),
                                    "navigator_id": this.localId,
                                    "remoteId": message.remoteId,
                                }));
                            }));

                    remotePeer.pc.ontrack = evt => {
                        console.log("remote navigator on track");
                        this.receivedAudioStream.addTrack(evt.track);

                        if (this.audioRef) {
                            try {
                                this.audioRef.srcObject = this.receivedAudioStream;
                            } catch (e) {
                                this.audioRef!.src = URL.createObjectURL(this.receivedAudioStream);
                            }
                            this.audioRef.play().then(() => {
                                console.log("start audio play");
                            }, () => {
                                console.log("can not play audio, please check permission");
                            })
                        }
                        console.log("length" + this.receivedAudioStream.getTracks().length);
                    };

                    remotePeer.pc.onicecandidate = ev => {
                        if (ev.candidate) {
                            console.log(`[RTC] New ICE candidate`);
                            console.log(ev.candidate);
                            ws.send(JSON.stringify({
                                kind: "navigator_ice",
                                payload: JSON.stringify(ev.candidate),
                                navigator_id: this.localId,
                                remoteId: message.remoteId,
                            }));
                        } else {
                            console.log(`[RTC] ICE candidates complete`);
                            ws.send(JSON.stringify({
                                kind: "navigator_ice",
                                payload: "",
                                navigator_id: this.localId,
                                remoteId: message.remoteId,
                            }));
                        }
                    };
                    remotePeer.pc.onconnectionstatechange = () => {
                        switch (remotePeer.pc.connectionState) {
                            case "disconnected":
                                console.log("peer disconnect");
                                this.deletePeerFromPeers();
                                break;
                            case "failed":
                                console.log("peer failed");
                                this.deletePeerFromPeers();
                                break;
                        }
                    };
                    break;
                case "navigator_answer":  // send answer to other navigators
                    console.log("navigator_answer");
                    const answerPeer = this.state.navigatorPeers.find(peer => peer.remoteId === message.remoteId);
                    if (!answerPeer) {
                        console.log(`[WS] Unexpected 'sdp' event for id=${message.remoteId}`);
                        console.log(message);
                        return;
                    }
                    answerPeer.pc.setRemoteDescription(JSON.parse(message.payload))
                        .catch(e => {
                            console.log("[WS] peer.pc.setRemoteDescription failed for navigator " +
                                `id=${message.remoteId}`);
                            console.log(e);
                        });
                    break;
                case "navigator_ice":  // add ice candidate from other navigator
                    console.log("navigator_ice");
                    const navPeer = this.state.navigatorPeers.find(peer => peer.remoteId === message.remoteId);
                    if (!navPeer) {
                        console.log(`[WS] Unexpected 'ice_candidate' event for id=${message.remoteId}`);
                        console.log(message);
                        return;
                    }
                    if (message.payload !== "") {
                        const candidate = JSON.parse(message.payload);
                        navPeer.pc.addIceCandidate(candidate);
                    } else {
                        navPeer.pc.addIceCandidate();
                    }
                    break;
                case "sdp":
                    console.log(message);
                    const sdp = message;
                    this.localId = message.navigator_id;
                    console.log("localIs: " + this.localId);
                    peer = new RTCPeerConnection(Config.RTCPeerConnectionConfiguration);
                    this.setState({
                        driverPeer: peer
                    });

                    peer.ontrack = evt => {
                        console.log('-- peer.ontrack()');
                        console.log(evt.track);
                        this.stream = evt.streams[0];
                        if (this.videoRef) {
                            try {
                                this.videoRef.srcObject = this.stream;
                            } catch (e) {
                                this.videoRef!.src = URL.createObjectURL(this.stream);
                            }
                            this.setState({videoPlaying: false});
                        }
                    };

                    // ICE Candidateを収集したときのイベント
                    peer.onicecandidate = ev => {
                        if (ev.candidate) {
                            console.log(`[RTC] New ICE candidate`);
                            console.log(ev.candidate);
                            ws.send(JSON.stringify({
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
                                this.setState({state: NavigatorState.Connected});
                                this.getSessInfo()
                                // The connection has become fully connected
                                break;
                            case "disconnected":
                                this.handleDriverQuit();
                                break;
                            case "failed":
                                // One or more transports has terminated unexpectedly or in an error
                                if (this.videoRef) {
                                    this.videoRef.pause();
                                    this.videoRef.currentTime = 0;
                                }
                                break;
                            case "closed":
                                // The connection has been closed
                                if (this.videoRef) {
                                    this.videoRef.pause();
                                    this.videoRef.currentTime = 0;
                                }
                                break;
                        }
                    };

                    peer.ondatachannel = (ev) => {
                        const dataChannel = ev.channel;
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
                            this.color = Config.Colors[navigator_id % Config.Colors.length];
                            this.setState({
                                color: this.color
                            });
                            console.log("received via datachannel");
                        };
                        this.dataChannel = dataChannel;
                    };

                    peer.setRemoteDescription(JSON.parse(sdp.payload))
                        .then(() => navigatorGetUserMedia()
                            .then((stream) => {
                                // peer.addTrack(stream.getTracks()[0], stream);
                                try {
                                    peer.getTransceivers().forEach((transciver) => {
                                        if (transciver.receiver.track.kind === "audio") {
                                            let track = stream.getTracks()[0];
                                            track.enabled = false;
                                            transciver.sender.replaceTrack(track);
                                            transciver.direction = "sendrecv";
                                        }
                                    });
                                } catch (e) {
                                    // @ts-ignore
                                    peer.addStream(stream);
                                }
                            }).then(() => peer.createAnswer())
                            .then((answer) => peer.setLocalDescription(answer))
                            .then(() => {
                                ws.send(JSON.stringify({
                                    "kind": "sdp",
                                    "payload": JSON.stringify(peer.localDescription),
                                }));
                            }));
                    break;
                case "ice_candidate":
                    if (message.payload !== "") {
                        peer.addIceCandidate(JSON.parse(message.payload));
                    } else {
                        peer.addIceCandidate();
                    }
                    break;
                case "driver_ready":
                    let sendObject = {
                        "kind": "request_sdp",
                        "payload": "",
                    };
                    ws.send(JSON.stringify(sendObject));

                    break;
                case "driver_quit":
                    this.handleDriverQuit();
                    break;
            }
        };

        ws.onclose = () => {
            console.log("WebSocket onclose");

            this.setState({state: NavigatorState.Disconnected});
        };

        ws.onerror = (event: any) => {
            console.log("WebSocket onerror, reconnecting...:");
            console.log(event);
            this.reconnect();
        };
    }

    // Called when driver_quit event is received on WebSocket or WebRTC connection dies.
    // The latter is not always reliable.
    handleDriverQuit = () => {
        this.setState({state: NavigatorState.WaitingDriver});
        this.getSessInfo();
        this.closeNavigatorPeers();
    };

    private sendDataChannel(data: any) {
        if (this.dataChannel !== undefined) {
            const str = JSON.stringify(data);
            this.dataChannel.send(str);
        }
    }

    private setCanvasSize() {
        if (this.canvasRef && this.videoRef) {
            this.canvasRef.width = this.videoRef.clientWidth;
            this.canvasRef.height = this.videoRef.clientHeight;
        }
    }

    private updateCanvas(mx: number, my: number) {
        const canvas = this.canvasRef, video = this.videoRef;
        if (!canvas || !video)
            return;
        const context = canvas.getContext("2d");
        if (!context)
            return;
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!this.color)
            return;
        const rect = canvas.getBoundingClientRect();
        const x = (mx - rect.left),
            y = (my - rect.top);
        const r = parseInt(this.color.substr(1, 2), 16),
            g = parseInt(this.color.substr(3, 2), 16),
            b = parseInt(this.color.substr(5, 2), 16);
        const style = `rgba(${r}, ${g}, ${b})`;
        context.beginPath();
        context.arc(x, y, 5, 0, 2 * Math.PI);
        context.fillStyle = style;
        context.fill();
    }

    handleChangeFullscreen = (e: any) => {
        console.log(e);
        e.preventDefault();
        const curr = !!document.fullscreenElement;
        if (curr)
            document.exitFullscreen();
        else
            document.documentElement.requestFullscreen();
        this.setState({fullscreen: !curr});
    }

    handleOpenSettings = (e: any) => {
        e.preventDefault();
        this.setState({videoPlaying: false});
    }

    handleNameChange = (e: any) => {
        this.setState({
            name: e.target.value,
        })
    };

    startVideoPlaying = async (event: any) => {
        event.preventDefault();
        this.setState({videoPlaying: true});
        if (this.videoRef)
            await this.videoRef.play();
        if (this.audioRef) {
            try {
                this.audioRef.srcObject = this.receivedAudioStream;
            } catch (e) {
                this.audioRef!.src = URL.createObjectURL(this.receivedAudioStream);
            }
            this.audioRef.play().then(() => {
                console.log("start audio play");
            }, () => {
                console.log("can not play audio, please check permission");
            })
        }
    };

    render() {
        const driverUrl = `agmob-driver://${this.state.sessionId}`;
        return (
            <div className="container-fluid p-3 d-flex h-100 flex-column">
                <div className="flex-grow-1">
                    {this.state.state === NavigatorState.Disconnected ?
                        <div className="text-center">
                            <h1>Connecting to the server</h1>
                            <p>Please wait for a little while longer.</p>
                        </div>
                        : this.state.state === NavigatorState.WaitingDriver ?
                            <div className="text-center">
                                <h1>Waiting for a new driver</h1>
                                <p>Please wait for a little while longer.</p>
                                <div className="mt-3">
                                    <h4>Or become a driver</h4>
                                    <a href={driverUrl}>{driverUrl}</a>
                                </div>
                            </div>
                            : this.state.state === NavigatorState.Connected ?
                                <div className="video-container">
                                    <video
                                        onCanPlay={this.setCanvasSize.bind(this)}
                                        ref={this.setVideoRef}/>
                                    <canvas
                                        ref={this.setCanvasRef}/>
                                    {!this.state.videoPlaying &&
                                    <div className="video-start-confirm-backdrop"/>}
                                    {!this.state.videoPlaying &&
                                    <div className="video-start-confirm card">
                                        <div className="card-body">
                                            <h3 className="card-title">Settings</h3>
                                            <form onSubmit={this.startVideoPlaying}>
                                                <div className="form-group">
                                                    <label htmlFor="navig-name">Display Name</label>
                                                    <input id="navig-name"
                                                           className="form-control" type="text"
                                                           placeholder="Input your name"
                                                           value={this.state.name || ""} onChange={this.handleNameChange}/>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="navig-fullscreen">Toggle Fullscreen</label>
                                                    <Button id="navig-fullscreen" className="d-block"
                                                            value="fullscreen" variant="outline-primary"
                                                            title="Fullscreen"
                                                            active={this.state.fullscreen}
                                                            onClick={this.handleChangeFullscreen}>
                                                        <span className="glyphicon glyphicon-fullscreen">🖵</span>
                                                    </Button>
                                                </div>
                                                <button className="form-control btn btn-primary" type="submit">
                                                    Close
                                                </button>
                                            </form>
                                        </div>
                                    </div>}
                                </div>
                                : <span>UNREACHABLE</span>}
                </div>
                <div className="row m-0 mt-3">
                    <Button variant="primary" title="Settings"
                            disabled={this.state.state === NavigatorState.Disconnected}
                            onClick={this.handleOpenSettings}>
                        <FontAwesomeIcon icon="cogs"/>
                    </Button>
                    <Timer begin={this.state.begin} startTimeInMinutes={this.state.interval}
                           mode={this.state.mode} state={this.state.state}/>
                    <Chat ws={this.state.ws} state={this.state.state} name={this.state.name} color={this.state.color}/>
                    <audio ref={this.setAudioRef}/>
                    <div>&nbsp;</div>
                    <Button variant="primary"
                            title="Keep Clicking or Press F2 to Speak"
                            disabled={this.state.state === NavigatorState.Disconnected}
                            onMouseDown={this.handleButtonDown}
                            onMouseUp={this.handleButtonUp}
                            onTouchStart={this.handleButtonDown}
                            onTouchEnd={this.handleButtonUp}>
                        <FontAwesomeIcon icon="microphone"/>
                    </Button>
                </div>
            </div>
        );
    }
}

function navigatorGetUserMedia(): Promise<MediaStream> {
    return new Promise(function (resolve, reject) {
        const getUserMedia = window.navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        try {
            getUserMedia({
                audio: true,
            }, (stream) => {
                resolve(stream);
            }, () => {
                alert("Unable to get permission of microphone, please make sure you have given the browser the permission to use microphone");
                reject();
            })
        } catch (e) {
            navigator.mediaDevices.getUserMedia({
                audio: true,
            }).then((stream) => {
                resolve(stream)
            }).catch(() => {
                alert("Unable to get permission of microphone, please make sure you have given the browser the permission to use microphone");
                reject();
            })
        }
    });
}
