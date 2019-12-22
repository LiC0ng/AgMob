import {disconnect} from "cluster";
import React from "react";
import {Button, Form, InputGroup, Popover, PopoverTitle, PopoverContent, Overlay} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Chat from "./Chat";
import * as Config from "./config";
import {SessionMode, PropsWithSession, LaserPointerState} from "./types";

declare global {
    interface Window {
        require: any;
    }
}
const electron = window.require("electron");
const os = window.require("os");

class PeerInfo {
    public pointerX?: number;
    public pointerY?: number;

    constructor(public id: number, public pc: RTCPeerConnection) {
    }

    addTracks(stream: MediaStream) {
        this.pc.getSenders().forEach((sender) => this.pc.removeTrack(sender));
        stream.getTracks().forEach((track) => {
            if (track.kind === "audio") {
                track.enabled = false;
            }
            this.pc.addTrack(track, stream);
        });
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
    showTips: HTMLElement | undefined;
    showShare: HTMLElement | undefined;
    alwaysOnTop: boolean;
}

export default class StartShare extends React.Component<IProps, IState> {
    private stream?: MediaStream;
    private receivedAudioStream: MediaStream = new MediaStream();
    private chatHistory: string = "";
    private preDisplayId: number = -1;
    private audioRef?: HTMLAudioElement;

    public constructor(props: IProps) {
        super(props);

        const sess = props.currentSession;
        if (sess === undefined) {
            alert("Current session does not exist. Page reloaded?");
            window.location.href = "/";
            return;
        }
        this.state = {
            mode: sess.mode,
            timeRemainingInSeconds: sess.startTimeInMinutes * 60,
            sessionId: sess.sessionId,
            timerHandle: undefined,
            overlayHandle: undefined,
            nav_message: "",
            chatHistory: sess.chatHistory,
            peers: [],
            showTips: undefined,
            showShare: undefined,
            alwaysOnTop: true,
        };
        this.clickStopHandle = this.clickStopHandle.bind(this);

        this.setupSharedDisplay();

        const remote = electron.remote;
        remote.getCurrentWindow().on("move", this.moveHandler);
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

        window.addEventListener("keydown", (e) => {
            if (e && e.key === "F2") {
                this.startSpeak();
            }
        });
        window.addEventListener("keyup" , (e) => {
            if (e && e.key === "F2" && this.state.peers) {
                this.stopSpeak();
            }
        });
    }

    public startSpeak() {
        if (this.state.peers) {
            for (let i: number  = 0; i < this.state.peers.length; i++) {
                this.state.peers[i].pc.getTransceivers().forEach((transceiver) => {
                    if (transceiver.sender.track && transceiver.sender.track.kind === "audio") {
                        transceiver.sender.track.enabled = true;
                    }
                });
            }
        }
    }

    public stopSpeak() {
        if (this.state.peers) {
            for (let i: number  = 0; i < this.state.peers.length; i++) {
                this.state.peers[i].pc.getTransceivers().forEach((transceiver) => {
                    if (transceiver.sender.track && transceiver.sender.track.kind === "audio") {
                        transceiver.sender.track.enabled = false;
                    }
                });
            }
        }
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
        const remote = electron.remote;
        remote.getCurrentWindow().removeListener("move", this.moveHandler);

        this.props.currentSession!.sendMessage({
            kind: "chat_history",
            // diff
            payload: this.chatHistory.substring(this.props.currentSession!.chatHistory.length),
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
        const next = !this.state.alwaysOnTop;
        this.setState({alwaysOnTop: next});
        const remote = electron.remote;
        remote.getCurrentWindow().setAlwaysOnTop(next);
    };

    public setChatHistory = (chatHistory: string) => this.chatHistory = chatHistory;

    public setupSharedDisplay() {
        const remote = electron.remote;
        let clientX = remote.getCurrentWindow().getBounds().x;
        let clientY = remote.getCurrentWindow().getBounds().y;

        let display;
        let displays = electron.screen.getAllDisplays();
        for (let i = 0; i < displays.length; ++i) {
            if (displays[i].bounds.x <= clientX && displays[i].bounds.y <= clientY
                && displays[i].bounds.x + displays[i].size.width >= clientX
                && displays[i].bounds.y + displays[i].size.height >= clientY
                && displays[i].id !== this.preDisplayId) {
                display = displays[i];
                break;
            }
        }
        if (display === undefined) return;

        this.preDisplayId = display.id;
        const screenSharingConstraints = {
            mandatory: {
                chromeMediaSource: "desktop",
                // chromeMediaSourceId : "screen:" + display.id,
            },
        };

        console.log(os.type)
        askForMediaAccess().then(() => {
            navigator.mediaDevices.getUserMedia({
                video: screenSharingConstraints as any,
            }).then((stream) => {
                this.stream = stream;
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                }).then((audioStream) => {
                    stream.addTrack(audioStream.getTracks()[0]);
                    this.state.peers.forEach(peer => peer.addTracks(stream));
                    this.stream = stream;
                });
            });
        });
    }

