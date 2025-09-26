require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');

// Import our custom modules
const { Mempool, ChildWelfareTransaction } = require('./mempool');
const { ConsensusManager, Block } = require('./consensus');
const { P2PNetwork } = require('./p2p');
const { PBFTManager } = require('./pbft/manager');
const { validateDomainRules } = require('./pbft/roles');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize components
let nodeId = generateNodeId();
let nodeRole = process.env.NODE_ROLE || 'NGO'; // Default to NGO
let mempool = new Mempool();
let consensusManager = new ConsensusManager(nodeId, nodeRole);
let p2pNetwork = new P2PNetwork(nodeId, parseInt(PORT) + 1000); // Use different port for P2P
let pbft = new PBFTManager(nodeId, 4);
const apiRoutes = require('./routes/api');
const { buildTransactionPayload } = require('./txBuilder');

// Generate unique node ID
function generateNodeId() {
    return 'node_' + Math.random().toString(36).substr(2, 9);
}

// Basic routes
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        nodeId: nodeId,
        nodeRole: nodeRole,
        mempoolSize: mempool.size(),
        blockchainLength: consensusManager.blockchain.length,
        currentLeader: consensusManager.leader,
        p2pConnected: p2pNetwork.connected,
        pbft: pbft.getState(),
        stats: {
            mempool: mempool.getStats(),
            consensus: consensusManager.getStats(),
            p2p: p2pNetwork.getStats()
        }
    });
});

app.get('/mempool', (req, res) => {
    res.json({
        transactions: mempool.getAllTransactions(),
        stats: mempool.getStats()
    });
});

app.get('/blockchain', (req, res) => {
    res.json({
        blocks: consensusManager.blockchain,
        stats: consensusManager.getStats()
    });
});

// API alias for frontend: GET /api/blocks -> recent blocks
app.get('/api/blocks', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const all = consensusManager.blockchain || [];
    const recent = all.slice(-limit);
    res.json({
        blocks: recent,
        total: all.length
    });
});

// API Routes
app.use('/api', apiRoutes);

// Add transaction to mempool
app.post('/transaction', async (req, res) => {
    try {
        const incoming = req.body || {};
        const txData = await buildTransactionPayload(incoming);

        // Enforce role-based domain rules upfront
        const domainCheck = validateDomainRules({ from: txData.from, action: txData.action, data: txData.data });
        if (!domainCheck.ok) {
            return res.status(400).json({ success: false, message: domainCheck.reason });
        }

        // Create transaction object
        const transaction = new ChildWelfareTransaction(
            txData.id,
            txData.from,
            txData.to,
            txData.amount,
            txData.action,
            txData.childRecordId,
            txData.data || {}
        );

        // Sign transaction
        transaction.sign(nodeId);

        // Add to mempool
        const result = mempool.addTransaction(transaction);

        if (result.success) {
            // Broadcast transaction to peers
            p2pNetwork.broadcast({
                type: 'new_transaction',
                data: transaction.toJSON()
            });

            res.json({
                success: true,
                message: 'Transaction added to mempool',
                transactionId: transaction.id
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Failed to build transaction' });
    }
});

// Get pending transactions for block creation
app.get('/pending-transactions', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json({
        transactions: mempool.getPendingTransactions(limit)
    });
});

// Create new block (leader only)
app.post('/block', (req, res) => {
    if (!consensusManager.isLeader()) {
        return res.status(403).json({
            success: false,
            message: 'Only leader can create blocks'
        });
    }

    const transactions = mempool.getPendingTransactions(10);
    const lastBlock = consensusManager.blockchain[consensusManager.blockchain.length - 1];
    const previousHash = lastBlock ? lastBlock.hash : '0';

    const block = consensusManager.createBlock(transactions, previousHash);

    // PBFT: primary proposes
    pbft.onPrimaryPropose(block.toJSON());

    if (consensusManager.addBlock(block)) {
        // Broadcast block to peers
        p2pNetwork.broadcast({ type: 'new_block', data: block.toJSON() });

        // Notify local WebSocket clients and P2P about confirmed transactions
        try {
            const txs = block.transactions || [];
            txs.forEach((tx) => {
                const payload = { type: 'tx_confirmed', data: { txId: tx.id, blockIndex: block.index, blockHash: block.hash } };
                // Broadcast to local WS clients
                wss.clients.forEach((client) => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(payload));
                    }
                });
                // Gossip to peers as a lightweight event
                p2pNetwork.broadcast(payload);
            });
        } catch (e) {
            console.error('Failed to emit confirmation events:', e);
        }

        res.json({
            success: true,
            message: 'Block created successfully',
            block: block.toJSON()
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Failed to create block'
        });
    }
});

// Get current leader
app.get('/leader', (req, res) => {
    res.json({
        currentLeader: consensusManager.leader,
        isCurrentNodeLeader: consensusManager.isLeader(),
        leaderIndex: consensusManager.leaderIndex
    });
});

