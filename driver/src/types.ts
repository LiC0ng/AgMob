export interface SessionData {
    sessionId: string;
    startTimeInMinutes: number;
}

export interface PropsWithSession {
    currentSession?: SessionData;
    onUpdateSession: (sd?: SessionData) => void;
}
