import React from "react";
import {Button, Col, Form, FormControl, InputGroup, Row} from "react-bootstrap";

const WORKSPACE_BASE_ADDRESS = "https://elang.itsp.club";
const WORKSPACE_WEBSOCKET_BASE_ADDRESS = "wss://elang.itsp.club";

function getSessionId() {
    return window.location.pathname.match(/\/session\/([a-z0-9-]+)/)![1];
}

interface IState {
    name: any;
    message: any;
}

export default class Chat extends React.Component<any, IState> {
    private id = getSessionId();
    private url = `${WORKSPACE_WEBSOCKET_BASE_ADDRESS}/api/chat/` + this.id;
    private ws = new WebSocket(this.url);

    public constructor(props: any) {
        super(props);
        this.state = {
            name: "",
            message: "",
        };
        this.clickSendHandle = this.clickSendHandle.bind(this);
        this.ws.onopen = () => {
            console.log("connect to chat server");
        }
    }

    public handleNameChange = (e: any)=> {
        this.setState({
            name: e.target.value,
        })
    };

    public handleMessageChange = (e: any)=> {
        this.setState({
            message: e.target.value,
        })
    };


    public async clickSendHandle() {
        let sendObject = {
            "kind": "chat",
            "name": this.state.name,
            "message": this.state.message,
        };
        this.ws.send(JSON.stringify(sendObject));
    };



    public render() {
        return (
            <div className="chat">
                <Form>
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
                        <Button variant="primary" onClick={ this.clickSendHandle }>Send Message</Button>
                    </InputGroup.Append>
                </InputGroup>
            </div>
        );
    }
}

