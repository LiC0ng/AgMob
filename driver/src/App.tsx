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
              <Route path="/join_workspace/" component={Join}/>
              <Route path="/end/" component={End}/>
              <Route path="/start_page/" component={ StartShare } />
            </Switch>
          </Router>
        </Container>
    );
  }
}
