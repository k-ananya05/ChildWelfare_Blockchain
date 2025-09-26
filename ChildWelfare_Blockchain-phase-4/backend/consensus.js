const crypto = require('crypto');

// Block structure
class Block {
    constructor(index, timestamp, transactions, previousHash, leader) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.leader = leader;
        this.merkleRoot = this.calculateMerkleRoot(transactions);
        this.hash = this.calculateHash();
        this.signature = null;
    }

    calculateHash() {
        const blockData = JSON.stringify({
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions,
            previousHash: this.previousHash,
            leader: this.leader,
            merkleRoot: this.merkleRoot
        });

        return crypto.createHash('sha256').update(blockData).digest('hex');
    }

    calculateMerkleRoot(transactions) {
        if (transactions.length === 0) return '0';

        let hashes = transactions.map(tx => tx.hash || tx.id);

        while (hashes.length > 1) {
            const newHashes = [];

            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = hashes[i + 1] || left; // Duplicate last hash if odd number
                const combined = left + right;
                const hash = crypto.createHash('sha256').update(combined).digest('hex');
                newHashes.push(hash);
            }

            hashes = newHashes;
        }

        return hashes[0];
    }

    sign(privateKey) {
        this.signature = crypto.createHash('sha256')
            .update(this.hash + privateKey)
            .digest('hex');
        return this.signature;
    }

    verify() {
        const calculatedHash = this.calculateHash();
        return this.hash === calculatedHash;
    }

    toJSON() {
        return {
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions,
            previousHash: this.previousHash,
            leader: this.leader,
            merkleRoot: this.merkleRoot,
            hash: this.hash,
            signature: this.signature
        };
    }
}

// Consensus manager
class ConsensusManager {
    constructor(nodeId, nodeRole) {
        this.nodeId = nodeId;
        this.nodeRole = nodeRole;
        this.blockchain = [];
        this.pendingTransactions = [];
        this.leader = null;
        this.leaderIndex = 0;

        // Node roles for round-robin
        this.NODE_ROLES = ['NGO', 'Government', 'Hospital', 'Auditor', 'Admin'];
        
        // Block propagation and consensus tracking
        this.pendingBlocks = new Map(); // blockHash -> block data
        this.consensusVotes = new Map(); // blockHash -> {approve: [], reject: []}
        this.blockValidationStatus = new Map(); // blockHash -> validation status
        this.ledgerState = new Map(); // childRecordId -> current state
        this.rollbackHistory = []; // For rollback operations
        this.consensusThreshold = 0.6; // 60% consensus required
        this.maxRollbackDepth = 10; // Maximum blocks to rollback
    }

    // Round-robin leader selection
    selectLeader() {
        this.leader = this.NODE_ROLES[this.leaderIndex];
        this.leaderIndex = (this.leaderIndex + 1) % this.NODE_ROLES.length;

        console.log(`Leader selected: ${this.leader} (Node: ${this.nodeId})`);
        return this.leader;
    }

    // Check if current node is leader
    isLeader() {
        return this.leader === this.nodeRole;
    }

    // Create new block
    createBlock(transactions, previousHash) {
        const block = new Block(
            this.blockchain.length,
            Date.now(),
            transactions,
            previousHash || '0',
            this.leader
        );

        // Sign block if this node is the leader
        if (this.isLeader()) {
            block.sign(this.nodeId); // In production, use actual private key
        }

        return block;
    }

    // Validate block
    validateBlock(block) {
        // Verify block hash
        if (!block.verify()) {
            console.log('Block hash verification failed');
            return false;
        }

        // Verify merkle root
        const calculatedMerkleRoot = block.calculateMerkleRoot(block.transactions);
        if (block.merkleRoot !== calculatedMerkleRoot) {
            console.log('Merkle root verification failed');
            return false;
        }

        // Verify leader signature (simplified)
        if (!block.signature) {
            console.log('Block signature missing');
            return false;
        }

        // Check if block index is correct
        if (block.index !== this.blockchain.length) {
            console.log('Block index mismatch');
            return false;
        }

        // Verify previous hash
        const lastBlock = this.blockchain[this.blockchain.length - 1];
        if (lastBlock && block.previousHash !== lastBlock.hash) {
            console.log('Previous hash mismatch');
            return false;
        }

        return true;
    }

    // Add block to blockchain
    addBlock(block) {
        if (this.validateBlock(block)) {
            this.blockchain.push(block);
            console.log(`Block ${block.index} added to blockchain by ${this.nodeId}`);

            // Remove transactions from pending pool
            block.transactions.forEach(tx => {
                const index = this.pendingTransactions.findIndex(t => t.id === tx.id);
                if (index > -1) {
                    this.pendingTransactions.splice(index, 1);
                }
            });

            return true;
        } else {
            console.log(`Block ${block.index} validation failed`);
            return false;
        }
    }

    // Handle consensus voting (simplified)
    async voteOnBlock(block) {
        const isValid = this.validateBlock(block);

        return {
            nodeId: this.nodeId,
            vote: isValid ? 'approve' : 'reject',
            blockHash: block.hash
        };
    }

