import React from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import {Link} from "react-router-dom";
import * as Config from "./config";


interface IState {
    inputSessionId: string;
    error: boolean;
}

export default class BeNavigator extends React.Component<any, IState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            error: false,
            inputSessionId: "",
        };
    }

    public render() {
        return (
            <Container>
                <Row className="justify-content-md-center">
                    <Col md="auto">
                        <h2>Become Navigator</h2>
                    </Col>
                </Row>
                <Row className="justify-content-md-center">
                    <Col md={"auto"}>
                        <label htmlFor="sesseionIdInput">You can join the workspace as a navigator by filling in
                            the <strong>session ID</strong> in the next input form.</label>
                    </Col>
                    <div className="col-auto input-group">
                        <input className={"form-control" + (this.state.error ? " is-invalid" : "")}
                               type="text" autoFocus={true} id="sessionIdInput"
                               value={this.state.inputSessionId}
                               onChange={this.handleInputSessionIdChange}/>
                        {this.state.error &&
                        <div className="invalid-feedback">
                            Session ID is not valid
                        </div>}
                    </div>
                </Row>
                <Row className="justify-content-md-center fixed-bottom">
                    <Col xs={"auto"} style={{padding: 30}}>
                        <Link className="btn btn-primary btn-lg" to="/">Back</Link>
                    </Col>
                    <Col xs={"auto"} style={{padding: 30}}>
                        <Button className="btn-lg"
                                href={Config.WORKSPACE_BASE_ADDRESS + "/session/" + this.state.inputSessionId}>
                            Join
                        </Button>
                    </Col>
                </Row>
            </Container>
        );
    }

    private handleInputSessionIdChange = (e: any) =>
        this.setState({inputSessionId: e.target.value, error: false});
}
