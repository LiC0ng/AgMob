import {ipcRenderer} from "electron";
import React from 'react';
import {
    BrowserRouter as Router,
    Route,
    Switch,
} from "react-router-dom";
import {Container} from "react-bootstrap";
import {DriverSession, PropsWithSession} from "./types";
import End from "./End";
import TimerCountdown from "./timer";
import Top from "./Top";
import Join from "./Join";
import StartShare from "./start-share-page";

interface Props {
}

interface State {
    componentProps: PropsWithSession;
    data: any;
}

export default class OverlayApp extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            componentProps: {
                currentSession: undefined,
                onUpdateSession: this.onUpdateSession,
            },
            data: null,
        };

        ipcRenderer.on("overlay", (event: any, arg: any) =>
            this.setState({ data: arg }));
    }

    onUpdateSession = (sd?: DriverSession) => {
        const props = {...this.state.componentProps};
        props.currentSession = sd;
        this.setState({componentProps: props});
    };

    render() {
        const componentProps = this.state.componentProps;
        return (
            <Container style={{ border: "20px solid #ff0000" }}>
                <h1>THIS IS THE OVERLAY WINDOW</h1>
                <h2>{this.state.data}</h2>
            </Container>
        );
    }
}
