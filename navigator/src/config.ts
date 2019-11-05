export const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
export const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";

export const RTCPeerConnectionConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:160.16.213.209" },
        { urls: "turn:160.16.213.209", credential: "ZPu5tyGmdsAEn6dlYJkNBse/x/UQnMj2", username: "agmob" },
    ]
};

// plotly.js, src/components/color/attributes.js
export const Colors = [
  "#1f77b4",  // muted blue
  "#ff7f0e",  // safety orange
  "#2ca02c",  // cooked asparagus green
  "#d62728",  // brick red
  "#9467bd",  // muted purple
  "#8c564b",  // chestnut brown
  "#e377c2",  // raspberry yogurt pink
  "#7f7f7f",  // middle gray
  "#bcbd22",  // curry yellow-green
  "#17becf"   // blue-teal
];
