const { app, Tray, Menu, BrowserWindow } = require('electron');
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

const setTrayContextMenu = (historyItems) => {
    const menuItemsFromClipboard = historyItems.map(item => {
        let processedItem = item;
        if(processedItem.length > trayMenuHistoryItemMaxSize) {
            processedItem = processedItem.slice(0, trayMenuHistoryItemMaxSize);
            processedItem = processedItem.concat("...");
        }
        return { label: processedItem };
    });

    const staticMenuItems = [
        { type: 'separator' },
        { label: 'Preferences', click() {preferencesClicked()} },
        { type: 'separator' },
        { role: 'quit' }];
    const contextMenu = Menu.buildFromTemplate(menuItemsFromClipboard.concat(staticMenuItems));

    tray.setToolTip('This is my application.');
    tray.setContextMenu(contextMenu);
}

const onClipboardUpdated = (history) => {   // Update context menu when new value added to clipboard
    setTrayContextMenu(history);
}

const onClipboardChange = (text) => {   // Called when something is locally copied to clipboard
    app.websocket.send(text)
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
        icon: 'icon.png'
    });
    mainWindow.setMenu(null);
    mainWindow.on('close', event => {
        if(app.quitting === false) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

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