    moveHandler = () => {
        this.setupSharedDisplay();
    };

    toggleShowShare = (e: any) => {
        this.setState({showShare: this.state.showShare ? undefined : e.target});
    };

    toggleShowTips = (e: any) => {
        this.setState({showTips: this.state.showTips ? undefined : e.target});
    };

    handleButtonDown = (e: any) => {
        e.preventDefault();
        this.startSpeak();
    };

    handleButtonUp = (e: any) => {
        e.preventDefault();
        this.stopSpeak();
    };

    public render() {
        const navigatorUrl = `${Config.WORKSPACE_BASE_ADDRESS}/session/${this.state.sessionId}`;
        const zeroPadding = function (num: number) {
          return ("0000000000" + num).slice(-2);
        };
        return (
            <div className="h-100 d-flex flex-column">
                <div className="start d-flex">
                    <h1 className="d-inline">
                        {this.state.mode === SessionMode.Strict
                            ? `${zeroPadding(Math.floor(this.state.timeRemainingInSeconds / 60))} : ${zeroPadding(this.state.timeRemainingInSeconds % 60)}`
                            : "Free mode"}
                    </h1>
                    <div id="share-controls" className="ml-auto">
                        <Button className="ml-1" variant="primary"
                            title="Stop and hand over the driver role"
                            onClick={this.clickStopHandle}>
                            <FontAwesomeIcon icon="stop-circle" />
                        </Button>
                        <Button className="ml-1" variant="primary"
                            title="Show always on top"
                            active={this.state.alwaysOnTop}
                            onClick={this.handleCheck}>
                            <FontAwesomeIcon icon="arrow-up" />
                        </Button>
                        <Overlay placement="bottom" show={!!this.state.showTips} target={this.state.showTips}>
                            <Popover id="popover-basic-1">
                                <PopoverTitle as="h3">Tips</PopoverTitle>
                                <PopoverContent>
                                    <h5>Hot key</h5>
                                    <p>1. Press [Ctrl] + [Enter] to send text message</p>
                                    <p>2. Press [F2] to speak</p>
                                    <h5>Questions</h5>
                                    <p>If voice chat can't work well, please check the permission of microphone</p>
                                </PopoverContent>
                            </Popover>
                        </Overlay>
                        <Button className="ml-1" onClick={this.toggleShowTips}
                                title="Tip&Question">
                            <FontAwesomeIcon icon="question" />
                        </Button>
                        <Overlay placement="bottom" show={!!this.state.showShare} target={this.state.showShare}>
                            <Popover id="popover-basic">
                                <PopoverTitle as="h3">Invite a navigator ({this.state.peers.length} connected)</PopoverTitle>
                                <PopoverContent>
                                    <Form.Control readOnly={true} value={navigatorUrl} onFocus={this.handleFocus} />
                                </PopoverContent>
                            </Popover>
                        </Overlay>
                        <Button className="ml-1" onClick={this.toggleShowShare}
                            title="Invite a team member">
                            <FontAwesomeIcon icon="share-alt" />
                        </Button>
                    </div>
                </div>
                <Chat nav_message={this.state.nav_message}
                      setChatHistoryToParent={this.setChatHistory}
                      chatHistory={this.state.chatHistory}
                      startSpeak={this.handleButtonDown}
                      stopSpeak={this.handleButtonUp} />
                <audio autoPlay={true} ref={this.setAudioRef}/>
            </div>
        );
    }

