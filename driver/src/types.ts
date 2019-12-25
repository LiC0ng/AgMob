import * as Config from "./config";

export enum SessionMode {
    Strict = "Strict Mode",
    Free = "Free Mode",
};

export class DriverSession {
    private constructor(
        public sessionId: string,
        private websocket: WebSocket,
        public mode: SessionMode,
        public startTimeInMinutes: number,
        public chatHistory: string
    ) {
        this.setupConnection();
    }

    public static async create(mode: SessionMode, startTimeInMinutes: number) {
        console.log("[DriverSession] POST /api/session =>");
        const ret = await fetch(`${Config.WORKSPACE_BASE_ADDRESS}/api/session`, {
            method: "POST",
            body: JSON.stringify({
                interval: startTimeInMinutes,
                begin: Math.floor(Date.now() / 1000),
                mode: mode,
                state: "Connected",
            }),
        });
        const obj = await ret.json();
        console.log(obj);

        const conn = await this.createWebSocket(obj.id);
        const time = startTimeInMinutes;

        return new DriverSession(obj.id, conn, mode, time, obj.history);
    }

    public static async join(sessionId: string) {
        const resId = Config.WORKSPACE_BASE_ADDRESS +
            `/api/session/${sessionId}`;
        // TODO: This doesn't look pretty. Can this GET request be removed?
        const retGet = await fetch(resId);
        if (retGet.status !== 200) {
            console.log("GET /api/session/{id} => " + retGet.text());
            return null;
        }
        const currentSession = await retGet.json();

        // Now replace 'begin' with current time and update config
        const ret = await fetch(resId, {
            method: "PUT",
            body: JSON.stringify({
                ...currentSession.config,
                begin: Math.floor(Date.now() / 1000),
                state: "Connected",
            }),
        });
        if (ret.status !== 200) {
            console.log("PUT /api/session/{id} => " + ret.text());
            return null;
        }
        const obj = await ret.json();
        console.log("PUT /api/session =>");
        console.log(obj);

        const conn = await this.createWebSocket(obj.id);
        return new DriverSession(obj.id, conn, obj.config.mode, obj.config.interval, obj.history);
    }

    public static dummy() {
        return new DriverSession("DUMMY", new WebSocket("DUMMY"), SessionMode.Free, 5, "");
    }

    private static createWebSocket(sessionId: string) {
        console.log("[WS] Connecting...");
        return new Promise<WebSocket>(function(resolve, reject) {
            const socketUrl = Config.WORKSPACE_WEBSOCKET_BASE_ADDRESS +
                `/api/session/${sessionId}/driver`;
            const connection = new WebSocket(socketUrl);
            connection.onopen = e => {
                console.log("[WS] Connected");
                resolve(connection);
            };
            connection.onerror = e => {
                console.log("[WS] Failed to connect");
                reject(e);
            };
        });
    }

    public isConnected() {
        return this.websocket.readyState === WebSocket.OPEN;
    }

    private setupConnection() {
        this.websocket.onerror = (e) => {
            console.log("[WS] Error; Reconnecting in 2 seconds");
            console.log(e);
            setTimeout(async () => {
                this.websocket = await DriverSession.createWebSocket(this.sessionId);
            }, 2000);
        };
        this.websocket.onclose = (e) => {
            console.log("[WS] Closed");
            console.log(e);
        };
    }

    sendMessage(obj: { kind: string, payload: string, navigator_id?: string, remoteId?: string }) {
        this.websocket.send(JSON.stringify(obj));
    }

    attach(e: (o: any) => void) {
        if (this.websocket.onmessage !== null)
            throw new Error("[WS] onmessage handler already exists");
        this.websocket.onmessage = e;
    }

    detach(e: (o: any) => void) {
        if (this.websocket.onmessage !== e) {
            console.log(this.websocket.onmessage);
            console.log(e);
            throw new Error("[WS] Detaching unknown onmessage handler");
        }
        this.websocket.onmessage = null;
    }
}

export interface PropsWithSession {
    currentSession?: DriverSession;
    onUpdateSession: (sd?: DriverSession) => void;
}

export interface LaserPointerState {
    // Identifies the navigator.  Maybe we should use a 'navigator' object or something...
    color: string;
    posX: number; // In px
    posY: number; // In px
}
