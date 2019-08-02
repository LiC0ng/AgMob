import React from "react";
import { Link } from "react-router-dom";
import {Button, Col, Container, Row} from "react-bootstrap";
import {log} from "util";

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";

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

    private handleInputSessionIdChange = (e: any) =>
        this.setState({ inputSessionId: e.target.value, error: false });

    private handleStart = async (e: any) => {
        e.preventDefault();

        const resId = `${WORKSPACE_BASE_ADDRESS}/api/session/${this.state.inputSessionId}`;
        // TODO: This doesn't look pretty. Can this GET request be removed?
        const retGet = await fetch(resId);
        if (retGet.status != 200) {
            console.log("GET /api/session/{id} => " + retGet.text());
            this.setState({ error: true });
            return;
        }
        const currentSession = await retGet.json();

        // Now replace 'begin' with current time and update config
        const ret = await fetch(resId, {
            method: "PUT",
            body: JSON.stringify({
                ...currentSession.config,
                begin: Math.floor(Date.now() / 1000),
            }),
        });
        if (ret.status != 200) {
            console.log("PUT /api/session/{id} => " + ret.text());
            this.setState({ error: true });
            return;
        }
        const obj = await ret.json();
        console.log("PUT /api/session =>");
        console.log(obj);
        this.props.history.push({
            pathname: "/start_page",
            state: {
                startTimeInMinutes: currentSession.config.interval,
                sessionId: obj.id,
            },
        });
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
                <Row className="justify-content-md-center">
                    <Col xs={"auto"} style={{ padding: 30 }}>
                        <Link className="btn btn-primary btn-lg" to="/">Back</Link>
                    </Col>
                    <Col xs={"auto"} style={{ padding: 30 }}>
                        <Button className="btn-lg" href="#" onClick={this.handleStart}>Start</Button>
                    </Col>
                </Row>
            </Container>
        );
    }
}



