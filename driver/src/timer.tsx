import React from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import {FormControl} from "react-bootstrap/es";
import InputGroup from "react-bootstrap/InputGroup";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import {Link} from "react-router-dom";
import {SessionMode} from "./types";
import * as Config from "./config";
import {PropsWithSession, DriverSession} from "./types";

interface IProps extends PropsWithSession {
    history: any;
}

interface IState {
    inputValue: number;
    mode: SessionMode;
}

export default class TimerCountdown extends React.Component<IProps, IState> {

    public constructor(props: any) {
        super(props);
        this.state = {
            inputValue: 10,
            mode: SessionMode.Strict,
        };
        this.clickSetHandle = this.clickSetHandle.bind(this);
    }

    public handleGetInputValue = (e: any) => {
        if (!e.target.value) {
            return;
        }
        const input = parseInt(e.target.value.replace(/[^0-9-]/g, ""));
        const value = (input >= 0) ? input : 0;

        this.setState({
            inputValue: value,
        });
    };

    public handleIncrementValue = () => {
        const value = this.state.inputValue + 1;
        this.setState({
            inputValue: value,
        });
    };

    public handleDecrementValue = () => {
        const value = this.state.inputValue > 0 ? this.state.inputValue - 1 : 0;
        this.setState({
            inputValue: value,
        });
    };

    public handleChangeMode = (e: any) => {
        this.setState({
            mode: e.target.value as SessionMode, // XXX
        });
    };

    public async clickSetHandle() {
        const sess = await DriverSession.create(this.state.mode, this.state.inputValue);
        this.props.onUpdateSession(sess);
        this.props.history.push({pathname: "/start_page"});
    }

    public render() {
        // @ts-ignore
        return (
            <div>
                <h2>Create a new workspace</h2>
                <form className="mt-3">
                    <h4>Mob Programming Style</h4>
                    <label>Please select mode how you want to develop software through mob programming.</label>
                    <label style={{display: "block"}} className={"alert " + (this.state.mode === SessionMode.Strict ? "alert-primary" : "alert-secondary")}>
                        <div className="custom-control custom-radio">
                            <input type="radio" className="custom-control-input"
                                id="strict-mode" name="mode" checked={this.state.mode === SessionMode.Strict}
                                value={SessionMode.Strict} onChange={this.handleChangeMode.bind(this)} />
                            <label className="custom-control-label" htmlFor="strict-mode">Strict Mode
                                <p>
                                    A driver session is interrupted automatically when
                                    the timer expires.
                                </p>
                                <h5>Driver Session Interval</h5>
                                <InputGroup>
                                    <InputGroup.Prepend>
                                        <Button variant="primary" onClick={this.handleDecrementValue}
                                                disabled={this.state.mode !== SessionMode.Strict}>-</Button>
                                    </InputGroup.Prepend>
                                    <input
                                        type={"number"}
                                        value={this.state.inputValue.toString()}
                                        style={{textAlign: "end"}}
                                        disabled={this.state.mode !== SessionMode.Strict}
                                        onChange={this.handleGetInputValue.bind(this)}/>
                                    <InputGroup.Append>
                                        <Button variant="primary" onClick={this.handleIncrementValue}
                                                disabled={this.state.mode !== SessionMode.Strict}>+</Button>
                                    </InputGroup.Append>
                                </InputGroup>
                            </label>
                        </div>
                    </label>
                    <label style={{display: "block"}} className={"alert " + (this.state.mode === SessionMode.Free ? "alert-primary" : "alert-secondary")}>
                        <div className="custom-control custom-radio">
                            <input type="radio" className="custom-control-input"
                                id="free-mode" name="mode" checked={this.state.mode === SessionMode.Free}
                                value={SessionMode.Free} onChange={this.handleChangeMode.bind(this)} />
                            <label className="custom-control-label" htmlFor="free-mode">Free Mode
                                <p>
                                    The mode has no limit time and you can switch roles freely.
                                    Measure time in some other way!
                                </p>
                            </label>
                        </div>
                    </label>
                </form>

                <Row className="justify-content-md-center fixed-bottom">
                    <Col xs={"auto"} style={{padding: 30}}>
                        <Link className="btn btn-primary btn-lg" to="/">Back</Link>
                    </Col>
                    <Col xs={"auto"} style={{padding: 30}}>
                        <Button className="btn btn-primary btn-lg" onClick={this.clickSetHandle}>Create</Button>
                    </Col>
                </Row>
            </div>
        );
    }
}

