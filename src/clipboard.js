const clipboardListener = require('clipboard-event');
const clipboardy = require('clipboardy');

class Clipboard {
    constructor(onClipboardUpdated, onClipboardChange) {
        this.history = ["Empty clipboard", "Test"];
        this.capacity = 5;
        this.onClipboardUpdated = onClipboardUpdated;
        this.onClipboardChange = onClipboardChange;
        this.setListening(true);
    }

    write(text) {
        clipboardy.writeSync(text);
        this.addHistoryItem(text);
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
                this.addHistoryItem(newValue);
                this.onClipboardChange(newValue);
            });
        }
        else {
            clipboardListener.stopListening();
        }
    }
}

module.exports.Clipboard = Clipboard
