let peer;
const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://agmob-do-not-use-for-production.rhe.jp";
const pcConfig = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]};
let video = document.getElementById("agmob-screen-viewer");
let stream;


function sendWebsocket() {
    const id = getSessionId();
    var url = `${WORKSPACE_WEBSOCKET_BASE_ADDRESS}/api/session/${id}/navigator`;
    var ws = new WebSocket(url);

    ws.onopen = function() {
      console.log("WebSocket connected");
      peer = new RTCPeerConnection(pcConfig);
      peer.ontrack = evt => {
        console.log('-- peer.ontrack()');
        console.log(evt.track);
        console.log(evt.streams);
        evt.streams[0].addTrack(evt.track);
        stream = evt.streams[0];
        playVideo(video, evt.streams[0]);
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

function getSessionId() {
  return location.pathname.match(/\/session\/([a-z0-9-]+)/)[1];
}

// Videoの再生を開始する
async function playVideo(element, stream) {
  element.srcObject = stream;
  try {
      await element.play();
  } catch(err) {
      console.log('error auto play:' + err);
  }
}

sendWebsocket();
