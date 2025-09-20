// Simplified P2P implementation using WebSocket
const WebSocket = require('ws');

class P2PNetwork {
    constructor(nodeId, port = 0) {
        this.nodeId = nodeId;
        this.port = port;
        this.wss = null;
        this.peers = new Map();
        this.connected = false;
        this.messageHandlers = new Map();
    }

    // Initialize WebSocket server
    initialize() {
        return new Promise((resolve) => {
            this.wss = new WebSocket.Server({ port: this.port });

            this.wss.on('connection', (ws, req) => {
                const peerId = req.url.replace('/', '') || `peer_${Date.now()}`;
                this.peers.set(peerId, ws);
                console.log(`P2P peer connected: ${peerId}`);

                ws.on('message', (message) => {
                    this.handleMessage(message, peerId);
                });

                ws.on('close', () => {
                    this.peers.delete(peerId);
                    console.log(`P2P peer disconnected: ${peerId}`);
                });
            });

            this.connected = true;
            console.log(`P2P WebSocket server started on port ${this.port}`);
            resolve(true);
        });
    }

    // Connect to another peer
    connectToPeer(peerAddress) {
        return new Promise((resolve) => {
            const ws = new WebSocket(peerAddress);

            ws.on('open', () => {
                const peerId = `peer_${Date.now()}`;
                this.peers.set(peerId, ws);
                console.log(`Connected to P2P peer: ${peerId}`);
                resolve(true);
            });

            ws.on('error', (error) => {
                console.error('P2P WebSocket connection error:', error);
                resolve(false);
            });
        });
    }

    // Broadcast message to all connected peers
    broadcast(message) {
        const messageStr = JSON.stringify(message);

        this.peers.forEach((ws, peerId) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });

        console.log(`Broadcasted message to ${this.peers.size} peers`);
    }

    // Send message to specific peer
    sendToPeer(peerId, message) {
        const ws = this.peers.get(peerId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            console.log(`Message sent to peer ${peerId}`);
            return true;
        }
        return false;
    }

    // Register message handler
    on(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    // Handle incoming messages
    handleMessage(message, peerId) {
        try {
            const data = JSON.parse(message.toString());
            console.log(`Received P2P message from ${peerId}:`, data.type);

            const handler = this.messageHandlers.get(data.type);
            if (handler) {
                handler(data.data, peerId);
            }
        } catch (error) {
            console.error('Failed to parse P2P message:', error);
        }
    }

    // Stop the P2P network
    stop() {
        if (this.wss) {
            this.wss.close();
        }
        this.connected = false;
        console.log(`P2P node ${this.nodeId} stopped`);
    }

    // Get network statistics
    getStats() {
        return {
            nodeId: this.nodeId,
            connected: this.connected,
            peerCount: this.peers.size,
            peers: Array.from(this.peers.keys()),
            port: this.port
        };
    }

    // Gossip protocol implementation
    gossip(message, ttl = 5) {
        if (ttl <= 0) return;

        // Broadcast to all peers
        this.broadcast({
            type: 'gossip',
            data: message,
            ttl: ttl - 1,
            sender: this.nodeId
        });

        console.log(`Gossiped message with TTL ${ttl}`);
    }
}

module.exports = {
    P2PNetwork
};
