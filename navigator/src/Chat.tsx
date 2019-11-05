import React from "react";
import {Button, Col, Form, FormControl, InputGroup, Row} from "react-bootstrap";

interface IProps {
    ws: WebSocket;
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
            "payload": `{"name":"${this.state.name}","message":"${this.state.message}","date":"${date.toString()}"}`
        };
        this.props.ws.send(JSON.stringify(sendObject));
        this.setState({
            message: "",
        })
    };

    public pressSendHandle(e: any) {
        if (e.charCode === 13 && e.ctrlKey) {
            this.clickSendHandle();
        }
    }

    public render() {
        return (
            <Form className="chat col">
                <Form.Group as={Row} controlId="name" className="w-100">
                    <Form.Label column xs="auto">Name:</Form.Label>
                    <Col xs="auto">
                        <Form.Control
                            required
                            type="text"
                            placeholder="Input Name Here"
                            value={this.state.name}
                            onChange={this.handleNameChange}
                        />
                    </Col>
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
                            <Button variant="primary" onClick={this.clickSendHandle}>Send Message</Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </Form>
        );
    }
}

