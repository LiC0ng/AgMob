import React from "react";
import {Button} from "react-bootstrap";

interface IProps {
    startTimeInMinutes: number;
    history: any;
}

interface IState {
    timeRemainingInSeconds: number;
    timeRemainingInMinutes: number;
}

export default class StartShare extends React.Component<IProps, IState> {

    private timer: any;

    public constructor(props: IProps) {
        super(props);
        this.state = {
            timeRemainingInMinutes: this.props.history.location.state.startTimeInMinutes,
            timeRemainingInSeconds: 0,
        };
        this.clickStartHandle = this.clickStartHandle.bind(this);
    }

    public clickStartHandle() {
        this.timer = setInterval( () => {
            this.startTimerCountdownHandler();
        }, 1000);
    }

    public startTimerCountdownHandler() {
        if (this.state.timeRemainingInSeconds > 0) {
            this.setState({
                timeRemainingInSeconds: this.state.timeRemainingInSeconds - 1,
            });
        } else if (this.state.timeRemainingInMinutes > 0 && this.state.timeRemainingInSeconds <= 0) {
            this.setState({
                timeRemainingInMinutes: this.state.timeRemainingInMinutes - 1,
                timeRemainingInSeconds: 59,
            });
        } else {
            clearInterval(this.timer!);
            this.props.history.push({pathname: "/end", state: {sessionId: "sessionId-hoge-fuga"}});
        }
    }

    public render() {
        return (
            <div className="start">
                <Button onClick={ this.clickStartHandle }>Start</Button>
                <h1>
                    {this.state.timeRemainingInMinutes} : {this.state.timeRemainingInSeconds}
                </h1>
            </div>
        );
    }
}
