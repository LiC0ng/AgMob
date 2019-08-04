import React from "react";

interface Props {}
interface State {}

export default class WaitNewDriver extends React.Component<Props, State> {

    render() {
        return (
            <div style={{textAlign: "center" }}>
                <h1>Waiting for new driver</h1>
                <p>Please wait for a little while longer. </p>
            </div>
        );
    }
}
