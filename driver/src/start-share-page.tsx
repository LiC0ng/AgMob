import React from "react";
import {Button} from "react-bootstrap";
import {Form} from "react-bootstrap";
import Chat from "./Chat";
import * as Config from "./config";
import {PropsWithSession} from "./types";

interface IProps extends PropsWithSession {
    history: any;
}

interface IState {
    timeRemainingInSeconds: number;
    timeRemainingInMinutes: number;
    sessionId: string;
    timer?: number;
    peerList: any;
}

export default class StartShare extends React.Component<IProps, IState> {

    private stream?: MediaStream;

    public constructor(props: IProps) {
        super(props);
        this.state = {
            timeRemainingInMinutes: props.currentSession!.startTimeInMinutes,
            timeRemainingInSeconds: 0,
            sessionId: props.currentSession!.sessionId,
            timer: undefined,
            peerList: [],
        };
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
            stream.getTracks().forEach((track) => {
                console.log(track);
                Object.values(this.state.peerList).forEach((peer) =>
                    (peer as RTCPeerConnection).addTrack(track, stream));
            });
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
        } else {
            clearInterval(this.state.timer!);
            this.setState({ timer: undefined });
            this.props.currentSession!.sendMessage({
                kind: "driver_quit",
                payload: "",
            });
            Object.values(this.state.peerList).forEach((peer) => {
                this.hangUp(peer as RTCPeerConnection);
            });
            this.props.history.push({pathname: "/end"});
        }
    }

    public handleFocus = (event: any) => event.target.select();

    public render() {
        const navigatorUrl = `${Config.WORKSPACE_BASE_ADDRESS}/session/${this.state.sessionId}`;
        return (
            <div>
                <div className="start">
                    {this.state.timeRemainingInMinutes !== -1 ?
                        <h1>{this.state.timeRemainingInMinutes} : {this.state.timeRemainingInSeconds}</h1>
                        : <h1>Free mode</h1>
                    }
                </div>
                <Form.Group>
                  <Form.Label>Join Session ({Object.keys(this.state.peerList).length} connected)</Form.Label>
                  <Form.Control readOnly={true} value={navigatorUrl} onFocus={this.handleFocus} />
                </Form.Group>
                <Chat sessionId={this.state.sessionId}/>
           </div>
        );
    }

    private hangUp(peer: RTCPeerConnection) {
        if (peer.iceConnectionState !== "closed") {
            peer.close();
        }
    }

    onWebSocketMessage = (e: any)  => {
        const obj = JSON.parse(e.data);
        if (obj.kind === "request_sdp") {
            console.log("[WS] Received 'request_sdp'")
            const peer = new RTCPeerConnection(Config.RTCPeerConnectionConfiguration);
            const navigator_id = obj.navigator_id;

            peer.ontrack = (ev) => {
                console.log(ev);
            };

            peer.onicecandidate = (ev) => {
                if (ev.candidate) {
                    console.log(ev);
                } else {
                    const sdp = peer.localDescription;
                    this.props.currentSession!.sendMessage({
                        kind: "sdp",
                        payload: JSON.stringify(sdp),
                        navigator_id,
                    });
                }
            };

            peer.onnegotiationneeded = async () => {
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    // const sdp = peer.localDescription;
                    // const sendObject = {
                    //     kind: "sdp",
                    //     payload: JSON.stringify(sdp),
                    //     navigator_id: navigator_id,
                    // };
                    // connection.send(JSON.stringify(sendObject));
                } catch (err) {
                    console.error(err);
                }
            };
            if (this.stream) {
                this.stream.getTracks().forEach((track) => {
                    console.log(track);
                    peer.addTrack(track, this.stream!);
                });
            }

            this.setState({ peerList: {...this.state.peerList, [obj.navigator_id]: peer }});
        } else if (obj.kind === "sdp") {
            const peer = this.state.peerList[obj.navigator_id];
            const sdp = JSON.parse(obj.payload);
            peer.setRemoteDescription(sdp);
        } else if (obj.kind === "interrupt_hogefuga_papparapa------------------------------------------------------------------") {
            Object.values(this.state.peerList).forEach((peer) => {
                this.hangUp(peer as RTCPeerConnection);
            });
        }
    }
}
