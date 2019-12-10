import React from "react";
import {Button, Form, FormControl, InputGroup} from "react-bootstrap";
import {NavigatorState} from "./types";

interface IProps {
    ws: WebSocket;
    state: NavigatorState;
    name?: string;
    color: string;
}

interface IState {
    message: string;
}

export default class Chat extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props);
        this.state = {
            message: "",
        };
        this.clickSendHandle = this.clickSendHandle.bind(this);
        this.pressSendHandle = this.pressSendHandle.bind(this);
    }

    public handleMessageChange = (e: any) => {
        this.setState({
            message: e.target.value,
        })
    };

    public clickSendHandle() {
        if (this.state.message === "") {
            return
        }
        const name = this.props.name || "";
        const date = new Date();
        const payload = JSON.stringify({
            name: name,
            message: this.state.message,
            date:  new Date().toString(),
            coloe: this.props.color,
        });
        const sendObject = {
            "kind": "chat",
            "payload": payload
        };
        this.props.ws.send(JSON.stringify(sendObject));
        this.setState({
            message: "",
        })
    };

    preventSubmit = (e: any) => e.preventDefault();

    public pressSendHandle(e: any) {
        if (this.props.state === NavigatorState.Disconnected)
            return;
        if (e.charCode === 13 && e.ctrlKey) {
            this.clickSendHandle();
        }
    }

    public render() {
        return (
            <Form className="chat col row m-0 p-0" onSubmit={this.preventSubmit}>
                <InputGroup className="col p-0">
                    <FormControl
                        placeholder="Input Message Here"
                        aria-label="Input Message Here"
                        aria-describedby="message"
                        value={this.state.message}
                        onKeyPress={this.pressSendHandle}
                        onChange={this.handleMessageChange}
                    />
                    <InputGroup.Append>
                        <Button variant="primary"
                            disabled={this.props.state === NavigatorState.Disconnected}
                            onClick={this.clickSendHandle}>
                            &gt;
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form>
        );
    }
}

