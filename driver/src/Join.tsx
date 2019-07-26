import React from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import {log} from "util";

export default class Join extends React.Component {

    public componentDidMount() {
        log("start join page");
    }

    public render() {
        return (
            <Container>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <h1>Enter existed Workspace</h1>
                    </Col>
                </Row>
                <Row className="justify-content-md-center">
                    <Col md={"auto"}>
                        <label htmlFor="sesseionIdInput">You can join the workspace as a driver by filling in the <strong>session ID</strong> in the next input form.</label>
                    </Col>
                    <Col md={"auto"}>
                        <input id="sesseionIdInput"/>
                    </Col>
                </Row>
                <Row className="justify-content-md-center">
                    <Col md={"auto"} style={{ margin: 30 }}>
                        <Button className="btn-lg" href="/">Back</Button>
                    </Col>
                    <Col md={"auto"} style={{ margin: 30 }}>
                        <Button className="btn-lg" href="#">Start</Button>
                    </Col>
                </Row>
            </Container>
        );
    }
}


