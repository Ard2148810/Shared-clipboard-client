const WebSocket = require('ws');

class WebSocketManager {
    constructor(clipboard, connectionHandler, roomId, roomReceivedHandler) {
        this.clipboard = clipboard;
        this.connectionHandler = connectionHandler;
        this.roomReceivedHandler = roomReceivedHandler;
        this.ws = null;
        this.connect(roomId);
    }

    send(text) {
        if(this.isConnected()) {
            const msg = {
                type: "text",
                content: text
            }
            this.ws.send(JSON.stringify(msg));
        }
    }

    isConnected() {
        return this.ws !== null && this.ws.readyState === 1;
    }

    connect(roomId) {
        this.ws = new WebSocket('ws://192.168.42.144:5001', roomId, { handshakeTimeout: 5000 });

        this.ws.on('open', () => {
            console.log(`open`);
            this.connectionHandler('open');
        });

        this.ws.on('message', (data) => {
            console.log(`message| ${data}`);
            try {
                const jsonData= JSON.parse(data);
                if(jsonData.type === 'room-id') {
                    console.log(jsonData.content);
                    this.roomReceivedHandler(jsonData.content);
                } else {
                    this.clipboard.write(jsonData.content, true);
                }
            } catch (e) {
                console.log(e);
            }
        });

        this.ws.on('error', (event) => {
            console.log(`error| ${event}`);
            this.connectionHandler('error');
        });

        this.ws.on('close', (code, reason) => {
            console.log(`close| ${code}`);
            this.connectionHandler('close', code, reason);
        });
    }

    disconnect() {
        this.ws.close();
    }
}

module.exports.WebSocketManager = WebSocketManager;
