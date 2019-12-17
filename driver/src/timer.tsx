import React from "react";
import {Button} from "react-bootstrap";
import InputGroup from "react-bootstrap/InputGroup";
import {Link} from "react-router-dom";
import {SessionMode} from "./types";
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

    public async clickSetHandle(e: any) {
        e.preventDefault();
        const sess = await DriverSession.create(this.state.mode, this.state.inputValue);
        this.props.onUpdateSession(sess);
        this.props.history.push({pathname: "/start_page"});
    }

    public render() {
        // @ts-ignore
        return (
            <form className="container h-100 d-flex flex-column" onSubmit={this.clickSetHandle}>
                <div className="flex-grow-1">
                    <h2 className="mb-3">Create a new workspace</h2>
                    <h4>Mob programming style</h4>
                    <label>Please select mode how you want to develop software through mob programming.</label>
                    <label style={{display: "block"}} className={"alert " + (this.state.mode === SessionMode.Strict ? "alert-primary" : "alert-secondary")}>
                        <div className="custom-control custom-radio">
                            <input type="radio" className="custom-control-input"
                                id="strict-mode" name="mode" checked={this.state.mode === SessionMode.Strict}
                                value={SessionMode.Strict} onChange={this.handleChangeMode.bind(this)} />
                            <label className="custom-control-label d-block" htmlFor="strict-mode">Strict mode
                                <p>
                                    A driver session is interrupted automatically when
                                    the timer expires.
                                </p>
                                <div className="form-group row align-items-baseline">
                                    <label className="col-auto m-0" htmlFor="sessionInterval">Driver session interval:</label>
                                    <InputGroup className="col">
                                        <InputGroup.Prepend>
                                            <Button variant="primary" onClick={this.handleDecrementValue}
                                                    disabled={this.state.mode !== SessionMode.Strict}>-</Button>
                                        </InputGroup.Prepend>
                                        <input
                                            type="number"
                                            name="sessionInterval"
                                            value={this.state.inputValue.toString()}
                                            style={{textAlign: "end"}}
                                            disabled={this.state.mode !== SessionMode.Strict}
                                            onChange={this.handleGetInputValue.bind(this)}/>
                                        <InputGroup.Append>
                                            <Button variant="primary" onClick={this.handleIncrementValue}
                                                    disabled={this.state.mode !== SessionMode.Strict}>+</Button>
                                        </InputGroup.Append>
                                    </InputGroup>
                                </div>
                            </label>
                        </div>
                    </label>
                    <label style={{display: "block"}} className={"alert " + (this.state.mode === SessionMode.Free ? "alert-primary" : "alert-secondary")}>
                        <div className="custom-control custom-radio">
                            <input type="radio" className="custom-control-input"
                                id="free-mode" name="mode" checked={this.state.mode === SessionMode.Free}
                                value={SessionMode.Free} onChange={this.handleChangeMode.bind(this)} />
                            <label className="custom-control-label d-block" htmlFor="free-mode">Free mode
                                <p>
                                    The mode has no limit time and you can switch roles freely.
                                    Measure time in some other way!
                                </p>
                            </label>
                        </div>
                    </label>
                </div>
                <div className="d-flex my-4">
                    <Link className="btn btn-primary btn-lg mr-4" to="/">Back</Link>
                    <Button type="submit" className="btn btn-primary btn-lg mr-4">Create</Button>
                </div>
            </form>
        );
    }
}

