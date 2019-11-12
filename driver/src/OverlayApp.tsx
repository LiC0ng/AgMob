import React from "react";
import {LaserPointerState} from "./types";
declare global {
    interface Window {
        require: any;
    }
}
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
            this.update(arg);
        });
        electron.ipcRenderer.on("overlay-clear", (event: any) => {
            console.log(`[Overlay] Received laser pointers clear request`);
            this.clear();
        });
    }

    private statesHistory: LaserPointerState[][] = [];

    private clear() {
        this.statesHistory = [];

        const canvas = this.canvasRef;
        if (!canvas)
            return;
        const context = canvas.getContext("2d");
        // How can this happen?
        if (!context)
            return;

        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

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
        let prev: Array<[number, number]> = [];
        for (let i = 0; i < this.statesHistory.length; i++) {
            const states = this.statesHistory[i];
            const opacity = (i + 1) / this.statesHistory.length;

            for (let j = 0; j < states.length; j++) {
                const item = states[j];
                const r = parseInt(item.color.substr(1, 2), 16),
                    g = parseInt(item.color.substr(3, 2), 16),
                    b = parseInt(item.color.substr(5, 2), 16);
                const style = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                const x = item.posX * canvas.width,
                    y = item.posY * canvas.height;

                const pair = prev[j];
                if (pair !== undefined) {
                    context.beginPath();
                    context.moveTo(pair[0], pair[1]);
                    context.lineTo(x, y);
                    context.strokeStyle = style;
                    context.lineWidth = 5;
                    context.lineCap = "round";
                    context.stroke();
                }
                if (i === this.statesHistory.length - 1) {
                    context.beginPath();
                    context.arc(x, y, 10, 0, 2 * Math.PI);
                    context.fillStyle = style;
                    context.fill();
                }

                prev[j] = [x, y];
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
