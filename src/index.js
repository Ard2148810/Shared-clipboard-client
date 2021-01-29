const { app, Tray, Menu, BrowserWindow, ipcMain } = require('electron');
const { Clipboard } = require('./clipboard');
const { WebSocketManager } = require('./WebSocketManager');


let mainWindow = null;
let tray = null;
const trayMenuHistoryItemMaxSize = 30;

const preferencesClicked = () => {
    if(mainWindow !== null) {
        if(mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
    }
}

const historyItemClicked = (id) => {
    app.clipboard.useHistoryItem(id);
}

const setTrayContextMenu = (historyItems) => {
    const menuItemsFromClipboard = historyItems.map((item, index) => {
        let processedItem = item;
        if(processedItem.length > trayMenuHistoryItemMaxSize) {
            processedItem = processedItem
                .slice(0, trayMenuHistoryItemMaxSize)
                .concat("...");
        }
        return { label: processedItem, click() {historyItemClicked(index);}};
    });

    const staticMenuItems = [
        { type: 'separator' },
        { label: 'Manager', click() {preferencesClicked()} },
        { type: 'separator' },
        { role: 'quit' }];
    const contextMenu = Menu.buildFromTemplate(menuItemsFromClipboard.concat(staticMenuItems));

    tray.setToolTip('Shared clipboard');
    tray.setContextMenu(contextMenu);
}

const onClipboardUpdated = (history) => {   // Update context menu when new value added to clipboard
    setTrayContextMenu(history);
}

const onClipboardChange = (text, fromServer) => {
    app.clipboard.addHistoryItem(text);
    if(!fromServer && app.websocket !== null && app.websocket.isConnected()) {   // Prevent sending back the same clipboard item
        app.websocket.send(text);
    }
}

const connectionHandler = (status, code, reason) => {
    if(status === 'open') {
        app.renderer.send('ws-connected');
    } else if(status === 'close') {
        app.renderer.send('ws-disconnected', code, reason);
    } else if(status === 'error') {
        app.renderer.send('ws-error');
    }
}

const roomReceivedHandler = (id) => {
    app.renderer.send('ws-room-id', id);
}

const onConnect = (connect, roomId) => {
    if(connect) {
        app.websocket = new WebSocketManager(app.clipboard, connectionHandler, roomId, roomReceivedHandler);
    } else if(app.websocket !== null) {
        app.websocket.disconnect();
        app.websocket = null;
    }
}

app.whenReady().then(() => {
    app.quitting = false;

    app.clipboard = new Clipboard(onClipboardUpdated, onClipboardChange);
    app.renderer = null;
    ipcMain.handle('renderer-connection', (event, connect, roomId) => {
        app.renderer = event.sender;
        onConnect(connect, roomId);
    });
    app.websocket = null;
    // Window
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        show: false,
        icon: 'icon.png',
        webPreferences: {
            nodeIntegration: true
        }
    });
    const url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: require('path').join(__dirname, 'index.html')
    });
    mainWindow.loadURL(url).catch(console.log);
    mainWindow.setMenu(null);
    mainWindow.on('close', event => {
        if(app.quitting === false) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
    mainWindow.openDevTools();

    // Tray
    tray = new Tray('icon.png');
    setTrayContextMenu(app.clipboard.history);

}).catch(console.log);

app.on('window-all-closed', e => { e.preventDefault() });	// Don't close whole app when window closed

app.on('before-quit', () => {
    app.quitting = true;
});

app.on('quit', () => {
    app.clipboard.setListening(false);
});
