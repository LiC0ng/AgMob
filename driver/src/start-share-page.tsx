import React from "react";
import {Form, InputGroup} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Chat from "./Chat";
import * as Config from "./config";
import {PropsWithSession} from "./types";
const electron = window.require("electron");

interface IProps extends PropsWithSession {
    history: any;
}

interface IState {
    timeRemainingInSeconds: number;
    timeRemainingInMinutes: number;
    sessionId: string;
    chatHistory: string;
    timer?: number;
    peerList: RTCPeerConnection[];
}

declare global {
    interface Window {
        require: any;
    }
}

export default class StartShare extends React.Component<IProps, IState> {
    private stream?: MediaStream;

    public constructor(props: IProps) {
        super(props);
        this.state = {
            timeRemainingInMinutes: props.currentSession!.startTimeInMinutes,
            timeRemainingInSeconds: 0,
            sessionId: props.currentSession!.sessionId,
            chatHistory: "",
            timer: undefined,
            peerList: [],
        };
        this.clickStopHandle = this.clickStopHandle.bind(this);

        // FIXME: electron.ipcRenderer.send() should be called when receiving
        // laser pointers data through the data channel.  As the argument,
        // this component passes the positions of all laser pointers, in an
        // array of LaserPointerState.
        let a = 0;
        setInterval(() => {
            // Prepare a dummy position
            a = (a + 1) % 800;
            // Check the definition of LaserPointerState
            const ary = [
                { color: "255, 0, 0", posX: a, posY: a },
            ];
            electron.ipcRenderer.send("overlay", ary);
        }, 30);
    }

    private addTrackToPeer(pc: RTCPeerConnection, stream: MediaStream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    public componentDidMount() {
        const screenSharingConstraints = {
            mandatory: {
                chromeMediaSource: "desktop",
            },
        };
        navigator.mediaDevices.getUserMedia({
            video: screenSharingConstraints as any,
        }).then((stream) => {
            this.stream = stream;
            Object.values(this.state.peerList).forEach(pc => this.addTrackToPeer(pc, stream));
        });

        this.props.currentSession!.attach(this.onWebSocketMessage);
        this.props.currentSession!.sendMessage({
            kind: "driver_ready",
            payload: "",
        });
        this.setState({
            timer: window.setInterval(() => this.startTimerCountdownHandler(), 1000),
        });
    }

    public componentWillUnmount() {
        this.props.currentSession!.detach(this.onWebSocketMessage);
    }

    public startTimerCountdownHandler() {
        if (this.state.timeRemainingInSeconds > 0) {
            this.setState({
                timeRemainingInSeconds: this.state.timeRemainingInSeconds - 1,
            });
        } else if (this.state.timeRemainingInMinutes > 0 && this.state.timeRemainingInSeconds <= 0) {
            this.setState({
                timeRemainingInMinutes: this.state.timeRemainingInMinutes - 1,
                timeRemainingInSeconds: 59,
            });
        } else if (this.state.timeRemainingInMinutes !== -1) {
            this.stopSharing();
        }
    }

    public stopSharing() {
        clearInterval(this.state.timer!);
        this.setState({timer: undefined});
        this.props.currentSession!.sendMessage({
            kind: "driver_quit",
            payload: "",
        });
        Object.values(this.state.peerList).forEach((peer) => {
            this.hangUp(peer as RTCPeerConnection);
        });
        this.props.history.push({pathname: "/end"});
    }

    public clickStopHandle() {
        this.stopSharing();
    }

    public handleFocus = (event: any) => event.target.select();

    public handleCheck = (event: any) => {
        const remote = window.require('electron').remote;
        remote.getCurrentWindow().setAlwaysOnTop(event.target.checked);
    };

    public render() {
        const navigatorUrl = `${Config.WORKSPACE_BASE_ADDRESS}/session/${this.state.sessionId}`;
        return (
            <div>
                <div className="start">
                    {this.state.timeRemainingInMinutes !== -1 ?
                        <h1>{this.state.timeRemainingInMinutes} : {this.state.timeRemainingInSeconds}
                            <Button style={{marginLeft: 30}} variant="primary"
                                    onClick={this.clickStopHandle}>Stop</Button></h1>
                        : <h1>Free mode<Button style={{marginLeft: 30}} variant="primary"
                                               onClick={this.clickStopHandle}>Stop</Button></h1>
                    }
                </div>
                <Form.Group>
                    <Form.Label>Join Session ({Object.keys(this.state.peerList).length} connected)</Form.Label>
                    <Form.Control readOnly={true} value={navigatorUrl} onFocus={this.handleFocus}/>
                </Form.Group>
                <Chat history={this.state.chatHistory}/>
                <Form.Group>
                    <Form.Check type="checkbox" label="Show always on top" onChange={this.handleCheck} defaultChecked/>
                </Form.Group>
            </div>
        );
    }

    private hangUp(peer: RTCPeerConnection) {
        if (peer.iceConnectionState !== "closed") {
            peer.close();
        }
    }

    onWebSocketMessage = (e: any) => {
        const obj = JSON.parse(e.data);
        if (obj.kind === "request_sdp") {
            const navigator_id = obj.navigator_id;
            console.log(`[WS] Received 'request_sdp' from ${navigator_id}`);
            const peer = new RTCPeerConnection(Config.RTCPeerConnectionConfiguration);

            peer.onicecandidate = (ev) => {
                if (ev.candidate) {
                    console.log(`[RTC-${navigator_id}] New ICE candidate`);
                    console.log(ev.candidate);
                    this.props.currentSession!.sendMessage({
                        kind: "ice_candidate",
                        payload: JSON.stringify(ev.candidate),
                        navigator_id,
                    });
                } else {
                    console.log(`[RTC-${navigator_id}] ICE candidates complete`);
                }
            };

            peer.onnegotiationneeded = async () => {
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);

                    // Send initial SDP
                    console.log(`[RTC-${navigator_id}] Sending initial SDP`);
                    this.props.currentSession!.sendMessage({
                        kind: "sdp",
                        payload: JSON.stringify(peer.localDescription),
                        navigator_id,
                    });
                } catch (err) {
                    console.error(err);
                }
            };
            if (this.stream)
                this.addTrackToPeer(peer, this.stream);

            this.setState({peerList: {...this.state.peerList, [obj.navigator_id]: peer}});
        } else if (obj.kind === "sdp") {
            const peer = this.state.peerList[obj.navigator_id];
            const sdp = JSON.parse(obj.payload);
            peer.setRemoteDescription(sdp);
        } else if (obj.kind === "ice_candidate") {
            const peer = this.state.peerList[obj.navigator_id];
            const candidate = JSON.parse(obj.payload);
            peer.addIceCandidate(candidate);
        } else if (obj.kind === "chat") {
            this.setState({
                chatHistory: obj.payload,
            });
        } else if (obj.kind === "interrupt_hogefuga_papparapa------------------------------------------------------------------") {
            Object.values(this.state.peerList).forEach((peer) => {
                this.hangUp(peer as RTCPeerConnection);
            });
        }
    };
}
