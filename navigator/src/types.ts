import * as Config from "./config";

export enum SessionMode {
    Strict = "Strict Mode",
    Free = "Free Mode",
};

export enum NavigatorState {
    // Not connected to WebSocket
    Disconnected,
    // Connected to WebSocket, not connected with Driver
    WaitingDriver,
    // Connected to Driver
    Connected,
};
