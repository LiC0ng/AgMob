require('~/webrtc')
let peer;


function sendWebsocket() {
    var id = document.getElementById("session-id").value;
    var url = "ws://localhost:8080/api/session/" + id + "/navigator";
    var ws = new WebSocket(url);

    ws.onopen = function() {
      peer = new prepareNewConnection(true);
      peer.ontrack = evt => {
        console.log('-- peer.ontrack()');
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

        peerConnection.setRemoteDescription(JSON.parse(sdp.payload)).then(() => {
          console.log('setRemoteDescription(answer) succsess in promise');
        })
    };

    ws.onclose = function() {
        console.log("closed");
    };

    ws.onerror = function(evt) {
        alert("error");
    };
}

// Answer側のSDPをセットする場合
async function setAnswer(sessionDescription) {
  if (! peerConnection) {
    console.error('peerConnection NOT exist!');
    return;
  }
  try{
    await peerConnection.setRemoteDescription(sessionDescription);
    console.log('setRemoteDescription(answer) succsess in promise');
  } catch(err){
    console.error('setRemoteDescription(answer) ERROR: ', err);
  }
}
