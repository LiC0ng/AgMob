function createPeer() {
  const peer = new RTCPeerConnection({ iceServers: [{ url: "stun:stun.l.google.com:19302" }] });
  console.log(peer);
}
