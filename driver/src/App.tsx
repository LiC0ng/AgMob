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
}

export default class App extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            componentProps: {
                currentSession: undefined,
                onUpdateSession: this.onUpdateSession,
            },
        };
    }

    onUpdateSession = (sd?: DriverSession) => {
        const props = {...this.state.componentProps};
        props.currentSession = sd;
        this.setState({componentProps: props});
    };

    render() {
        const componentProps = this.state.componentProps;
        return (
            <Container fluid={true} id="main-root" className="h-100">
                <Router>
                    <Switch>
                        <Route exact={true} path="/" render={(obj) =>
                            <Top {...obj} {...componentProps} />}/>
                        <Route path="/new_workspace/" render={(obj) =>
                            <TimerCountdown {...obj} {...componentProps} />}/>
                        <Route path="/join_workspace/" render={(obj) =>
                            <Join {...obj} {...componentProps} />}/>
                        <Route path="/end/" render={(obj) =>
                            <End {...obj} {...componentProps} />}/>
                        <Route path="/start_page/" render={(obj) =>
                            <StartShare {...obj} {...componentProps} />}/>
                    </Switch>
                </Router>
            </Container>
        );
    }
}