    onWebSocketMessage = (e: any) => {
        const obj = JSON.parse(e.data);
        let count: number = 0;
        if (obj.kind === "request_sdp") {
            const navigator_id = obj.navigator_id;
            console.log(`[WS] Received 'request_sdp' from ${navigator_id}`);

            // if other navigators exist, tell new navigator to send sdp to other navigators
            if (this.state.peers.length > 0) {
                console.log("new navigator");
                this.state.peers.forEach((peer) => {
                    this.props.currentSession!.sendMessage({
                        kind: "navigator_request_sdp",
                        payload: "",
                        navigator_id: peer.id.toString(),
                        remoteId: navigator_id,
                    });
                });
            }

            const peer = new RTCPeerConnection(Config.RTCPeerConnectionConfiguration);
            const peerInfo = new PeerInfo(navigator_id, peer);

            peer.ontrack = (ev) => {
                console.log("-- peer.ontrack()");
                console.log(ev.track);
                this.receivedAudioStream.addTrack(ev.track);
                console.log(this.receivedAudioStream.getAudioTracks().length);
                if (this.audioRef) {
                    this.audioRef.srcObject = this.receivedAudioStream;
                }
            };

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
                    this.props.currentSession!.sendMessage({
                        kind: "ice_candidate",
                        payload: "",
                        navigator_id: navigator_id,
                    });
                }
            };

            peer.onconnectionstatechange = (evt) => {
                switch (peer.connectionState) {
                    case "disconnected":
                        console.log("peer disconnect");
                        for (let i: number  = 0; i < this.state.peers.length; i++) {
                            if (this.state.peers[i].pc.connectionState === "failed" ||
                                this.state.peers[i].pc.connectionState === "disconnected") {
                                this.state.peers[i].pc.close();
                                this.state.peers.splice(i, 1);
                            }
                        }
                        break;
                }
            };

            peer.onnegotiationneeded = async () => {
                if (count === 0) {
                    count += 1;
                    return ;
                }
                if (count === 1) {
                    count = 0;
                }
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
        } else if (obj.kind === "navigator_sdp") { // send navigator sdp to other navigators
            this.state.peers.forEach((peer) => {
                if (peer.id === obj.remoteId) {
                    this.props.currentSession!.sendMessage({
                        kind: "navigator_sdp",
                        payload: obj.payload,
                        navigator_id: obj.remoteId,
                        remoteId: obj.navigator_id,
                    });
                }
            });
        } else if (obj.kind === "navigator_answer") { // send navigator answer to other navigator
            this.state.peers.forEach((peer) => {
                if (peer.id === obj.remoteId) {
                    this.props.currentSession!.sendMessage({
                        kind: "navigator_answer",
                        payload: obj.payload,
                        navigator_id: obj.remoteId,
                        remoteId: obj.navigator_id,
                    });
                    return;
                }
            });
        } else if (obj.kind === "navigator_ice") { // send navigator ice candidate to other navigators
            this.state.peers.forEach((peer) => {
                if (peer.id === obj.remoteId) {
                    this.props.currentSession!.sendMessage({
                        kind: "navigator_ice",
                        payload: obj.payload,
                        navigator_id: obj.remoteId,
                        remoteId: obj.navigator_id,
                    });
                    return;
                }
            });
        }  else if (obj.kind === "sdp") {
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

    private readonly setAudioRef = (audioRef: HTMLAudioElement) => {
        this.audioRef = audioRef;
        if (audioRef === null) {
            return;
        }
        if (this.receivedAudioStream) {
            audioRef.srcObject = this.receivedAudioStream;
        }
    }
}

async function askForMediaAccess(): Promise<boolean> {
    try {
        if (os.type() !== "Darwin") {
            return true;
        }

        const {systemPreferences} = electron.remote.require('electron');
        const status = await systemPreferences.getMediaAccessStatus("microphone");
        console.log("Current microphone access status:", status);

        if (status === "not-determined" || status === "denied") {
            const success = await systemPreferences.askForMediaAccess("microphone");
            console.log("Result of microphone access:", success.valueOf() ? "granted" : "denied");
            return success.valueOf();
        }

        return status === "granted";
    } catch (error) {
        console.error("Could not get microphone permission:", error.message);
    }
    return false;
}
