import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import "./index.css";

import HomeApp from "./HomeApp";
import NavigatorApp from "./NavigatorApp";

const App = () => (
    <Switch>
        <Route exact={true} path="/"><HomeApp /></Route>
        <Route path="/session/" component={ NavigatorApp } />
    </Switch>
);

library.add(fas);

ReactDOM.render(
  <BrowserRouter><App /></BrowserRouter>,
  document.getElementById("root")
);
