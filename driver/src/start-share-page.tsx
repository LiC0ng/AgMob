import React from "react";
import {Form, InputGroup} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Chat from "./Chat";
import * as Config from "./config";
import {SessionMode, PropsWithSession, LaserPointerState} from "./types";

declare global {
    interface Window {
        require: any;
    }
}
const electron = window.require("electron");

class PeerInfo {
    public pointerX?: number;
    public pointerY?: number;

    constructor(public id: number, public pc: RTCPeerConnection) {
    }

    addTracks(stream: MediaStream) {
        stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
    }

    hangUp() {
        if (this.pc.iceConnectionState !== "closed")
            this.pc.close();
    }
}

interface IProps extends PropsWithSession {
    history: any;
}

interface IState {
    mode: SessionMode;
    timeRemainingInSeconds: number;
    sessionId: string;
    timerHandle?: number;
    overlayHandle?: number;
    nav_message: string;
    chatHistory: string;
    peers: PeerInfo[];
}

export default class StartShare extends React.Component<IProps, IState> {
    private stream?: MediaStream;
    private chatHistory: string = "";

    public constructor(props: IProps) {
        super(props);

        const sess = props.currentSession!;
        this.state = {
            mode: sess.mode,
            timeRemainingInSeconds: sess.startTimeInMinutes * 60,
            sessionId: sess.sessionId,
            timerHandle: undefined,
            overlayHandle: undefined,
            nav_message: "",
            chatHistory: "",
            peers: [],
        };
        this.clickStopHandle = this.clickStopHandle.bind(this);

        const screenSharingConstraints = {
            mandatory: {
                chromeMediaSource: "desktop",
            },
        };
        navigator.mediaDevices.getUserMedia({
            video: screenSharingConstraints as any,
        }).then((stream) => {
            this.stream = stream;
            this.state.peers.forEach(peer => peer.addTracks(stream));
        });
    }

    public componentDidMount() {
        this.props.currentSession!.attach(this.onWebSocketMessage);
        this.props.currentSession!.sendMessage({
            kind: "driver_ready",
            payload: "",
        });

        const timerHandle = window.setInterval(() => this.startTimerCountdownHandler(), 1000);
        const overlayHandle = window.setInterval(() => {
            const ary: LaserPointerState[] = [];
            this.state.peers.forEach(peer => {
                if (peer.pointerX !== undefined && peer.pointerY !== undefined)
                    ary.push({
                        color: Config.Colors[peer.id % Config.Colors.length],
                        posX: peer.pointerX,
                        posY: peer.pointerY,
                    });
            });
            electron.ipcRenderer.send("overlay", ary);
        }, 1000/60);

        this.setState({
            timerHandle: timerHandle,
            overlayHandle: overlayHandle,
        });
    }

    public componentWillUnmount() {
        clearInterval(this.state.timerHandle!);
        clearInterval(this.state.overlayHandle!);
        this.props.currentSession!.detach(this.onWebSocketMessage);

        electron.ipcRenderer.send("overlay-clear");
    }

    public startTimerCountdownHandler() {
        if (this.state.mode !== SessionMode.Strict)
            return;
        if (this.state.timeRemainingInSeconds > 0)
            this.setState({
                timeRemainingInSeconds: this.state.timeRemainingInSeconds - 1,
            });
        else
            this.stopSharing();
    }

    public stopSharing() {
        this.props.currentSession!.sendMessage({
            kind: "chat_history",
            payload: this.chatHistory,
        });
        this.props.currentSession!.sendMessage({
            kind: "driver_quit",
            payload: "",
        });
        this.state.peers.forEach(peer => peer.hangUp());
        this.setState({
            peers: [],
        });
        this.props.history.push({pathname: "/end"});
    }

    public clickStopHandle() {
        this.stopSharing();
    }

    public handleFocus = (event: any) => event.target.select();

    public handleCheck = (event: any) => {
        const remote = electron.remote;
        remote.getCurrentWindow().setAlwaysOnTop(event.target.checked);
    };

    public setChatHistory = (chatHistory: string) => this.chatHistory = chatHistory;

