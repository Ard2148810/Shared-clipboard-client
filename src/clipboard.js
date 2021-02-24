const clipboardListener = require('clipboard-event');
const clipboardy = require('clipboardy');

class Clipboard {
    constructor(onClipboardUpdated, onClipboardChange) {
        this.history = ["Try copying something"];
        this.capacity = 5;
        this.onClipboardUpdated = onClipboardUpdated;
        this.onClipboardChange = onClipboardChange;
        this.setListening(true);
        this.lastFromServer = false;
    }

    write(text, fromServer) {
        this.lastFromServer = fromServer;
        clipboardy.writeSync(text);
    }

    useHistoryItem = (id) => {
        this.write(this.history[id], false);
    }

    addHistoryItem = (item) => {
        this.history.unshift(item);
        if(this.history.length > this.capacity) this.history.pop();
        this.onClipboardUpdated(this.history);
    }

    setListening = (value) => {
        if(value) {
            clipboardListener.startListening();
            clipboardListener.on('change', () => {
                clipboardy
                    .read()
                    .then((newValue) => {
                    this.onClipboardChange(newValue, this.lastFromServer);
                    this.lastFromServer = false;
                });
            });
        }
        else {
            clipboardListener.stopListening();
        }
    }
}

module.exports.Clipboard = Clipboard
