import React from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import {Link} from "react-router-dom";
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
                        <Link className={"btn btn-primary btn-lg btn-block"} to={"/new_workspace"}>{"New Workspace"}</Link>
                        <Link className={"btn btn-primary btn-lg btn-block"} to={"/join_workspace"}>{"Join Workspace"}</Link>
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
                        <Link className={"btn btn-primary btn-lg btn-block"} to={"/end"}>{"end page"}</Link>

                    </Col>
                </Row>
            </div>
        );
    }


}


