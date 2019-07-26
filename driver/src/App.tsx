import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  RouteComponentProps
} from "react-router-dom";
import './App.css';
import End from "./End";
import TimerCountdown from "./timer";
import Top from "./Top";
import Join from "./Join"
import { Button, Container} from "react-bootstrap";
import StartShare from "./start-share-page";



const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";
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

  private endPage = <End/>;
  private agmobPage = <TimerCountdown startTimeInSeconds={0} startTimeInMinutes={0}/>;
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

  public onsetSessionId(sessionId: string){
    this.setState({sessionId: sessionId});

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
    console.log("Start button pressed");
    event.preventDefault();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${WORKSPACE_BASE_ADDRESS}/api/session`);
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

  newWorkspace(){
    return <div>
      <h1>newWorkspace</h1>
    </div>
  }

  driver(){
    return <div>driver</div>
  }

  newDriver(){
    return <div>newDriver</div>
  }


  render() {
    // const navigatorUrl = `${WORKSPACE_BASE_ADDRESS}/session/${this.state.sessionId}`;
    // return (
    //     <div className="App">
    //       {!this.state.sessionId ?
    //       <a className="App-link" href="#" onClick={this.handleStart}>
    //         Start
    //       </a> :
    //       <a className="App-link" href="#" onClick={this.handleStop}>
    //         Stop
    //       </a>}
    //       <div>
    //         <label htmlFor="navigatorUrlText">Navigator URL</label>
    //         <input id="navigatorUrlText" value={navigatorUrl}
    //                onFocus={this.handleFocus} />
    //       </div>
    //       <div>
    //         <video style={{ width: "80%" }} autoPlay={true}
    //                ref={this.setVideoRef} />
    //       </div>
    //       <div>
    //         Connected to {Object.keys(this.state.peerList).length} navigator(s).
    //       </div>
    //     </div>
    // );

    return (
        <Container>
          <Router>
            <Switch>
              <Route exact={true} path="/"><Top/></Route>
              <Route path="/new_workspace/" component={ TimerCountdown }/>
              <Route path="/join_workspace/"><Join/></Route>
              <Route path="/agmob/">{this.agmobPage}</Route>
              <Route path="/end/"><End sessionId={this.state.sessionId}/></Route>
              <Route path="/start_page/" component={ StartShare } />
            </Switch>
          </Router>
        </Container>
    );
  }
}



// P2P通信を切断する
// function hangUp(){
//   if (peerConnection) {
//     if(peerConnection.iceConnectionState !== 'closed'){
//       peerConnection.close();
//       peerConnection = null;
//       negotiationneededCounter = 0;
//       const message = JSON.stringify({ type: 'close' });
//       console.log('sending close message');
//       ws.send(message);
//       cleanupVideoElement(remoteVideo);
//       textForSendSdp.value = '';
//       textToReceiveSdp.value = '';
//       return;
//     }
//   }
//   console.log('peerConnection is closed.');
// }
