const clipboardListener = require('clipboard-event');
const clipboardy = require('clipboardy');

class Clipboard {
    constructor(onClipboardUpdated, onClipboardChange) {
        this.history = ["Empty clipboard", "Test"];
        this.capacity = 5;
        this.onClipboardUpdated = onClipboardUpdated;
        this.onClipboardChange = onClipboardChange;
        this.setListening(true);
        this.lastFromServer = null;
    }

    write(text, fromServer) {
        if(fromServer) {
            this.lastFromServer = text;
        } else {
            this.lastFromServer = null;
        }
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
                const newValue = clipboardy.readSync();
                const fromServer = this.lastFromServer !== null ? newValue === this.lastFromServer : false;
                this.onClipboardChange(newValue, fromServer);
            });
        }
        else {
            clipboardListener.stopListening();
        }
    }
}

module.exports.Clipboard = Clipboard
