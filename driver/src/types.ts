export interface SessionData {
    sessionId: string;
    startTimeInMinutes: number;
}

export const SessionDataDummy: SessionData = {
    sessionId: "DUMMY",
    startTimeInMinutes: 5,
}

export interface PropsWithSession {
    currentSession?: SessionData;
    onUpdateSession: (sd?: SessionData) => void;
}