    // Get blockchain statistics
    getStats() {
        return {
            length: this.blockchain.length,
            lastBlock: this.blockchain[this.blockchain.length - 1],
            pendingTransactions: this.pendingTransactions.length,
            currentLeader: this.leader,
            isCurrentNodeLeader: this.isLeader()
        };
    }

    // Consensus failure handling
    handleLeaderFailure() {
        console.log(`Leader ${this.leader} failed, selecting new leader`);
        this.selectLeader();
        return this.leader;
    }

    // Synchronize blockchain with peer
    syncWithPeer(peerBlockchain) {
        if (peerBlockchain.length > this.blockchain.length) {
            console.log(`Synchronizing blockchain with peer. Peer has ${peerBlockchain.length} blocks, we have ${this.blockchain.length}`);

            // Validate the longer chain
            let isValid = true;
            for (let i = this.blockchain.length; i < peerBlockchain.length; i++) {
                if (!this.validateBlock(peerBlockchain[i])) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                this.blockchain = peerBlockchain;
                this.updateLedgerState();
                console.log('Blockchain synchronized successfully');
                return true;
            } else {
                console.log('Peer blockchain validation failed');
                return false;
            }
        }

        return false;
    }

    // Handle block propagation from other nodes
    async handleBlockPropagation(blockData, p2pNetwork) {
        const block = new Block(
            blockData.index,
            blockData.timestamp,
            blockData.transactions,
            blockData.previousHash,
            blockData.leader
        );
        block.hash = blockData.hash;
        block.signature = blockData.signature;
        block.merkleRoot = blockData.merkleRoot;

        console.log(`Received block ${block.index} for propagation`);

        // Store pending block
        this.pendingBlocks.set(block.hash, {
            block: block,
            receivedAt: Date.now(),
            validators: new Set()
        });

        // Validate block
        const validationResult = this.validateBlock(block);
        
        if (validationResult) {
            // Vote to approve
            this.castConsensusVote(block.hash, 'approve', 'Block validation passed');
            p2pNetwork.broadcastConsensusVote(block.hash, 'approve', 'Block validation passed');
        } else {
            // Vote to reject
            this.castConsensusVote(block.hash, 'reject', 'Block validation failed');
            p2pNetwork.broadcastConsensusVote(block.hash, 'reject', 'Block validation failed');
        }

        return validationResult;
    }

    // Cast consensus vote
    castConsensusVote(blockHash, vote, reason = '') {
        if (!this.consensusVotes.has(blockHash)) {
            this.consensusVotes.set(blockHash, { approve: [], reject: [] });
        }

        const votes = this.consensusVotes.get(blockHash);
        
        // Remove existing vote from this node
        votes.approve = votes.approve.filter(v => v.voter !== this.nodeId);
        votes.reject = votes.reject.filter(v => v.voter !== this.nodeId);

        // Add new vote
        const voteData = {
            voter: this.nodeId,
            vote: vote,
            reason: reason,
            timestamp: Date.now()
        };

        if (vote === 'approve') {
            votes.approve.push(voteData);
        } else {
            votes.reject.push(voteData);
        }

        console.log(`Cast ${vote} vote for block ${blockHash}`);
        return voteData;
    }

    // Handle consensus vote from other nodes
    handleConsensusVote(voteData, p2pNetwork) {
        const { blockHash, vote, reason, voter } = voteData;
        
        if (!this.consensusVotes.has(blockHash)) {
            this.consensusVotes.set(blockHash, { approve: [], reject: [] });
        }

        const votes = this.consensusVotes.get(blockHash);
        
        // Remove existing vote from this voter
        votes.approve = votes.approve.filter(v => v.voter !== voter);
        votes.reject = votes.reject.filter(v => v.voter !== voter);

        // Add new vote
        const newVote = {
            voter: voter,
            vote: vote,
            reason: reason,
            timestamp: Date.now()
        };

        if (vote === 'approve') {
            votes.approve.push(newVote);
        } else {
            votes.reject.push(newVote);
        }

        console.log(`Received ${vote} vote from ${voter} for block ${blockHash}`);

        // Check if consensus is reached
        this.checkConsensus(blockHash, p2pNetwork);
    }

    // Check if consensus is reached for a block
    checkConsensus(blockHash, p2pNetwork) {
        const votes = this.consensusVotes.get(blockHash);
        if (!votes) return;

        const totalVotes = votes.approve.length + votes.reject.length;
        const approvalRate = votes.approve.length / totalVotes;

        console.log(`Consensus check for block ${blockHash}: ${votes.approve.length} approve, ${votes.reject.length} reject (${(approvalRate * 100).toFixed(1)}% approval)`);

        if (approvalRate >= this.consensusThreshold) {
            // Consensus reached - add block to blockchain
            const pendingBlock = this.pendingBlocks.get(blockHash);
            if (pendingBlock) {
                this.addBlockToLedger(pendingBlock.block);
                this.pendingBlocks.delete(blockHash);
                console.log(`✅ Consensus reached for block ${blockHash} - added to ledger`);
            }
        } else if (votes.reject.length > votes.approve.length && totalVotes >= 3) {
            // Consensus to reject - remove from pending
            this.pendingBlocks.delete(blockHash);
            console.log(`❌ Consensus to reject block ${blockHash}`);
        }
    }

