import React from 'react';
import './App.css';

const WORKSPACE_BASE_ADDRESS = "160.16.213.209:8080";
const pcConfig = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]};

interface Props {
}

interface State {
  sessionId?: string;
  peerList: any;
  connection?: WebSocket;
}

export default class App extends React.Component<Props, State> {
  private stream?: MediaStream;
  private videoRef?: HTMLVideoElement;
  private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
    if (this.stream)
      videoRef.srcObject = this.stream;
    this.videoRef = videoRef;
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      peerList: {},
    };
  }

  componentDidMount() {
    const screenSharingConstraints = {
      mandatory: {
        chromeMediaSource: "desktop",
      },
    };
    navigator.mediaDevices.getUserMedia({
      video: screenSharingConstraints as any,
    }).then((stream) => {
      this.stream = stream;
      if (this.videoRef)
        this.videoRef.srcObject = stream;
      stream.getTracks().forEach((track) => {
        console.log(track);
        Object.values(this.state.peerList).forEach(peer =>
            (peer as RTCPeerConnection).addTrack(track, stream));
      });
    });
  }

  handleStart = (event: any) => {
    event.preventDefault();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `http://${WORKSPACE_BASE_ADDRESS}/api/session`);
    xhr.send();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const obj = JSON.parse(xhr.responseText);
        console.log("POST /api/session =>");
        console.log(obj);
        this.setState({ sessionId: obj.id }, this.connectWebsocket);
      }
    };
  };

  handleStop = (event: any) => {
    event.preventDefault();
    alert("")
  };

  handleFocus = (event: any) => event.target.select();

  private connectWebsocket() {
    if (!this.state.sessionId) {
      console.log("[BUG] session id not set");
      return;
    }
    if (this.state.connection !== undefined) {
      console.log("websocket already connected");
      return;
    }

    const socketUrl = `ws://${WORKSPACE_BASE_ADDRESS}/api/session/${this.state.sessionId}/driver`;
    console.log("start websocket");
    const connection = new WebSocket(socketUrl);

    connection.onopen = (e) => {
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
            // const sdp = peer.localDescription;
            // const sendObject = {
            //     kind: "sdp",
            //     payload: JSON.stringify(sdp),
            //     navigator_id: navigator_id,
            // };
            // connection.send(JSON.stringify(sendObject));
          } catch(err){
            console.error(err);
          }
        };
        if (this.stream)
          this.stream.getTracks().forEach((track) => {
            console.log(track);
            peer.addTrack(track, this.stream!);
          });

        this.setState({ peerList: {...this.state.peerList, [obj.navigator_id]: peer }});
      }else if(obj.kind === "sdp"){
        const peer = this.state.peerList[obj.navigator_id];
        const sdp = JSON.parse(obj.payload);
        peer.setRemoteDescription(sdp);
      }
    };
    connection.onerror = (e) => {
      console.log(e);
      this.setState({ connection: undefined });
    };
    connection.onclose = (e) => {
      console.log(e);
      this.setState({ connection: undefined });
    };
  }

  render() {
    const navigatorUrl = `http://${WORKSPACE_BASE_ADDRESS}/session/${this.state.sessionId}`;
    return (
        <div className="App">
          <header className="App-header">
            {!this.state.sessionId ?
            <a className="App-link" href="#" onClick={this.handleStart}>
              Start
            </a> :
            <a className="App-link" href="#" onClick={this.handleStop}>
              Stop
            </a>}
            <input style={{ width: "100%"}} value={this.state.sessionId}
                   onFocus={this.handleFocus} />
            <input style={{ width: "100%"}} value={navigatorUrl}
                   onFocus={this.handleFocus} />
            <video style={{ width: "400px", height: "300px", border: "2px white" }} autoPlay={true}
                   ref={this.setVideoRef} />
          </header>
        </div>
    );
  }
}
