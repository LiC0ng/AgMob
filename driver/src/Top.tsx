import React from "react";
import {Link} from "react-router-dom";
import {Button, Col, Container, Row} from "react-bootstrap";
import {PropsWithSession} from "./types";

interface Props extends PropsWithSession { }

interface State { }

export default class Top extends React.Component<Props, State> {
    public render() {
        return (
            <div>
                <Row className={"justify-content-md-center"}>
                    <Col md={"auto"}>
                        <h1>AgMob</h1>
                    </Col>
                </Row>
                <Row className={"justify-content-md-center"}>
                    <Col xs={12}>
                        <Link className="btn btn-primary btn-lg btn-block" to="/new_workspace">
                            Create a new workspace
                        </Link>
                        <Link className="btn btn-primary btn-lg btn-block" to="/join_workspace">
                            Sign in to your workspace
                        </Link>
                        <Link className="btn btn-primary btn-lg btn-block" to="/become_navigator">
                            Become navigator
                        </Link>
                    </Col>
                </Row>

                <Row className={"justify-content-md-end fixed-bottom"} style={{ paddingBottom: 40, paddingRight: 15 }}>
                    <Col md={2}>
                        <Link className={"btn btn-outline-primary btn-lg btn-block"} to={"/end"} style={{ fontSize: 15 }}>{"Debug"}</Link>
                    </Col>
                </Row>

                <Row className={"justify-content-md-end fixed-bottom"} style={{ paddingRight: 20 }}>
                    <Col md={"auto"}>
                        <p>version {require("../package.json").version}</p>
                    </Col>
                </Row>
            </div>
        );
    }
}


