import React from "react";
import {Link} from "react-router-dom";
import {Button, Container} from "react-bootstrap";
import * as Config from "./config";
import {PropsWithSession} from "./types";

interface Props extends PropsWithSession {
}

interface State {
}

export default class End extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);
    }

    private handleFocus = (event: any) => event.target.select();

    public render() {
        const sess = this.props.currentSession;
        const token = sess ? sess.sessionId : "DUMMY";
        const driverUrl = `agmob-driver://${token}`;
        const navigatorUrl = Config.WORKSPACE_BASE_ADDRESS + "/agmob/session/" + token;
        return (
            <Container className="h-100 d-flex flex-column">
                <div className="flex-grow-1">
                    <h1>Well done!</h1>
                    <h4>It's time to hand over the driver role.</h4>
                    <hr />
                    <div className="my-3">
                        <Button className="btn-lg" href={navigatorUrl}>
                            Become a navigator
                        </Button>
                    </div>
                    <div className="my-3">
                        <Button className="btn-lg btn-secondary" href={driverUrl}>
                            Continue as the driver
                        </Button>
                    </div>
                </div>
                <div className="d-flex my-4">
                    <Link className="btn btn-primary btn-lg mr-4" to="/">
                        Back to top
                    </Link>
                </div>
            </Container>
        );
    }
}
