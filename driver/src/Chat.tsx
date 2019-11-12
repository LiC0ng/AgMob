import React from "react";
import {Button, Form, FormControl, InputGroup} from "react-bootstrap";

interface IState {
    message: string;
}

interface IProps {
    nav_message: string;
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
        const history = document.getElementById("chatHistory");
        const message = document.createElement("div");
        message.innerHTML = "Driver " + "<span style='font-size: 12px; color: grey'> " + dateStr + "</span>" + ":</br>"
            + this.state.message;
        if (history) {
            history.appendChild(message);
            history.scrollTop = history.scrollHeight;
        }
        this.setState({
            message: "",
        });
    }

    public pressSendHandle(e: any) {
        if (e.charCode === 13 && e.ctrlKey) {
            this.clickSendHandle();
        }
    }

    public componentWillReceiveProps(nextProps: Readonly<IProps>, nextContext: any): void {
        if (nextProps.nav_message !== this.props.nav_message) {
            const navMessage = JSON.parse(nextProps.nav_message);
            const nameStr = (navMessage.name === "") ? "Navigator" : navMessage.name;
            const date = new Date(navMessage.date);
            const dateStr = date.getHours() + ":" + date.getMinutes();
            const history = document.getElementById("chatHistory");
            const message = document.createElement("div");
            message.innerHTML = "<span style='color: " + navMessage.color + "'>■</span>" +
                                nameStr + "<span style='font-size: 12px; color: grey'> " +
                                dateStr + "</span>" + ":</br>" + navMessage.message;
            if (history) {
                history.appendChild(message);
                history.scrollTop = history.scrollHeight;
            }
        }
    }

    public render() {
        return (
            <Form className="flex-grow-1 d-flex flex-column">
                {/*<Form.Group controlId="ChatHistory" className="flex-grow-1 d-flex flex-column">*/}
                {/*    <Form.Label>Chat History</Form.Label>*/}
                {/*    <Form.Control as="textarea" className="overflow-auto flex-grow-1"*/}
                {/*        value={this.state.history} onChange={this.handleHistoryChange}/>*/}
                {/*</Form.Group>*/}
                <div id="chatHistory" onChange={this.handleHistoryChange} style={{height: 300, overflow: "auto"}}>
                </div>
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


