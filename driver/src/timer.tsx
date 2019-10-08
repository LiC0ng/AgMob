import React from "react";
import { Button } from "react-bootstrap";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
const STATE_FREE_MODE = "FREE";
const STATE_STRICT_MODE = "STRICT";

interface IState {
    inputValue: number;
    mode: any;
}

export default class TimerCountdown extends React.Component<any, IState> {

    public constructor(props: any) {
        super(props);
        this.state = {
            inputValue: 10,
            mode: STATE_FREE_MODE,
        };
        this.clickSetHandle = this.clickSetHandle.bind(this);
    }

    public handleGetInputValue = (e: any) => {
        const value = parseInt(e.target.value.replace(/[^0-9]/g, ""));

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
            }),
        });
        const obj = await ret.json();
        console.log("POST /api/session =>");
        console.log(obj);
        this.props.history.push({
            pathname: "/start_page",
            state: {
                startTimeInMinutes: this.state.inputValue,
                sessionId: obj.id,
            },
        });
    }

    public render() {
        return (
            <div style={{ margin: 15 }}>
                <div className="select-mode">
                    <h3>Select mode</h3>
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
                </div>

                <div className="timer-countdown" style={{ marginTop: 30 }}>
                    <h3>Input your desired time</h3>
                    <input
                        type="number"
                        value={this.state.inputValue}
                        disabled={this.state.mode === STATE_FREE_MODE}
                        onChange={this.handleGetInputValue.bind(this)}
                    />
                    <Button onClick={ this.clickSetHandle }>Set</Button>
                </div>
            </div>
        );
    }
}