    // Add block to ledger and update state
    addBlockToLedger(block) {
        // Add to blockchain
        this.blockchain.push(block);
        
        // Update ledger state based on transactions
        this.updateLedgerFromBlock(block);
        
        // Remove transactions from pending pool
        block.transactions.forEach(tx => {
            const index = this.pendingTransactions.findIndex(t => t.id === tx.id);
            if (index > -1) {
                this.pendingTransactions.splice(index, 1);
            }
        });

        console.log(`Block ${block.index} added to ledger and state updated`);
    }

    // Update ledger state from block transactions
    updateLedgerFromBlock(block) {
        block.transactions.forEach(tx => {
            if (tx.action === 'create_record') {
                this.ledgerState.set(tx.childRecordId, {
                    id: tx.childRecordId,
                    createdBy: tx.from,
                    createdAt: tx.timestamp,
                    data: tx.data,
                    blockIndex: block.index
                });
            } else if (tx.action === 'update_record') {
                const existingRecord = this.ledgerState.get(tx.childRecordId);
                if (existingRecord) {
                    this.ledgerState.set(tx.childRecordId, {
                        ...existingRecord,
                        ...tx.data,
                        lastUpdatedBy: tx.from,
                        lastUpdatedAt: tx.timestamp,
                        blockIndex: block.index
                    });
                }
            } else if (tx.action === 'transfer_guardianship') {
                const existingRecord = this.ledgerState.get(tx.childRecordId);
                if (existingRecord) {
                    this.ledgerState.set(tx.childRecordId, {
                        ...existingRecord,
                        guardian: tx.to,
                        transferredBy: tx.from,
                        transferredAt: tx.timestamp,
                        blockIndex: block.index
                    });
                }
            }
        });
    }

    // Update entire ledger state from blockchain
    updateLedgerState() {
        this.ledgerState.clear();
        
        this.blockchain.forEach(block => {
            this.updateLedgerFromBlock(block);
        });
        
        console.log(`Ledger state updated from ${this.blockchain.length} blocks`);
    }

    // Handle rollback if invalid block received
    async handleRollback(invalidBlockHash, p2pNetwork) {
        console.log(`Initiating rollback for invalid block ${invalidBlockHash}`);
        
        // Find the invalid block in blockchain
        const invalidBlockIndex = this.blockchain.findIndex(block => block.hash === invalidBlockHash);
        
        if (invalidBlockIndex === -1) {
            console.log('Invalid block not found in blockchain');
            return false;
        }

        // Check rollback depth
        const rollbackDepth = this.blockchain.length - invalidBlockIndex;
        if (rollbackDepth > this.maxRollbackDepth) {
            console.log(`Rollback depth ${rollbackDepth} exceeds maximum ${this.maxRollbackDepth}`);
            return false;
        }

        // Store rollback history
        this.rollbackHistory.push({
            timestamp: Date.now(),
            invalidBlockHash: invalidBlockHash,
            rollbackDepth: rollbackDepth,
            blocksRemoved: this.blockchain.slice(invalidBlockIndex)
        });

        // Remove invalid block and all subsequent blocks
        const removedBlocks = this.blockchain.splice(invalidBlockIndex);
        
        // Update ledger state
        this.updateLedgerState();
        
        // Broadcast rollback to peers
        p2pNetwork.broadcast({
            type: 'rollback_notification',
            data: {
                invalidBlockHash: invalidBlockHash,
                rollbackDepth: rollbackDepth,
                newBlockchainLength: this.blockchain.length,
                timestamp: Date.now(),
                initiator: this.nodeId
            }
        });

        console.log(`✅ Rollback completed: removed ${removedBlocks.length} blocks`);
        return true;
    }

    // Handle rollback notification from other nodes
    handleRollbackNotification(rollbackData) {
        const { invalidBlockHash, rollbackDepth, newBlockchainLength } = rollbackData;
        
        console.log(`Received rollback notification for block ${invalidBlockHash}`);
        
        // Check if we have the invalid block
        const invalidBlockIndex = this.blockchain.findIndex(block => block.hash === invalidBlockHash);
        
        if (invalidBlockIndex !== -1) {
            // Perform rollback
            this.blockchain.splice(invalidBlockIndex);
            this.updateLedgerState();
            console.log(`✅ Rollback applied: removed blocks from index ${invalidBlockIndex}`);
        }
    }

    // Get ledger state for a specific child record
    getChildRecord(childRecordId) {
        return this.ledgerState.get(childRecordId);
    }

    // Get all child records
    getAllChildRecords() {
        return Array.from(this.ledgerState.values());
    }

    // Get consensus statistics
    getConsensusStats() {
        return {
            pendingBlocks: this.pendingBlocks.size,
            consensusVotes: this.consensusVotes.size,
            ledgerRecords: this.ledgerState.size,
            rollbackHistory: this.rollbackHistory.length,
            consensusThreshold: this.consensusThreshold
        };
    }
}

module.exports = {
    Block,
    ConsensusManager
};
