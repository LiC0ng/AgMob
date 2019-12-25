import React from "react";
import { Link } from "react-router-dom";
import {Button} from "react-bootstrap";
import {DriverSession} from "./types";

interface State {
    inputSessionId: string;
    error: boolean;
}

export default class Join extends React.Component<any, State> {
    public constructor(props: any) {
        super(props);

        this.state = {
            inputSessionId: "",
            error: false,
        };
    }

    componentDidMount() {
        const match = this.props.match;
        const id = match && match.params.id;
        if (id)
            this.setState({ inputSessionId: id }, () => this.handleStart(null));
    }

    private handleInputSessionIdChange = (e: any) =>
        this.setState({ inputSessionId: e.target.value, error: false });

    private handleStart = async (e: any) => {
        if (e !== null)
            e.preventDefault();

        const sess = await DriverSession.join(this.state.inputSessionId);
        if (sess === null) {
            this.setState({ error: true });
        } else {
            this.props.onUpdateSession(sess);
            this.props.history.push({pathname: "/start_page"});
        }
    }

    public render() {
        return (
            <form onSubmit={this.handleStart} className="container h-100 d-flex flex-column">
                <div className="flex-grow-1">
                    <h2 className="mb-3">
                        Join an existing workspace
                    </h2>
                    <label htmlFor="sesseionIdInput">
                        You can join the workspace as a driver by filling in
                        the <strong>session ID</strong> in the next input form.
                    </label>
                    <input className={"form-control" + (this.state.error ? " is-invalid" : "")}
                        type="text" autoFocus={true} id="sesseionIdInput"
                        value={this.state.inputSessionId}
                        onChange={this.handleInputSessionIdChange} />
                    {this.state.error &&
                    <div className="invalid-feedback">
                        Session ID is not valid
                    </div>}
                </div>
                <div className="d-flex my-4">
                    <Link className="btn btn-primary btn-lg mr-4" to="/">Back</Link>
                    <Button className="btn-lg mr-4" type="submit" href="#" onClick={this.handleStart}>Join</Button>
                </div>
            </form>
        );
    }
}



