import React from "react";
import {LaserPointerState} from "./types";
const electron = window.require("electron");

interface Props {
}

interface State {
}

export default class OverlayApp extends React.Component<Props, State> {
    private canvasRef?: HTMLCanvasElement;
    private readonly setCanvasRef = (canvas: HTMLCanvasElement) => {
        this.canvasRef = canvas;
        if (canvas === null)
            return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };

    constructor(props: Props) {
        super(props);

        this.state = {
        };

        electron.ipcRenderer.on("overlay", (event: any, arg: any) => {
            console.log(`[Overlay] Received laser pointers update: ${arg}`);
            this.update(arg);
        });
    }

    private statesHistory: LaserPointerState[][] = [];

    private update(ary: LaserPointerState[]) {
        this.statesHistory.push(ary);
        if (this.statesHistory.length > 100)
            this.statesHistory.shift();

        const canvas = this.canvasRef;
        if (!canvas)
            return;
        const context = canvas.getContext("2d");
        // How can this happen?
        if (!context)
            return;

        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Create pointers and trail
        for (let i = 0; i < this.statesHistory.length; i++) {
            const states = this.statesHistory[i];
            const opacity = (i + 1) / this.statesHistory.length;

            for (let j = 0; j < states.length; j++) {
                const item = states[j];
                context.beginPath();
                context.arc(item.posX, item.posY, 1.5, 0, 2 * Math.PI);
                context.fillStyle = `rgba(${item.color}, ${opacity})`;
                context.fill();
            }
        }

        //window.requestAnimationFrame();
    }

    render() {
        return (
            <canvas style={{
                    display: "block",
                    height: "100vh",
                    width: "100vw",
                }}
                ref={this.setCanvasRef}></canvas>
        );
    }
}
