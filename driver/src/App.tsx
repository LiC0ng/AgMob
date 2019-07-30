import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  RouteComponentProps
} from "react-router-dom";
import './App.css';
import End from "./End";
import TimerCountdown from "./timer";
import Top from "./Top";
import Join from "./Join"
import { Button, Container} from "react-bootstrap";
import StartShare from "./start-share-page";

interface Props {
}

interface State {
}

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      peerList: {},
    };
  }

  render() {
    return (
        <Container>
          <Router>
            <Switch>
              <Route exact={true} path="/"><Top/></Route>
              <Route path="/new_workspace/" component={ TimerCountdown }/>
              <Route path="/join_workspace/"><Join/></Route>
              <Route path="/end/" component={End}/>
              <Route path="/start_page/" component={ StartShare } />
            </Switch>
          </Router>
        </Container>
    );
  }
}



// P2P通信を切断する
// function hangUp(){
//   if (peerConnection) {
//     if(peerConnection.iceConnectionState !== 'closed'){
//       peerConnection.close();
//       peerConnection = null;
//       negotiationneededCounter = 0;
//       const message = JSON.stringify({ type: 'close' });
//       console.log('sending close message');
//       ws.send(message);
//       cleanupVideoElement(remoteVideo);
//       textForSendSdp.value = '';
//       textToReceiveSdp.value = '';
//       return;
//     }
//   }
//   console.log('peerConnection is closed.');
// }
