import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "./index.css";

import HomeApp from "./HomeApp";
import NavigatorApp from "./NavigatorApp";

const App = () => (
    <Switch>
        <Route exact={true} path="/"><HomeApp /></Route>
        <Route path="/session/" component={ NavigatorApp } />
    </Switch>
);

ReactDOM.render(
  <BrowserRouter><App /></BrowserRouter>,
  document.getElementById("root")
);
