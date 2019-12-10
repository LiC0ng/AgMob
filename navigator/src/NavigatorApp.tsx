import React from 'react';
import {Button} from "react-bootstrap";
import * as Config from "./config";
import {NavigatorState, SessionMode} from "./types";
import Chat from "./Chat";
import Timer from "./Timer"
require("webrtc-adapter");

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
}

export default class NavigatorApp extends React.Component<Props, State> {
    private stream?: MediaStream;
    private peer?: RTCPeerConnection;
    private dataChannel?: RTCDataChannel;
    private videoRef?: HTMLVideoElement;
    private canvasRef?: HTMLCanvasElement;
    private color?: string;
    private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
        this.videoRef = videoRef;
        if (videoRef === null)
            return;
        if (this.stream) {
            videoRef.srcObject = this.stream;
            this.setState({ videoPlaying: false });
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
            console.log("mousedown");
            sendPointer(e);
            this.updateCanvas(e.clientX, e.clientY);
        }, false);
        canvasRef.addEventListener("mouseup", () => {
            mousePressed = false;
            const canvas = this.canvasRef;
            console.log("mouseup");
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
        };
        this.getSessInfo();
        this.sendWebsocket();
    }

    public reconnect() {
        setTimeout(() => {
            this.sendWebsocket();
        }, 2000);
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
                case "sdp":
                    console.log(message);
                    const sdp = message;
                    peer = new RTCPeerConnection(Config.RTCPeerConnectionConfiguration);
                    peer.ontrack = evt => {
                        console.log('-- peer.ontrack()');
                        console.log(evt.track);
                        console.log(evt.streams);
                        evt.streams[0].addTrack(evt.track);
                        this.stream = evt.streams[0];
                        if (this.videoRef) {
                            this.videoRef.srcObject = this.stream;
                            this.setState({ videoPlaying: false });
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

                    await peer.setRemoteDescription(JSON.parse(sdp.payload));
                    console.log('setRemoteDescription(answer) success in promise');
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer)
                    ws.send(JSON.stringify({
                        "kind": "sdp",
                        "payload": JSON.stringify(peer.localDescription),
                    }));
                    break;
                case "ice_candidate":
                    peer.addIceCandidate(JSON.parse(message.payload));
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
    };

    private sendDataChannel(data: any) {
        if(this.dataChannel !== undefined) {
            const str = JSON.stringify(data);
            this.dataChannel.send(str);
        }
    }

    private setCanvasSize() {
        if (this.canvasRef && this.videoRef){
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
        const x = (mx- rect.left),
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
        this.setState({ fullscreen: !curr });
    }

    handleNameChange = (e: any) => {
        this.setState({
            name: e.target.value,
        })
    };

    startVideoPlaying = async (event: any) => {
        event.preventDefault();
        this.setState({ videoPlaying: true });
        if (this.videoRef)
            await this.videoRef.play();
    };

    render() {
        const driverUrl = `agmob-driver://${this.state.sessionId}`;
        return (
            <div className="container-fluid p-3 d-flex h-100 flex-column">
                <div className="flex-grow-1 text-center">
                    {this.state.state === NavigatorState.Disconnected ?
                        <div>
                            <h1>Connecting to the server</h1>
                            <p>Please wait for a little while longer.</p>
                        </div>
                    : this.state.state === NavigatorState.WaitingDriver ?
                        <div>
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
                                <div className="video-start-confirm-backdrop" />}
                            {!this.state.videoPlaying &&
                            <div className="video-start-confirm card">
                                <div className="card-body">
                                    <h3 className="card-title">h</h3>
                                    <form onSubmit={this.startVideoPlaying}>
                                        <input className="form-control" type="text"
                                            placeholder="Input your name"
                                            value={this.state.name} onChange={this.handleNameChange} />
                                        <button className="form-control" type="submit">
                                            Start
                                        </button>
                                    </form>
                                </div>
                            </div>}
                        </div>
                    : <span>UNREACHABLE</span>}
                </div>
                <div className="row m-0 mt-3">
                    <Button value="fullscreen" variant="outline-primary" title="Fullscreen"
                        active={this.state.fullscreen} onClick={this.handleChangeFullscreen}>
                        <span className="glyphicon glyphicon-fullscreen">🖵</span>
                    </Button>
                    <Timer begin={this.state.begin} startTimeInMinutes={this.state.interval}
                        mode={this.state.mode} state={this.state.state} />
                    <Chat ws={this.state.ws} state={this.state.state} name={this.state.name} color={this.state.color}/>
                </div>
            </div>
        );
    }
}
