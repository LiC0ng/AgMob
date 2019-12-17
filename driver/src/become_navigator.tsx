import React from "react";
import {Button} from "react-bootstrap";
import {Link} from "react-router-dom";
import * as Config from "./config";

interface IState {
    inputSessionId: string;
    error: boolean;
}

export default class BeNavigator extends React.Component<any, IState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            error: false,
            inputSessionId: "",
        };
    }

    public render() {
        return (
            <form onSubmit={this.handleSubmit} className="container h-100 d-flex flex-column">
                <div className="flex-grow-1">
                    <h2 className="mb-3">
                        Join an existing workspace
                        <h4 className="d-inline text-muted ml-1">as a navigator</h4>
                    </h2>
                    <label htmlFor="sesseionIdInput">
                        You can join the workspace as a navigator by filling in
                        the <strong>session ID</strong> in the next input form.
                    </label>
                    <input className={"form-control" + (this.state.error ? " is-invalid" : "")}
                           type="text" autoFocus={true} id="sessionIdInput"
                           value={this.state.inputSessionId}
                           onChange={this.handleInputSessionIdChange}/>
                    {this.state.error &&
                    <div className="invalid-feedback">
                        Session ID is not valid
                    </div>}
                </div>
                <div className="d-flex my-4">
                    <Link className="btn btn-primary btn-lg mr-4" to="/">Back</Link>
                    <Button className="btn-lg mr-4" type="submit" href="#">Join</Button>
                </div>
            </form>
        );
    }

    private handleInputSessionIdChange = (e: any) =>
        this.setState({inputSessionId: e.target.value, error: false});

    private handleSubmit = (e: any) => {
        e.preventDefault();
        if (this.state.inputSessionId === "")
            return;
        window.location.href = Config.WORKSPACE_BASE_ADDRESS + "/session/" +
            this.state.inputSessionId;
    };
}
