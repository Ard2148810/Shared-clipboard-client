const { ipcRenderer } = require('electron');

document
    .querySelector('#btnConnect')
    .addEventListener('click', (event) => {
        ipcRenderer
            .invoke('perform-action', 'first', 'second')
            .catch();
    });

ipcRenderer.on('test', (event, arg) => {
   console.log(`Test ${arg}`);
});
