import React from "react";
import {Button, Form, FormControl, InputGroup} from "react-bootstrap";

const regUrl = /((http|ftp|https):\/\/)?[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;

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
        let chatMessage = this.state.message;

        chatMessage = chatMessage.replace(regUrl, (a) => {
            if (!a.indexOf("http")) {
                return '<a href="' + a + '" target=_blank>' + a + "</a>";
            } else {
                return '<a href="http://' + a + '" target=_blank>' + a + "</a>";
            }
        });

        message.innerHTML = "Driver " + "<span style='font-size: 12px; color: grey'> " + dateStr + "</span>" + ":</br>"
            + chatMessage;
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

    cancelEvent = (e: any) => e.preventDefault();

    public componentWillReceiveProps(nextProps: Readonly<IProps>, nextContext: any): void {
        if (nextProps.nav_message !== this.props.nav_message) {
            const navMessage = JSON.parse(nextProps.nav_message);
            const nameStr = (navMessage.name === "") ? "Navigator" : navMessage.name;
            const date = new Date(navMessage.date);
            const dateStr = date.getHours() + ":" + date.getMinutes();
            const history = document.getElementById("chatHistory");
            const message = document.createElement("div");
            let messageStr = navMessage.message;

            messageStr = messageStr.replace(regUrl, (a: any) => {
                if (!a.indexOf("http")) {
                    return '<a href="' + a + '" target=_blank>' + a + "</a>";
                } else {
                    return '<a href="http://' + a + '" target=_blank>' + a + "</a>";
                }
            });
            message.innerHTML = "<span style='color: " + navMessage.color + "'>■</span>" +
                nameStr + "<span style='font-size: 12px; color: grey'> " +
                dateStr + "</span>" + ":</br>" + messageStr;
            if (history) {
                history.appendChild(message);
                history.scrollTop = history.scrollHeight;
            }
        }
    }

    public render() {
        return (
            <Form className="flex-grow-1 d-flex flex-column" onSubmit={this.cancelEvent}>
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


