import React from "react";
import {Button, Form, FormControl, InputGroup} from "react-bootstrap";
import {NavigatorState} from "./types";

interface IProps {
    ws: WebSocket;
    state: NavigatorState;
    color: string
}

interface IState {
    name: string;
    message: string;
}

export default class Chat extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props);
        this.state = {
            name: "",
            message: "",
        };
        this.clickSendHandle = this.clickSendHandle.bind(this);
        this.pressSendHandle = this.pressSendHandle.bind(this);
    }

    public handleNameChange = (e: any) => {
        this.setState({
            name: e.target.value,
        })
    };

    public handleMessageChange = (e: any) => {
        this.setState({
            message: e.target.value,
        })
    };

    public clickSendHandle() {
        if (this.state.message === "") {
            return
        }
        const date = new Date();
        let sendObject = {
            "kind": "chat",
            "payload": `{"name":"${this.state.name}","message":"${this.state.message}","date":"${date.toString()}","color":"${this.props.color}"}`
        };
        this.props.ws.send(JSON.stringify(sendObject));
        this.setState({
            message: "",
        })
    };

    public pressSendHandle(e: any) {
        if (this.props.state === NavigatorState.Disconnected)
            return;
        if (e.charCode === 13 && e.ctrlKey) {
            this.clickSendHandle();
        }
    }

    public render() {
        return (
            <Form className="chat col row m-0">
                <FormControl
                    className="col-3"
                    required
                    type="text"
                    placeholder="Input Name Here"
                    value={this.state.name}
                    onChange={this.handleNameChange}
                />
                <InputGroup className="col">
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
                            Send Message
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form>
        );
    }
}