// Sync blockchain with peer
app.post('/sync', async (req, res) => {
    const peerBlockchain = req.body.blockchain;

    if (consensusManager.syncWithPeer(peerBlockchain)) {
        res.json({
            success: true,
            message: 'Blockchain synchronized successfully'
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Failed to synchronize blockchain'
        });
    }
});

// Initialize all components
async function initialize() {
    try {
        // Initialize P2P network
        await p2pNetwork.initialize();
        
        // Auto-connect to other nodes after a short delay
        setTimeout(() => {
            p2pNetwork.autoConnect();
        }, 2000);

        // Set up P2P message handlers
        p2pNetwork.on('new_transaction', (data, peerId) => {
            console.log(`Received transaction from peer ${peerId}`);
            const tx = new ChildWelfareTransaction(
                data.id, data.from, data.to, data.amount,
                data.action, data.childRecordId, data.data
            );
            tx.signature = data.signature;
            mempool.addTransaction(tx);
        });

        p2pNetwork.on('new_block', (data, peerId) => {
            console.log(`Received block from peer ${peerId}`);
            const block = new Block(
                data.index, data.timestamp, data.transactions,
                data.previousHash, data.leader
            );
            block.hash = data.hash;
            block.signature = data.signature;
            block.merkleRoot = data.merkleRoot;

            const added = consensusManager.addBlock(block);
            if (added) {
                // Emit confirmation events to local WS clients
                const txs = block.transactions || [];
                txs.forEach((tx) => {
                    const payload = { type: 'tx_confirmed', data: { txId: tx.id, blockIndex: block.index, blockHash: block.hash } };
                    wss.clients.forEach((client) => {
                        if (client.readyState === 1) {
                            client.send(JSON.stringify(payload));
                        }
                    });
                });
            }
        });

        // Wire PBFT messages on P2P
        p2pNetwork.on('preprepare', (msg, peerId) => pbft.onReceivePreprepare(msg));
        p2pNetwork.on('prepare', (msg, peerId) => pbft.onReceivePrepare({ ...msg, from: peerId }));
        p2pNetwork.on('commit', (msg, peerId) => pbft.onReceiveCommit({ ...msg, from: peerId }));

        // Emit PBFT broadcasts via P2P
        pbft.on('preprepare', (msg) => p2pNetwork.broadcast({ type: 'preprepare', data: msg }));
        pbft.on('prepare', (msg) => p2pNetwork.broadcast({ type: 'prepare', data: { ...msg, from: nodeId } }));
        pbft.on('commit', (msg) => p2pNetwork.broadcast({ type: 'commit', data: { ...msg, from: nodeId } }));
        pbft.on('reply', (msg) => {
            console.log(`PBFT REPLY: ${JSON.stringify(msg)}`);
            // In production, send reply back to specific client
        });

        // On finalize, add block (if not already added) and notify
        pbft.on('finalize', ({ hash, block }) => {
            try {
                const b = new Block(block.index, block.timestamp, block.transactions, block.previousHash, block.leader);
                b.hash = block.hash;
                b.signature = block.signature;
                b.merkleRoot = block.merkleRoot;
                const added = consensusManager.addBlock(b);
                if (added) {
                    const txs = b.transactions || [];
                    txs.forEach((tx) => {
                        const payload = { type: 'tx_confirmed', data: { txId: tx.id, blockIndex: b.index, blockHash: b.hash } };
                        wss.clients.forEach((client) => {
                            if (client.readyState === 1) client.send(JSON.stringify(payload));
                        });
                    });
                }
            } catch (e) {
                console.error('Finalize failed:', e);
            }
        });

        p2pNetwork.on('sync_request', (data, peerId) => {
            console.log(`Sync request from peer ${peerId}`);
            p2pNetwork.sendToPeer(peerId, {
                type: 'sync_response',
                data: {
                    blockchain: consensusManager.blockchain
                }
            });
        });

        // Select initial leader
        consensusManager.selectLeader();
        
        // Rotate leader every 30 seconds for demo (only if we have peers)
        setInterval(() => {
            if (p2pNetwork.peers.size > 0) {
                const oldLeader = consensusManager.leader;
                consensusManager.selectLeader();
                const newLeader = consensusManager.leader;
                if (oldLeader !== newLeader) {
                    console.log(`🔄 Leader rotated: ${oldLeader} → ${newLeader}`);
                }
            }
        }, 30000);

        console.log('✅ All components initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize components:', error);
    }
}

// Start server
const server = app.listen(PORT, async () => {
    console.log(`🚀 Child Welfare Blockchain Node ${nodeId} started on port ${PORT}`);
    console.log(`👤 Node Role: ${nodeRole}`);
    console.log(`📊 Current Leader: ${consensusManager.leader}`);
    console.log(`🔗 Mempool: ${mempool.size()} transactions`);
    console.log(`🌐 P2P Port: ${PORT + 1000}`);

    // Initialize components
    await initialize();
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
        console.log('Received:', message.toString());
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');

    // Stop P2P network
    await p2pNetwork.stop();

    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
