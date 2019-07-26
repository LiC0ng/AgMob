import React from 'react';

function getSessionId() {
  return window.location.pathname.match(/\/session\/([a-z0-9-]+)/)![1];
}

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
// FIXME: NOT WORKING ON LOCAL
//const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";
const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "ws://160.16.213.209:80";
const pcConfig = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]};

interface Props { }
interface State { }

export default class NavigatorApp extends React.Component<Props, State> {
  private stream?: MediaStream;
  private peer?: RTCPeerConnection;
  private videoRef?: HTMLVideoElement;
  private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
    if (this.stream)
      videoRef.srcObject = this.stream;
    this.videoRef = videoRef;
  };

  componentDidMount() {
    this.sendWebsocket();
  }

  private ws?: WebSocket;
  private sendWebsocket() {
      const id = getSessionId();
      var url = `${WORKSPACE_WEBSOCKET_BASE_ADDRESS}/api/session/${id}/navigator`;
      var ws = new WebSocket(url);
    this.ws = ws;

      let peer: RTCPeerConnection;
      ws.onopen = () => {
        console.log("WebSocket connected");
        peer = new RTCPeerConnection(pcConfig);
        this.peer = peer;
        peer.ontrack = evt => {
          console.log('-- peer.ontrack()');
          console.log(evt.track);
          console.log(evt.streams);
          evt.streams[0].addTrack(evt.track);
          this.stream = evt.streams[0];
          if (this.videoRef) {
            this.videoRef.srcObject = this.stream;
          }
        };

        // ICE Candidateを収集したときのイベント
        peer.onicecandidate = evt => {
          if (evt.candidate) {
              console.log(evt.candidate);
          } else {
              console.log('empty ice event');
              const sdp = peer.localDescription;
              const sendObject = {
                "kind": "sdp",
                "payload": JSON.stringify(sdp)
              };
              ws.send(JSON.stringify(sendObject));
          }
        };
        peer.onconnectionstatechange = evt => {
              switch(peer.connectionState) {
                  case "connected":
                      // The connection has become fully connected
                      break;
                  case "disconnected":
                  case "failed":
                      // One or more transports has terminated unexpectedly or in an error
                      if(this.videoRef){
                          this.videoRef.pause();
                          this.videoRef.currentTime =  0;
                      }
                      break;
                  case "closed":
                      // The connection has been closed
                      if(this.videoRef){
                          this.videoRef.pause();
                          this.videoRef.currentTime =  0;
                      }
                      break;
              }
        }
        let sendObject = {
          "kind": "request_sdp",
          "payload": "",
        };
        ws.send(JSON.stringify(sendObject));
      };

      ws.onmessage = function(evt) {
          console.log(evt.data);
          const sdp = JSON.parse(evt.data);

          peer.setRemoteDescription(JSON.parse(sdp.payload)).then(() => {
            console.log('setRemoteDescription(answer) success in promise');
            peer.createAnswer().then((answer) => {
              peer.setLocalDescription(answer).then(() => {
                // const sdp = peer.localDescription;
                // const sendObject = {
                //   "kind": "sdp",
                //   "payload": JSON.stringify(sdp)
                // };
                // ws.send(JSON.stringify(sendObject));
              })
            })
          })
      };

      ws.onclose = function() {
          console.log("closed");
      };

      ws.onerror = function(evt) {
          alert("error");
      };
  }

  handleStart = async (event: any) => {
    event.preventDefault();
    if (this.videoRef)
      await this.videoRef.play();
  }

  render() {
    return (
      <div style={{ textAlign: "center" }}>
        <button onClick={this.handleStart}>start sharing</button>
        <video width="960" height="720" autoPlay={true}
            ref={this.setVideoRef} />
      </div>
    );
  }
}
