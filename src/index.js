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

ipcMain.handle('perform-action', (event, ...args) => {
    console.log({ msg: 'Hello from main process!', event, args});
    event.sender.send('test', 1);
})

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

    tray.setToolTip('This is my application.');
    tray.setContextMenu(contextMenu);
}

const onClipboardUpdated = (history) => {   // Update context menu when new value added to clipboard
    setTrayContextMenu(history);
}

const onClipboardChange = (text, fromServer) => {
    app.clipboard.addHistoryItem(text);
    if(!fromServer) {   // Prevent sending back the same clipboard item
        app.websocket.send(text);
    }
}

app.whenReady().then(() => {
    app.quitting = false;

    app.clipboard = new Clipboard(onClipboardUpdated, onClipboardChange)
    app.websocket = new WebSocketManager(app.clipboard);
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
    })
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
