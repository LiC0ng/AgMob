import React from "react";
import { Button } from "react-bootstrap";

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";

interface IState {
    inputValue: number;
}

export default class TimerCountdown extends React.Component<any, IState> {

    public constructor(props: any) {
        super(props);
        this.state = {
            inputValue: 10,
        };
        this.clickSetHandle = this.clickSetHandle.bind(this);
    }

    public handleGetInputValue = (e: any) => {
        const value = parseInt(e.target.value.replace(/[^0-9]/g, ""));

        this.setState({
            inputValue: value,
        });
    }

    public async clickSetHandle() {
        const ret = await fetch(`${WORKSPACE_BASE_ADDRESS}/api/session`, {
            method: "POST",
            body: JSON.stringify({
                interval: this.state.inputValue,
                begin: Date.now() / 1000,
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
            <div className="timer-countdown">
                <h3>Input your desired time</h3>
                <input
                    type="number"
                    value={this.state.inputValue}
                    onChange={this.handleGetInputValue.bind(this)}
                />
                <Button onClick={ this.clickSetHandle }>Set</Button>
            </div>
        );
    }
}
