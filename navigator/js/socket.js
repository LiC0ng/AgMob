
function sendWebsocket() {
    var id = document.getElementById("session-id").value;
    var url = "ws://localhost:8080/api/session/" + id + "/navigator";
    var ws = new WebSocket(url);

    ws.onopen = function() {
      const peer = new RTCPeerConnection({ iceServers: [{ url: "stun:stun.l.google.com:19302" }] });
      peer.createOffer().then(function (sdp){
        peer.setLocalDescription(sdp).then(function(){
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
    };

    ws.onclose = function() {
        console.log("closed");
    };

    ws.onerror = function(evt) {
        alert("error");
    };
}
