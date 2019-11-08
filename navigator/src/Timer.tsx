import React from "react";
import {SessionMode, NavigatorState} from "./types";

interface IProps {
    startTimeInMinutes: number;
    begin: number;
    mode: SessionMode;
    state: NavigatorState;
}

interface IState {
    timeRemainingInSeconds: number;
    timeRemainingInMinutes: number;
}

export default class TimerCountdown extends React.Component<IProps, IState> {
    private timer: any;

    public constructor(props: IProps) {
        super(props);
        this.state = {
            timeRemainingInMinutes: props.startTimeInMinutes,
            timeRemainingInSeconds: 0,
        };
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
        }
    }

    public componentDidMount() {
        this.timer = setInterval(() => {
            this.startTimerCountdownHandler();
        }, 1000);
    }

    componentWillReceiveProps(nextProps: Readonly<IProps>, nextContext: any): void {
        if (nextProps.begin !== this.props.begin &&
            nextProps.mode === SessionMode.Strict &&
            nextProps.state !== NavigatorState.Disconnected) {
            this.setState({
                timeRemainingInMinutes: Math.floor((nextProps.startTimeInMinutes * 60 - (Math.floor(Date.now() / 1000) - nextProps.begin)) / 60),
                timeRemainingInSeconds: Math.floor((nextProps.startTimeInMinutes * 60 - (Math.floor(Date.now() / 1000) - nextProps.begin)) % 60)
            });
            clearInterval(this.timer!);
            this.timer = setInterval(() => {
                this.startTimerCountdownHandler();
            }, 1000);
        }
    }

    render() {
        let text: React.ReactNode;
        switch (this.props.state) {
            case NavigatorState.Disconnected:
                text = "Disconnected";
                break;
            case NavigatorState.WaitingDriver:
            case NavigatorState.Connected:
                if (this.props.mode === SessionMode.Strict) {
                    text = `${this.state.timeRemainingInMinutes} : ${this.state.timeRemainingInSeconds}`;
                } else {
                    text = "FREE MODE";
                }
                break;
        }
        return (
            <label className="col-2 timer-countdown m-auto">
                {text}
            </label>
        );
    }
}

