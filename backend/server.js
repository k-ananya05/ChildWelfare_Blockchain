const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');

// Import our custom modules
const { Mempool, ChildWelfareTransaction } = require('./mempool');
const { ConsensusManager, Block } = require('./consensus');
const { P2PNetwork } = require('./p2p');

const app = express();
const PORT = process.env.PORT || 3001;

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
        stats: {
            mempool: mempool.getStats(),
            consensus: consensusManager.getStats(),
            consensusAdvanced: consensusManager.getConsensusStats(),
            p2p: p2pNetwork.getStats(),
            ledger: {
                totalRecords: consensusManager.ledgerState.size,
                rollbackHistory: consensusManager.rollbackHistory.length
            }
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

// Add transaction to mempool
app.post('/transaction', (req, res) => {
    const txData = req.body;

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
});

// Get pending transactions for block creation
app.get('/pending-transactions', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json({
        transactions: mempool.getPendingTransactions(limit)
    });
});

// Create new block (leader only)
app.post('/block', async (req, res) => {
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

    if (consensusManager.addBlock(block)) {
        // Propagate block to peers for consensus
        const propagationStatus = p2pNetwork.propagateBlock(block, consensusManager);
        
        res.json({
            success: true,
            message: 'Block created and propagated for consensus',
            block: block.toJSON(),
            propagationStatus: propagationStatus
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

// Get ledger state
app.get('/ledger', (req, res) => {
    const childRecordId = req.query.childRecordId;
    
    if (childRecordId) {
        const record = consensusManager.getChildRecord(childRecordId);
        if (record) {
            res.json({
                success: true,
                record: record
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Child record not found'
            });
        }
    } else {
        res.json({
            success: true,
            records: consensusManager.getAllChildRecords(),
            stats: consensusManager.getConsensusStats()
        });
    }
});

// Get consensus statistics
app.get('/consensus', (req, res) => {
    res.json({
        success: true,
        stats: consensusManager.getConsensusStats(),
        votes: Object.fromEntries(consensusManager.consensusVotes),
        pendingBlocks: Array.from(consensusManager.pendingBlocks.keys())
    });
});

// Trigger rollback (admin only)
app.post('/rollback', async (req, res) => {
    const { blockHash } = req.body;
    
    if (!blockHash) {
        return res.status(400).json({
            success: false,
            message: 'Block hash is required'
        });
    }

    try {
        const rollbackResult = await consensusManager.handleRollback(blockHash, p2pNetwork);
        
        if (rollbackResult) {
            res.json({
                success: true,
                message: 'Rollback completed successfully',
                blockHash: blockHash
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Rollback failed'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Rollback error: ' + error.message
        });
    }
});

// Get rollback history
app.get('/rollback-history', (req, res) => {
    res.json({
        success: true,
        rollbackHistory: consensusManager.rollbackHistory
    });
});

// Request block from peer
app.post('/request-block', (req, res) => {
    const { peerId, blockIndex } = req.body;
    
    if (!peerId || blockIndex === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Peer ID and block index are required'
        });
    }

    const success = p2pNetwork.requestBlock(peerId, blockIndex);
    
    res.json({
        success: success,
        message: success ? 'Block request sent' : 'Failed to send block request'
    });
});

// Initialize all components
async function initialize() {
    try {
        // Initialize P2P network
        await p2pNetwork.initialize();

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

            consensusManager.addBlock(block);
        });

        // Handle block propagation
        p2pNetwork.on('block_propagation', async (data, peerId) => {
            console.log(`Received block propagation from peer ${peerId}`);
            await consensusManager.handleBlockPropagation(data.block, p2pNetwork);
        });

        // Handle consensus votes
        p2pNetwork.on('consensus_vote', (data, peerId) => {
            console.log(`Received consensus vote from peer ${peerId}`);
            consensusManager.handleConsensusVote(data, p2pNetwork);
        });

        // Handle rollback notifications
        p2pNetwork.on('rollback_notification', (data, peerId) => {
            console.log(`Received rollback notification from peer ${peerId}`);
            consensusManager.handleRollbackNotification(data);
        });

        // Handle block requests
        p2pNetwork.on('block_request', (data, peerId) => {
            console.log(`Block request from peer ${peerId} for block ${data.blockIndex}`);
            const requestedBlock = consensusManager.blockchain[data.blockIndex];
            if (requestedBlock) {
                p2pNetwork.sendBlockResponse(peerId, requestedBlock);
            }
        });

        // Handle block responses
        p2pNetwork.on('block_response', (data, peerId) => {
            console.log(`Received block response from peer ${peerId}`);
            const block = new Block(
                data.block.index, data.block.timestamp, data.block.transactions,
                data.block.previousHash, data.block.leader
            );
            block.hash = data.block.hash;
            block.signature = data.block.signature;
            block.merkleRoot = data.block.merkleRoot;
            
            consensusManager.addBlock(block);
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
