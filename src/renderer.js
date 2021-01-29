const { ipcRenderer } = require('electron');

let currentConnectionStatus = false;
const btnConnect = document.querySelector('#btnConnect');
const inputRoomId = document.querySelector('#roomId');
let alertActive = false;
let timeoutId = null;
const mainAlert = document.querySelector('#mainAlert');

const INCORRECT_ROOM_ID = 4001;
const INCORRECT_ROOM_ID_REASON = "Incorrect room ID";

btnConnect
    .addEventListener('click', (event) => {
        ipcRenderer
            .invoke('renderer-connection', !currentConnectionStatus, inputRoomId.value)
            .catch();
    });

ipcRenderer.on('ws-connected', (event) => {
    currentConnectionStatus = true;
    console.log('connected');
    onConnected();
});

ipcRenderer.on('ws-disconnected', (event, code, reason) => {
    currentConnectionStatus = false;
    console.log('disconnected');

    onDisconnected(code, reason);
});

ipcRenderer.on('ws-error', (event) => {
    // No need for explicit disconnecting, it will be called implicitly
    console.log('error');
    alert('Server connection error');
})

const statusValue = document.querySelector('#status-value');

function onConnected() {
    statusValue.innerHTML = 'Connected';
    btnConnect.innerHTML = 'Disconnect';
    statusValue.classList.replace('status-disconnected', 'status-connected');
    inputRoomId.disabled = true;
}

function onDisconnected(code, reason) {
    statusValue.innerHTML = 'Disconnected';
    btnConnect.innerHTML = 'Connect';
    statusValue.classList.replace('status-connected', 'status-disconnected');
    inputRoomId.disabled = false;
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
