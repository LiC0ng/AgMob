import React from "react";
import {Link} from "react-router-dom";
import {Col, Row} from "react-bootstrap";
import {PropsWithSession} from "./types";

interface Props extends PropsWithSession { }

interface State { }

export default class End extends React.Component<Props, State> {

    public constructor(props: Props) {
        super(props);
    }

    private handleFocus = (event: any) => event.target.select();

    public render() {
        const token = this.props.currentSession!.sessionId;
        const driverUrl = `agmob-driver:${token}`;
        return (
            <div>
                <Row className="justify-content-md-center">
                    <Col>
                        <h1 className="text-center">お疲れ様でした</h1>
                        <div className="mt-3">
                            <input className="form-control"
                                readOnly={true}
                                value={driverUrl}
                                onFocus={this.handleFocus} />
                        </div>
                    </Col>
                </Row>
                <Row className="justify-content-md-center mt-5">
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
