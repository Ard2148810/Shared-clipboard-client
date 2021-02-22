const { ipcRenderer } = require('electron');

let currentConnectionStatus = false;
const btnConnect = document.querySelector('#btnConnect');
const inputRoomId = document.querySelector('#roomId');
const inputRoomDisplay = document.querySelector('#roomIdDisplay');
const statusValue = document.querySelector('#status-value');
let alertActive = false;
let timeoutId = null;
const mainAlert = document.querySelector('#mainAlert');

const INCORRECT_ROOM_ID = 4001;

btnConnect
    .addEventListener('click', () => {
        btnConnect.disabled = true;
        inputRoomId.disabled = true;
        if(currentConnectionStatus) {
            statusValue.innerHTML = "Disconnecting...";
        } else {
            statusValue.innerHTML = "Connecting..."
        }
        ipcRenderer
            .invoke('renderer-connection', !currentConnectionStatus, inputRoomId.value)
            .catch();
    });

ipcRenderer.on('ws-connected', () => {
    currentConnectionStatus = true;
    console.log('connected');
    onConnected();
});

ipcRenderer.on('ws-disconnected', (event, code, reason) => {
    currentConnectionStatus = false;
    console.log('disconnected');

    onDisconnected(code, reason);
});

ipcRenderer.on('ws-error', () => {
    // No need for explicit disconnecting, it will be called implicitly
    console.log('error');
    showAlert('Unable to connect to the server');
});

ipcRenderer.on('ws-room-id', (event, roomId) => {
    inputRoomDisplay.innerHTML = roomId;
});

function onConnected() {
    statusValue.innerHTML = 'Connected';
    btnConnect.innerHTML = 'Disconnect';
    statusValue.classList.replace('status-disconnected', 'status-connected');
    inputRoomId.disabled = true;
    btnConnect.disabled = false;
}

function onDisconnected(code, reason) {
    statusValue.innerHTML = 'Disconnected';
    btnConnect.innerHTML = 'Connect';
    statusValue.classList.replace('status-connected', 'status-disconnected');
    inputRoomId.disabled = false;
    btnConnect.disabled = false;
    inputRoomDisplay.innerHTML = '';
    if(code === INCORRECT_ROOM_ID) {
        showAlert(reason);
    }
}

function showAlert(msg) {
    mainAlert.innerHTML = msg;
    mainAlert.style.opacity = '1';
    if(alertActive) {
        alertActive = false;
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    timeoutId = setTimeout(() => {
        mainAlert.style.opacity = '0';
        alertActive = false;
        timeoutId = null;
    }, 4000);
    alertActive = true;
}
