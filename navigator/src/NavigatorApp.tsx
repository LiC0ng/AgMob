import React from 'react';
import Button from 'react-bootstrap/Button';
import {FormControl} from "react-bootstrap";
import {InputGroup} from "react-bootstrap";

function getSessionId() {
  return window.location.pathname.match(/\/session\/([a-z0-9-]+)/)![1];
}

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
// FIXME: NOT WORKING ON LOCAL
//const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";
const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "ws://160.16.213.209:80";
const pcConfig = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]};

interface Props {
    history: any;
}
interface State { }

export default class NavigatorApp extends React.Component<Props, State> {
  private stream?: MediaStream;
  private peer?: RTCPeerConnection;
  private videoRef?: HTMLVideoElement;
  private readonly setVideoRef = (videoRef: HTMLVideoElement) => {
    if (videoRef === null) return;
    if (this.stream)
      videoRef.srcObject = this.stream;
    this.videoRef = videoRef;
  };

  componentDidMount() {
    this.sendWebsocket();
  }

  public reconnect() {
      setTimeout(() => {
          this.sendWebsocket();
      }, 2000);
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

        let sendObject = {
          "kind": "request_sdp",
          "payload": "",
        };
        ws.send(JSON.stringify(sendObject));
      };
      const self = this;
      ws.onmessage = function(evt) {
          const message = JSON.parse(evt.data);
          switch (message.kind) {
              case "sdp":
                  console.log(message);
                  const sdp = message;
                  peer = new RTCPeerConnection(pcConfig);
                  self.peer = peer;
                  peer.ontrack = evt => {
                      console.log('-- peer.ontrack()');
                      console.log(evt.track);
                      console.log(evt.streams);
                      evt.streams[0].addTrack(evt.track);
                      self.stream = evt.streams[0];
                      if (self.videoRef) {
                          self.videoRef.srcObject = self.stream;
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
                              self.props.history.push("/wait");
                              break;
                          case "failed":
                              // One or more transports has terminated unexpectedly or in an error
                              if(self.videoRef){
                                  self.videoRef.pause();
                                  self.videoRef.currentTime =  0;
                              }
                              break;
                          case "closed":
                              // The connection has been closed
                              if(self.videoRef){
                                  self.videoRef.pause();
                                  self.videoRef.currentTime =  0;
                              }
                              break;
                      }
                  };

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
                  });
                  break;
              case "driver_ready":
                  let sendObject = {
                      "kind": "request_sdp",
                      "payload": "",
                  };
                  ws.send(JSON.stringify(sendObject));

                  break;
              case "driver_quit":
                  break;
          }
      };

      ws.onclose = () => {
          console.log("closed");
      };

      ws.onerror = () => {
          console.log("error");
          this.reconnect();
      };
  }


  handleStart = async (event: any) => {
    event.preventDefault();
    if (this.videoRef)
      await this.videoRef.play();
  };

  render() {
    return (
			<div>
				<div style={{ textAlign: "center" }}>
					<video width="960" height="720" autoPlay={true}
							ref={this.setVideoRef} muted/>
				</div>
				<InputGroup className="mb-3">
					<FormControl
						placeholder="Input Message Here"
						aria-label="Input Message Here"
						aria-describedby="message"
					/>
					<InputGroup.Append>
						<Button variant="primary">Send Message</Button>
					</InputGroup.Append>
        </InputGroup>
			</div>
    );
  }
}
