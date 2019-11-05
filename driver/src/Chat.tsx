import React from "react";
import {Button, Col, Form, FormControl, InputGroup, Row} from "react-bootstrap";

interface IState {
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
        };
        this.clickSendHandle = this.clickSendHandle.bind(this);
        this.pressSendHandle = this.pressSendHandle.bind(this);
    }

    public handleMessageChange = (e: any) => {
        this.setState({
            message: e.target.value,
        });
    };

    public handleHistoryChange = (e: any) => {
        this.setState({});
    };

    public clickSendHandle() {
        if (this.state.message === "") {
            return;
        }
        const date = new Date();
        const dateStr = date.getHours() + ":" + date.getMinutes();
        this.setState({
            history: this.state.history + ("Driver " + dateStr + ":\n"
                + this.state.message + "\n"),
            message: "",
        });
    }

    public pressSendHandle(e: any) {
        if (e.charCode === 13 && e.ctrlKey) {
            this.clickSendHandle();
        }
    }

    public componentWillReceiveProps(nextProps: Readonly<IProps>, nextContext: any): void {
        if (nextProps.history !== this.props.history) {
            const message = JSON.parse(nextProps.history);
            const nameStr = (message.name === "") ? "Navigator" : message.name;
            const date = new Date(message.date);
            const dateStr = date.getHours() + ":" + date.getMinutes();
            this.setState({
                history: this.state.history + (nameStr + " " + dateStr + "\n"
                    + message.message + "\n"),
            });
        }
    }

    public componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any): void {
        if (prevProps.history !== this.props.history || prevState.history !== this.state.history) {
            this.scrollToBottom();
        }
    }


    public scrollToBottom() {
        const chatHistory: any = document.getElementById("ChatHistory");
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }


    public render() {
        return (
            <Form className="flex-grow-1 d-flex flex-column">
                <Form.Group controlId="ChatHistory" className="flex-grow-1 d-flex flex-column">
                    <Form.Label>Chat History</Form.Label>
                    <Form.Control as="textarea" className="overflow-auto flex-grow-1"
                        value={this.state.history} onChange={this.handleHistoryChange}/>
                </Form.Group>
                <InputGroup>
                    <FormControl
                        placeholder="Input Message Here"
                        aria-label="Input Message Here"
                        aria-describedby="message"
                        value={this.state.message}
                        onKeyPress={this.pressSendHandle}
                        onChange={this.handleMessageChange}
                    />
                    <InputGroup.Append>
                        <Button variant="primary" onClick={this.clickSendHandle}>Send
                            Message</Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form>
        );
    }
}


