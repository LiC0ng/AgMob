import React from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import {log} from "util";

// import "./Top.css";


export default class Top extends React.Component {


    public componentDidMount() {
        log("start top");
    }


    public render() {

        return (
            <div>
                <Row className={"justify-content-md-center"}>
                    <Col md={"auto"}>
                        <h1>AgMob</h1>
                    </Col>
                </Row>
                <Row className={"justify-content-md-center"}>
                    <Col md={12}>
                        <Button className={"btn-lg btn-block"} href={"/new_workspace"}>{"New Workspace"}</Button>
                        <Button className={"btn-lg btn-block"} href={"/join_workspace"}>{"Join Workspace"}</Button>
                    </Col>
                </Row>
                <Row className={"justify-content-md-center"}>
                    <Col md={12}>
                    </Col>
                </Row>
            </div>
        );
    }


}


