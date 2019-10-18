import React from "react";
import {Button, Col, Form, FormControl, InputGroup, Row} from "react-bootstrap";
import * as Config from "./config";

interface IState {
    name: string;
    message: string;
    history: string;
}

interface IProps {
    sessionId: string;
}

export default class Chat extends React.Component<IProps, IState> {
    private url = Config.WORKSPACE_WEBSOCKET_BASE_ADDRESS +
        `/api/chat/ ${this.props.sessionId}/driver`;
    private ws = new WebSocket(this.url);

    public constructor(props: IProps) {
        super(props);
        this.state = {
            history: "",
            message: "",
            name: "",
        };
        this.clickSendHandle = this.clickSendHandle.bind(this);
        this.ws.onopen = () => {
            console.log("connect to chat server");
        };
        this.ws.onmessage = (e) => {
            const obj = JSON.parse(e.data);
            if (obj.kind === "chat") {
                this.setState({
                    history: this.state.history + (obj.payload.name + " " + obj.payload.date + ":\n"
                        + obj.payload.message + "\n"),
                });
            }
        };
    }

    public handleNameChange = (e: any) => {
        this.setState({
            name: e.target.value,
        });
    }

    public handleMessageChange = (e: any) => {
        this.setState({
            message: e.target.value,
        });
    }


    public async clickSendHandle() {
        this.setState({
            history: this.state.history + (this.state.name + " " + new Date() + ":\n"
                + this.state.message + "\n"),
        });
    }


    public render() {
        return (
            <div>
                <Form>
                    <Form.Group controlId="ChatHistory">
                        <Form.Label>Chat History</Form.Label>
                        <Form.Control as="textarea" rows="8" value={this.state.history}/>
                    </Form.Group>
                    <Form.Group as={Row} controlId="name">
                        <Form.Label column sm={1}>Name:</Form.Label>
                        <Col sm={4}>
                            <Form.Control
                                required
                                type="text"
                                placeholder="Input Name Here"
                                value={this.state.name}
                                onChange={this.handleNameChange}
                            />
                        </Col>
                    </Form.Group>
                </Form>
                <InputGroup className="mb-3">
                    <FormControl
                        placeholder="Input Message Here"
                        aria-label="Input Message Here"
                        aria-describedby="message"
                        value={this.state.message}
                        onChange={this.handleMessageChange}
                    />
                    <InputGroup.Append>
                        <Button variant="primary" onClick={this.clickSendHandle}>Send Message</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
        );
    }
}


