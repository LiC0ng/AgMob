import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import OverlayApp from "./OverlayApp";
import "./bootstrap-override.scss";
import "bootstrap";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import "./index.css";

library.add(fas);

if (window.location.hash === "#overlay")
    ReactDOM.render(<OverlayApp />, document.getElementById("root"));
else
    ReactDOM.render(<App />, document.getElementById("root"));
