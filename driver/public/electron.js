const electron = require('electron');
const shell =  require('electron').shell;
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, overlayWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false, // FIXME!!!!!!
        }
    });

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
            pathname: path.join(__dirname, '/../build/index.html'),
            protocol: 'file:',
            slashes: true
        });
    mainWindow.loadURL(startUrl);
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    mainWindow.webContents.on('new-window', (event, url) => {
        // stop Electron from opening another BrowserWindow
        event.preventDefault()
        // open the url in the default system browser
        shell.openExternal(url)
    })

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        app.quit();
    });

    electron.protocol.registerHttpProtocol("agmob-driver", (req, cb) => {
        let id = req.url.substr(13);
        if (id.startsWith("//"))
            id = id.substr(2);
        const ext = "#/join_workspace/" + id;
        mainWindow.loadURL(startUrl + ext);
    });

    // Setup Agmob overlay window
    const displayBounds = electron.screen.getPrimaryDisplay().workArea;
    overlayWindow = new BrowserWindow({
        autoHideMenuBar: true,
        transparent: true,
        frame: false,
        fullscreen: process.platform !== "darwin",
        focusable: false,
        ...displayBounds,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false, // FIXME!!!!!!
        },
    });
    overlayWindow.setIgnoreMouseEvents(true);
    overlayWindow.setAlwaysOnTop(true);
    overlayWindow.loadURL(startUrl + "#overlay");
    // Pipe between mainWindow and overlayWindow (-> only)
    electron.ipcMain.on("overlay", (event, arg) =>
        overlayWindow.webContents.send("overlay", arg));
    electron.ipcMain.on("overlay-clear", (event, arg) =>
        overlayWindow.webContents.send("overlay-clear", arg));

    // Move overlay window to the same display on which the main window is
    mainWindow.on("move", () => {
        const mBounds = mainWindow.getBounds();
        const mDisp = electron.screen.getDisplayNearestPoint({ x: mBounds.x, y: mBounds.y });
        const oBounds = overlayWindow.getBounds();
        const oDisp = electron.screen.getDisplayNearestPoint({ x: oBounds.x, y: oBounds.y });
        if (mDisp !== oDisp) {
            overlayWindow.setBounds(mDisp.workArea);
        }
    });

    mainWindow.on("display-metrics-changed", () => {
        const mBounds = mainWindow.getBounds();
        const mDisp = electron.screen.getDisplayNearestPoint({ x: mBounds.x, y: mBounds.y });
        const oBounds = overlayWindow.getBounds();
        const oDisp = electron.screen.getDisplayNearestPoint({ x: oBounds.x, y: oBounds.y });
        if (mDisp !== oDisp) {
            overlayWindow.setBounds(mDisp.workArea);
        }
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => setTimeout(createWindow, 500));

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.setAsDefaultProtocolClient("agmob-driver");
