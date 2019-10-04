import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "./index.css";

import HomeApp from "./HomeApp";
import NavigatorApp from "./NavigatorApp";

const App = () => (
  <div>
    <Switch>
      <Route exact={true} path="/"><HomeApp /></Route>
      <Route path="/session/" component={ NavigatorApp } />
    </Switch>
  </div>
);

ReactDOM.render(
  <BrowserRouter><App /></BrowserRouter>,
  document.getElementById("root")
);
