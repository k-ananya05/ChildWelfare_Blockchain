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
                console.log('Blockchain synchronized successfully');
                return true;
            } else {
                console.log('Peer blockchain validation failed');
                return false;
            }
        }

        return false;
    }
}

module.exports = {
    Block,
    ConsensusManager
};
