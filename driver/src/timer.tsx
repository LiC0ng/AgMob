import React from "react";

interface IProps {
    startTimeInSeconds: number;
    startTimeInMinutes: number;
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
            timeRemainingInSeconds: props.startTimeInSeconds
        };
    }

    public startTimerCountdownHandler() {
        if(this.state.timeRemainingInSeconds > 0) {
            this.setState({
                timeRemainingInSeconds: this.state.timeRemainingInSeconds - 1
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

    public componentDidMount()  {
        this.timer = setInterval(() => {
            this.startTimerCountdownHandler();
        }, 1000);
    }


    public render() {
        return (
            <div className="timer-countdown">
                {this.state.timeRemainingInMinutes} : {this.state.timeRemainingInSeconds}
            </div>
        );
    }
}

class TimerInput extends React.Component {
    render() {
        return (
            <div>
                <h3>Input your desired time</h3>
                <input type="number" required />
            </div>
        );
    }
}

class Timer extends React.Component {
    render() {
        return (
            <div>
                <h1> </h1>
            </div>
        );
    }
}

class StartButton extends React.Component {
    render() {
        return(
            <div>
                <button>Start</button>
            </div>
        );
    }
}
