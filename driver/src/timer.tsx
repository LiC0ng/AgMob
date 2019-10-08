import React from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import {FormControl} from "react-bootstrap/es";
import InputGroup from "react-bootstrap/InputGroup";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import {Link} from "react-router-dom";
import {PropsWithSession} from "./types";

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
const STATE_FREE_MODE = "FREE";
const STATE_STRICT_MODE = "STRICT";

interface IProps extends PropsWithSession {
    history: any;
}

interface IState {
    inputValue: number;
    mode: any;
}

export default class TimerCountdown extends React.Component<IProps, IState> {

    public constructor(props: any) {
        super(props);
        this.state = {
            inputValue: 10,
            mode: STATE_FREE_MODE,
        };
        this.clickSetHandle = this.clickSetHandle.bind(this);
    }

    public handleGetInputValue = (e: any) => {
        if (!e.target.value) return;
        const input = parseInt(e.target.value.replace(/[^0-9-]/g, ""));
        const value = (input >= 0) ? input : 0;

        this.setState({
            inputValue: value,
        });
    }

    public handleChangeMode = (e: any) => {
        this.setState({
            mode: e.toString(),
        });
    }

    public async clickSetHandle() {
        const ret = await fetch(`${WORKSPACE_BASE_ADDRESS}/api/session`, {
            method: "POST",
            body: JSON.stringify({
                interval: this.state.inputValue,
                begin: Math.floor(Date.now() / 1000),
                // mode: this.state.mode,
            }),
        });
        const obj = await ret.json();
        console.log("POST /api/session =>");
        console.log(obj);
        this.props.onUpdateSession({
            sessionId: obj.id,
            startTimeInMinutes: this.state.inputValue,
        });

        this.props.history.push({pathname: "/start_page"});
    }

    public render() {
        // @ts-ignore
        return (
            <div style={{ margin: 15 }}>
                <div className="select-mode">
                    <h3>Select mode</h3>
                    <label>Please select mode how you want to develop software through mob programming.</label>

                    <ButtonToolbar>
                        <ToggleButtonGroup
                            name="mode"
                            type="radio"
                            value={this.state.mode}
                            onChange={this.handleChangeMode.bind(this)}>
                            <ToggleButton value={STATE_FREE_MODE}>Free mob mode</ToggleButton>
                            <ToggleButton value={STATE_STRICT_MODE}>Strict mob mode</ToggleButton>
                        </ToggleButtonGroup>
                    </ButtonToolbar>

                    <details style={{ marginTop: 5 }}>
                        <summary>Details</summary>
                        <dl>
                            <dt>Free mob mode</dt>
                            <dd>The mode has no limit time and you can switch roles freely.</dd>
                            <dt>Strict mob mode</dt>
                            <dd>The mode has limit time and drivers are replaced in order.</dd>
                        </dl>
                    </details>
                </div>

                <div className="timer-countdown" style={{ marginTop: 30 }}>
                    <h3>Input your desired time</h3>
                    <InputGroup>
                        <FormControl
                            placeholder="tims[m]"
                            type="number"
                            value={this.state.inputValue.toString()}
                            disabled={this.state.mode === STATE_FREE_MODE}
                            onChange={this.handleGetInputValue.bind(this)}/>
                        <InputGroup.Append>
                            <Button variant="primary" onClick={ this.clickSetHandle } >Start</Button>
                        </InputGroup.Append>
                    </InputGroup>
                </div>

                <Row className="justify-content-md-center fixed-bottom">
                    <Col xs={"auto"} style={{ padding: 30 }}>
                        <Link className="btn btn-primary btn-lg" to="/">Back</Link>
                    </Col>
                </Row>
            </div>
        );
    }
}

