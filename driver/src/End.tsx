import React from "react";
import {Link} from "react-router-dom";
import {Button, Col, Row} from "react-bootstrap";
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
        const navigatorUrl = Config.WORKSPACE_BASE_ADDRESS + "/session/" + token;
        return (
            <div>
                <Row className="justify-content-md-center">
                    <Col>
                        <h1 className="text-center">Well done!</h1>
                        <div className="mt-3 text-center">
                            <h4>It's time to hand over the driver role.</h4>
                            <hr/>
                            <Button className="btn-lg" href={driverUrl}>
                                Continue as driver
                            </Button>
                        </div>
                        <div className="mt-3 text-center">
                            <Button className="btn-lg" href={navigatorUrl}>
                                Become Navigator
                            </Button>
                        </div>
                    </Col>
                </Row>
                <Row className="justify-content-md-center fixed-bottom" style={{padding: 30}}>
                    <Col>
                        <Link className="btn btn-primary btn-lg btn-block" to="/">
                            Back to Top
                        </Link>
                    </Col>
                </Row>
            </div>
        );
    }
}
