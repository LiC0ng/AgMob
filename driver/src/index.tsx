import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import OverlayApp from "./OverlayApp";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

if (window.location.hash === "#overlay")
    ReactDOM.render(<OverlayApp />, document.getElementById("root"));
else
    ReactDOM.render(<App />, document.getElementById("root"));
