const WebSocket = require('ws');

class WebSocketManager {
    constructor(clipboard) {
        this.ws = new WebSocket('ws://localhost:5001');
        this.ws.on('open', () => {
            console.log('Connected');
        })
        this.ws.on('message', (data) => {
            console.log(data);
            clipboard.write(JSON.parse(data).content);
        });
    }

    send(text) {
        const msg = {
            type: "text",
            content: text
        }
        this.ws.send(JSON.stringify(msg));
    }
}

module.exports.WebSocketManager = WebSocketManager;
