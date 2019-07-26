import React from "react";
import { Button } from "react-bootstrap";

interface IState {
    inputValue: number;
}

export default class TimerCountdown extends React.Component<any, IState> {

    public constructor(props: any) {
        super(props);
        this.state = {
            inputValue: 0,
        };
        this.clickSetHandle = this.clickSetHandle.bind(this);
    }

    public handleGetInputValue = (e: any) => {
        this.setState({
            inputValue: e.target.value,
        });
    }

    public clickSetHandle() {
        this.props.history.push({pathname: "/start_page", state: {startTimeInMinutes: this.state.inputValue}});
    }
    public render() {
        return (
            <div className="timer-countdown">
                <h3>Input your desired time</h3>
                <input
                    type="number"
                    min="0"
                    onChange={this.handleGetInputValue.bind(this)}
                />
                <Button onClick={ this.clickSetHandle }>Set</Button>
            </div>
        );
    }
}


