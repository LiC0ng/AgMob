import React from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import {Link} from "react-router-dom";
import {log} from "util";

// import "./End.css";

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";


// tslint:disable-next-line:interface-name
interface Props {
    sessionId?: string;
}

// tslint:disable-next-line:interface-name
interface State {
    navigatorUrl?: string;
}



export default class End extends React.Component<Props, State> {

    public constructor(props: Props) {
        super(props);

        this.state = {
            navigatorUrl: `${WORKSPACE_BASE_ADDRESS}/session/${props.sessionId}`,
        };
    }

    public componentDidMount() {
        log("start top");
    }


    public render() {

        return (
            <div>
                <Row className={"justify-content-md-center"}>
                    <Col md={"auto"}>
                        <h1>お疲れ様でした</h1>
                        <h2>{this.state.navigatorUrl}</h2>
                    </Col>
                </Row>
                <Row className={"justify-content-md-center"}>
                    <Col md={12}>
                        <Link className={"btn btn-primary btn-lg btn-block"} to={"/"}>{"Back to Top"}</Link>
                    </Col>
                </Row>
                <Row className={"justify-content-md-center"}>
                    <Col md={"auto"}>
                        <h1>Debug</h1>
                    </Col>
                </Row>
                <Row className={"justify-content-md-center"}>
                    <Col md={12}>
                        <Link className={"btn btn-primary btn-lg btn-block"} to={"/agmob"}>{"timerpage"}</Link>
                    </Col>
                </Row>
            </div>
        );
    }


}


