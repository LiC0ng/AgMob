
let peer;


function sendWebsocket() {
    var id = document.getElementById("session-id").value;
    var url = "ws://localhost:8080/api/session/" + id + "/navigator";
    var ws = new WebSocket(url);

    ws.onopen = function() {
      peer = new RTCPeerConnection({ iceServers: [{ url: "stun:stun.l.google.com:19302" }] });
      peer.createOffer().then(function (sdp){
        peer.setLocalDescription(sdp).then(function(){
          console.log(sdp);
          let sendObject = {
            "kind": "sdp",
            "payload": sdp.sdp
          };
          ws.send(JSON.stringify(sendObject));
        });
      });
    };

    ws.onmessage = function(evt) {
        console.log(evt.data);
        let sdp = JSON.parse(evt.data);
        let driverSdp = new RTCSessionDescription({type: "answer", sdp: sdp.payload});
        peer.setRemoteDescription(driverSdp).then();

    };

    ws.onclose = function() {
        console.log("closed");
    };

    ws.onerror = function(evt) {
        alert("error");
    };
}