    public render() {
        const navigatorUrl = `${Config.WORKSPACE_BASE_ADDRESS}/session/${this.state.sessionId}`;
        const zeroPadding = function (num: number) {
          return ("0000000000" + num).slice(-2);
        }
        return (
            <div className="h-100 d-flex flex-column">
                <div className="start">
                    <h1 className="d-inline">
                        {this.state.mode === SessionMode.Strict
                            ? `${zeroPadding(Math.floor(this.state.timeRemainingInSeconds / 60))} : ${zeroPadding(this.state.timeRemainingInSeconds % 60)}`
                            : "Free mode"}
                    </h1>
                    <Button style={{marginLeft: 30}} variant="primary"
                        onClick={this.clickStopHandle}>Stop</Button>
                    <Form.Group>
                        <Form.Check type="checkbox" label="Show always on top" onChange={this.handleCheck} defaultChecked/>
                    </Form.Group>
                </div>
                <Form.Group>
                    <Form.Label>Join Session ({this.state.peers.length} connected)</Form.Label>
                    <Form.Control readOnly={true} value={navigatorUrl} onFocus={this.handleFocus}/>
                </Form.Group>
                <Chat nav_message={this.state.nav_message} setChatHistoryToParent={this.setChatHistory} chatHistory={this.state.chatHistory}/>
            </div>
        );
    }

    onWebSocketMessage = (e: any) => {
        const obj = JSON.parse(e.data);
        if (obj.kind === "request_sdp") {
            const navigator_id = obj.navigator_id;
            console.log(`[WS] Received 'request_sdp' from ${navigator_id}`);
            const peer = new RTCPeerConnection(Config.RTCPeerConnectionConfiguration);
            const peerInfo = new PeerInfo(navigator_id, peer);

            peer.onicecandidate = (ev) => {
                if (ev.candidate) {
                    console.log(`[RTC-${navigator_id}] New ICE candidate`);
                    console.log(ev.candidate);
                    this.props.currentSession!.sendMessage({
                        kind: "ice_candidate",
                        payload: JSON.stringify(ev.candidate),
                        navigator_id: navigator_id,
                    });
                } else {
                    console.log(`[RTC-${navigator_id}] ICE candidates complete`);
                }
            };

            peer.onnegotiationneeded = async () => {
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);

                    const dataChannel = peer.createDataChannel('pointer');
                    dataChannel.onopen = () => {
                        if (dataChannel.readyState === 'open') {
                            console.log("datachannel is ready");

                            dataChannel.send(navigator_id);
                            console.log("send via datachannel");
                        }
                    };
                    dataChannel.onclose = () => {
                        if (dataChannel.readyState === 'closed') {
                            console.log("datachannel is closed");
                        }
                    };
                    dataChannel.onmessage = (ev: any) => {
                        const data = JSON.parse(ev.data);
                        peerInfo.pointerX = data.x;
                        peerInfo.pointerY = data.y;
                    };

                    // Send initial SDP
                    console.log(`[RTC-${navigator_id}] Sending initial SDP`);
                    this.props.currentSession!.sendMessage({
                        kind: "sdp",
                        payload: JSON.stringify(peer.localDescription),
                        navigator_id: navigator_id,
                    });
                } catch (err) {
                    console.error(err);
                }
            };

            if (this.stream)
                peerInfo.addTracks(this.stream);
            const newPeers = [...this.state.peers, peerInfo];
            this.setState({peers: newPeers});
        } else if (obj.kind === "sdp") {
            const peer = this.state.peers.find(peer => peer.id === obj.navigator_id);
            if (!peer) {
                console.log(`[WS] Unexpected 'sdp' event for id=${obj.navigator_id}`);
                console.log(obj);
                return;
            }
            const sdp = JSON.parse(obj.payload);
            peer.pc.setRemoteDescription(sdp)
                .catch(e => {
                    console.log("[WS] peer.pc.setRemoteDescription failed for navigator " +
                        `id=${obj.navigator_id}`);
                    console.log(e);
                });
        } else if (obj.kind === "ice_candidate") {
            const peer = this.state.peers.find(peer => peer.id === obj.navigator_id);
            if (!peer) {
                console.log(`[WS] Unexpected 'ice_candidate' event for id=${obj.navigator_id}`);
                console.log(obj);
                return;
            }
            const candidate = JSON.parse(obj.payload);
            peer.pc.addIceCandidate(candidate);
        } else if (obj.kind === "chat") {
            this.setState({
                nav_message: obj.payload,
            });
        }
    };
}
