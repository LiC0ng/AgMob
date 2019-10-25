import React from "react";
import {Button, Col, Form, FormControl, InputGroup, Row} from "react-bootstrap";

interface IState {
    name: string;
    message: string;
    history: string;
}

interface IProps {
    history: string;
}

export default class Chat extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props);
        this.state = {
            history: "",
            message: "",
            name: "",
        };
        this.clickSendHandle = this.clickSendHandle.bind(this);
    }

    public handleNameChange = (e: any) => {
        this.setState({
            name: e.target.value,
        });
    };

    public handleMessageChange = (e: any) => {
        this.setState({
            message: e.target.value,
        });
    };


    public async clickSendHandle() {
        const date = new Date();
        const dateStr = date.getHours() + ":" + date.getMinutes();
        this.setState({
            history: this.state.history + (this.state.name + " " + dateStr + ":\n"
                + this.state.message + "\n"),
            message: "",
        });
    }

    public componentWillReceiveProps(nextProps: Readonly<IProps>, nextContext: any): void {
        if (nextProps.history !== this.props.history) {
            const message = JSON.parse(nextProps.history);
            const date = new Date(message.date);
            const dateStr = date.getHours() + ":" + date.getMinutes();
            this.setState({
                history: this.state.history + (message.name + " " + dateStr + "\n"
                    + message.message + "\n"),
            });
        }
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


