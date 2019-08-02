import React from "react";
import {Button} from "react-bootstrap";

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";
const pcConfig = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]};

interface IProps {
    startTimeInMinutes: number;
    history: any;
}

interface IState {
  timeRemainingInSeconds: number;
  timeRemainingInMinutes: number;
  sessionId: string;
  connection?: WebSocket;
  peerList: any;
}

export default class StartShare extends React.Component<IProps, IState> {

  private stream?: MediaStream;
  private videoRef?: HTMLVideoElement;

    private timer: any;

    public constructor(props: IProps) {
        super(props);
        this.state = {
            timeRemainingInMinutes: this.props.history.location.state.startTimeInMinutes,
            timeRemainingInSeconds: 0,
          sessionId: this.props.history.location.state.sessionId,
          peerList: [],
        };
        this.clickStartHandle = this.clickStartHandle.bind(this);
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
      if (this.videoRef) {
        this.videoRef.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        console.log(track);
        Object.values(this.state.peerList).forEach((peer) =>
            (peer as RTCPeerConnection).addTrack(track, stream));
      });
    });

    this.connectWebsocket();
  }
  public reconnect() {
      setTimeout(() => {
        console.log("reconnecting")
        this.connectWebsocket();
      }, 2000);
  }

    public clickStartHandle() {
        if (this.timer === undefined) {
            this.timer = setInterval( () => {
                this.startTimerCountdownHandler();
            }, 1000);
        }
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
            clearInterval(this.timer!);
            Object.values(this.state.peerList).forEach((peer) => {
                this.hangUp(peer as RTCPeerConnection);
            });
            if(this.state.connection){
                this.state.connection.close();
            }
            this.props.history.push({pathname: "/end", state: {sessionId: this.state.sessionId}});

        }
    }

  public handleFocus = (event: any) => event.target.select();

    public render() {
      const navigatorUrl = `${WORKSPACE_BASE_ADDRESS}/session/${this.state.sessionId}`;
      return (
           <div>
            <div className="start">
                <Button onClick={ this.clickStartHandle }>Start</Button>
                <h1>
                    {this.state.timeRemainingInMinutes} : {this.state.timeRemainingInSeconds}
                </h1>
            </div>
             {/*<div>*/}
             {/*  <video style={{ width: "80%" }} autoPlay={true}*/}
             {/*         ref={this.setVideoRef} />*/}
             {/*</div>*/}
           <div>
             <label htmlFor="navigatorUrlText">Navigator URL</label>
             <input id="navigatorUrlText" value={navigatorUrl}
                    onFocus={this.handleFocus} />
           </div>
           <div>
             Connected to {Object.keys(this.state.peerList).length} navigator(s).
           </div>
           </div>
        );
    }

    private hangUp(peer: RTCPeerConnection) {
        if (peer.iceConnectionState !== "closed") {
            peer.close();

        }
    }

  private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
    if (this.stream) {
      videoRef.srcObject = this.stream;
    }
    this.videoRef = videoRef;
  }

  private connectWebsocket() {
    if (!this.state.sessionId) {
      console.log("[BUG] session id not set");
      return;
    }
    if (this.state.connection !== undefined) {
      console.log("websocket already connected");
      return;
    }

    const socketUrl = `${WORKSPACE_WEBSOCKET_BASE_ADDRESS}` +
                  `/api/session/${this.state.sessionId}/driver`;
    const connection = new WebSocket(socketUrl);

    connection.onopen = (e) => {
      console.log("WebSocket connected");
      this.setState({ connection });
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
          if (ev.candidate) {
            console.log(ev);
          } else {
            const sdp = peer.localDescription;
            const sendObject = {
              kind: "sdp",
              payload: JSON.stringify(sdp),
              navigator_id,
            };
            connection.send(JSON.stringify(sendObject));
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
    };
    connection.onerror = (e) => {
      console.log(e);
      this.reconnect();
      this.setState({ connection: undefined });
    };
    connection.onclose = (e) => {
      console.log(e);
      this.setState({ connection: undefined });

      Object.values(this.state.peerList).forEach((peer) => {
            this.hangUp(peer as RTCPeerConnection);
        });
    };
  }
}
