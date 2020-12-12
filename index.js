const clipboardListener = require('clipboard-event');
const clipboardy = require('clipboardy');
const { app, Tray, Menu, BrowserWindow } = require('electron');
const WebSocket = require('ws');

// To start listening
clipboardListener.startListening();
clipboardListener.on('change', () => {
    //console.log(`Clipboard changed ${clipboardy.readSync()}`);
    addClipboardHistoryItem(clipboardy.readSync());
});

const ws = new WebSocket('ws://localhost:5001');

ws.on('open', () => {
    console.log(ws.readyState ? 'Connected to WS server' : 'WebSocket connection FAILED!');
});

ws.on('message', (data) => {
    console.log(data);
    clipboardy.writeSync(JSON.parse(data).content);
});

let mainWindow = null;
let tray = null;
let clipboardHistory = ["Empty clipboard", "Test"];
let clipboardHistorySize = 5;
const clipboardHistoryItemCharacterMax = 30;

const preferencesClicked = () => {
    if(mainWindow !== null) {
        if(mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
    }
}

const addClipboardHistoryItem = (item) => {
    clipboardHistory.unshift(item);
    if(clipboardHistory.length > clipboardHistorySize) clipboardHistory.pop();
    setTrayContextMenu();
}

const setTrayContextMenu = () => {
    const menuItemsFromClipboard = clipboardHistory.map(item => {
        let processedItem = item;
        if(processedItem.length > clipboardHistoryItemCharacterMax) {
            processedItem = processedItem.slice(0, clipboardHistoryItemCharacterMax);
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

app.whenReady().then(() => {
    app.quitting = false;

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
    setTrayContextMenu();

}).catch(console.log);

app.on('window-all-closed', e => { e.preventDefault() });	// Don't close whole app when window closed

app.on('before-quit', () => {
    app.quitting = true;
});

app.on('quit', () => {
    clipboardListener.stopListening();
});
// To stop listening
//clipboardListener.stopListening();
