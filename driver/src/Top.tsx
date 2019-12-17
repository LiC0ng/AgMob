import React from "react";
import {Link} from "react-router-dom";
import {Col, Row} from "react-bootstrap";
import {PropsWithSession} from "./types";

interface Props extends PropsWithSession { }

interface State { }

export default class Top extends React.Component<Props, State> {
    public render() {
        return (
            <div>
                <div className="text-center mb-4">
                    <img src="logo.svg" width="120" />
                    <h1>AgMob</h1>
                </div>
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

                <Row className={"justify-content-md-end fixed-bottom"} style={{ paddingRight: 20 }}>
                    <Col md={"auto"}>
                        <p>version {require("../package.json").version}</p>
                    </Col>
                </Row>
            </div>
        );
    }
}
