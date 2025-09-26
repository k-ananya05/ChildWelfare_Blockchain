const crypto = require('crypto');

// Transaction class
class Transaction {
    constructor(id, from, to, amount, data = {}, signature = null) {
        this.id = id || this.generateId();
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.data = data;
        this.timestamp = Date.now();
        this.signature = signature;
        this.status = 'pending'; // pending, confirmed, failed
    }

    generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    // Sign transaction with private key (simplified for demo)
    sign(privateKey) {
        const txData = JSON.stringify({
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            data: this.data,
            timestamp: this.timestamp
        });

        this.signature = crypto.createHash('sha256').update(txData).digest('hex');
        return this.signature;
    }

    // Verify transaction signature
    verify() {
        if (!this.signature) return false;

        const txData = JSON.stringify({
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            data: this.data,
            timestamp: this.timestamp
        });

        const expectedSignature = crypto.createHash('sha256').update(txData).digest('hex');
        return this.signature === expectedSignature;
    }

    // Convert to JSON for storage/transmission
    toJSON() {
        return {
            id: this.id,
            from: this.from,
            to: this.to,
            amount: this.amount,
            data: this.data,
            timestamp: this.timestamp,
            signature: this.signature,
            status: this.status
        };
    }
}

// Mempool class for managing pending transactions
class Mempool {
    constructor(maxSize = 1000) {
        this.transactions = new Map();
        this.maxSize = maxSize;
        this.feeIndex = new Map(); // For fee-based ordering
    }

    // Add transaction to mempool
    addTransaction(tx) {
        if (this.transactions.size >= this.maxSize) {
            return { success: false, message: 'Mempool is full' };
        }

        if (this.transactions.has(tx.id)) {
            return { success: false, message: 'Transaction already exists' };
        }

        // Validate transaction
        if (!this.validateTransaction(tx)) {
            return { success: false, message: 'Invalid transaction' };
        }

        this.transactions.set(tx.id, tx);
        tx.status = 'pending';

        console.log(`Transaction ${tx.id} added to mempool`);
        return { success: true, message: 'Transaction added successfully' };
    }

    // Remove transaction from mempool
    removeTransaction(txId) {
        const removed = this.transactions.delete(txId);
        if (removed) {
            console.log(`Transaction ${txId} removed from mempool`);
        }
        return removed;
    }

    // Get transaction by ID
    getTransaction(txId) {
        return this.transactions.get(txId);
    }

    // Get all transactions
    getAllTransactions() {
        return Array.from(this.transactions.values());
    }

    // Get pending transactions (for block creation)
    getPendingTransactions(limit = 10) {
        const pending = Array.from(this.transactions.values())
            .filter(tx => tx.status === 'pending')
            .sort((a, b) => b.timestamp - a.timestamp);

        return pending.slice(0, limit);
    }

    // Validate transaction
    validateTransaction(tx) {
        // Basic validation rules
        if (!tx.id || !tx.from || !tx.to || tx.amount <= 0) {
            return false;
        }

        // Check signature: accept built-in demo signature OR MetaMask message signature
        const hasMetaMaskSig = !!(tx.data && tx.data.ethSignature);
        if (!hasMetaMaskSig) {
            if (!tx.verify()) {
                return false;
            }
        }

        // Enforce child welfare role rules when applicable
        // Only allow certain roles to perform specific actions
        if (tx instanceof ChildWelfareTransaction) {
            if (!tx.validateChildWelfareRules()) {
                return false;
            }
        }

        // Check for double-spending (simplified)
        const existingTx = this.transactions.get(tx.id);
        if (existingTx) {
            return false;
        }

        return true;
    }

    // Clear mempool (after block creation)
    clear() {
        this.transactions.clear();
        this.feeIndex.clear();
        console.log('Mempool cleared');
    }

    // Get mempool size
    size() {
        return this.transactions.size;
    }

    // Get mempool statistics
    getStats() {
        const allTxs = Array.from(this.transactions.values());
        const pending = allTxs.filter(tx => tx.status === 'pending').length;
        const confirmed = allTxs.filter(tx => tx.status === 'confirmed').length;
        const failed = allTxs.filter(tx => tx.status === 'failed').length;

        return {
            total: allTxs.length,
            pending,
            confirmed,
            failed,
            maxSize: this.maxSize
        };
    }
}

// Create child welfare specific transaction types
class ChildWelfareTransaction extends Transaction {
    constructor(id, from, to, amount, action, childRecordId, data = {}) {
        super(id, from, to, amount, {
            action,
            childRecordId,
            ...data
        });
        this.action = action; // 'create_record', 'update_record', 'transfer_guardianship'
        this.childRecordId = childRecordId;
    }

    // Validate child welfare specific rules
    validateChildWelfareRules() {
        // NGO can create records
        if (this.action === 'create_record' && !this.from.includes('NGO')) {
            return false;
        }

        // Only authorized entities can update records
        if (this.action === 'update_record' &&
            !['NGO', 'Government', 'Hospital', 'Admin'].includes(this.from.split('_')[0])) {
            return false;
        }

        // Government or Admin can transfer guardianship
        if (this.action === 'transfer_guardianship' && !(['Government', 'Admin'].includes(this.from.split('_')[0]))) {
            return false;
        }

        // Admin can override records explicitly
        if (this.action === 'override_record' && !this.from.includes('Admin')) {
            return false;
        }

        return true;
    }
}

module.exports = {
    Transaction,
    Mempool,
    ChildWelfareTransaction
};
