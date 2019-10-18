export const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
export const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";

export const RTCPeerConnectionConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:160.16.213.209" },
        { urls: "turn:160.16.213.209", credential: "ZPu5tyGmdsAEn6dlYJkNBse/x/UQnMj2", username: "agmob" },
    ]
};
