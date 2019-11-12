import React from "react";
import { Link } from "react-router-dom";
import {Button, Col, Container, Row} from "react-bootstrap";
import {DriverSession} from "./types";
import * as Config from "./config";

interface State {
    inputSessionId: string;
    error: boolean;
}

export default class Join extends React.Component<any, State> {
    public constructor(props: any) {
        super(props);

        this.state = {
            inputSessionId: "",
            error: false,
        };
    }

    componentDidMount() {
        const match = this.props.match;
        const id = match && match.params.id;
        if (id)
            this.setState({ inputSessionId: id }, () => this.handleStart(null));
    }

    private handleInputSessionIdChange = (e: any) =>
        this.setState({ inputSessionId: e.target.value, error: false });

    private handleStart = async (e: any) => {
        if (e !== null)
            e.preventDefault();

        const sess = await DriverSession.join(this.state.inputSessionId);
        if (sess === null) {
            this.setState({ error: true });
        } else {
            this.props.onUpdateSession(sess);
            this.props.history.push({pathname: "/start_page"});
        }
    }

    public render() {
        return (
            <Container>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <h2>Join an existing workspace</h2>
                    </Col>
                </Row>
                <Row className="justify-content-md-center">
                    <Col md={"auto"}>
                        <label htmlFor="sesseionIdInput">You can join the workspace as a driver by filling in the <strong>session ID</strong> in the next input form.</label>
                    </Col>
                    <div className="col-auto input-group">
                        <input className={"form-control" + (this.state.error ? " is-invalid" : "")}
                            type="text" autoFocus={true} id="sesseionIdInput"
                            value={this.state.inputSessionId}
                            onChange={this.handleInputSessionIdChange} />
                        {this.state.error &&
                        <div className="invalid-feedback">
                            Session ID is not valid
                        </div>}
                    </div>
                </Row>
                <Row className="justify-content-md-center fixed-bottom">
                    <Col xs={"auto"} style={{ padding: 30 }}>
                        <Link className="btn btn-primary btn-lg" to="/">Back</Link>
                    </Col>
                    <Col xs={"auto"} style={{ padding: 30 }}>
                        <Button className="btn-lg" href="#" onClick={this.handleStart}>Join</Button>
                    </Col>
                </Row>
            </Container>
        );
    }
}



