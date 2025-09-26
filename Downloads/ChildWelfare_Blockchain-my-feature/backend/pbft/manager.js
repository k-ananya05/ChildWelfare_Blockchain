'use strict';

const crypto = require('crypto');
const EventEmitter = require('events');
const { validateDomainRules } = require('./roles');
const { StateManager } = require('./state');

// Simple PBFT manager skeleton for PREPREPARE → PREPARE → COMMIT → REPLY
class PBFTManager extends EventEmitter {
    constructor(nodeId, totalNodes = 4) {
        super();
        this.nodeId = nodeId;
        this.view = 0; // leader = view % n
        this.totalNodes = totalNodes;
        this.f = Math.floor((totalNodes - 1) / 3);
        this.currentBlock = null;
        this.prepareVotes = new Map(); // blockHash -> Set(nodeId)
        this.commitVotes = new Map();  // blockHash -> Set(nodeId)
        this.stateManager = new StateManager();
        this.sequence = 0;
    }

    getLeaderIndex() {
        return this.view % this.totalNodes;
    }

    digest(block) {
        const payload = JSON.stringify(block);
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    // Primary proposes
    onPrimaryPropose(block) {
        this.sequence = this.stateManager.getNextSequence();
        const hash = this.digest(block);
        this.currentBlock = { block, hash, sequence: this.sequence };
        this.emit('preprepare', { view: this.view, sequence: this.sequence, hash, block });
    }

    // Replica receives PREPREPARE
    onReceivePreprepare({ view, sequence, hash, block }) {
        if (view !== this.view) return; // different view

        // Validate domain and transactions
        for (const tx of block.transactions || []) {
            const v = validateDomainRules(tx);
            if (!v.ok) {
                this.emit('reply', { ok: false, reason: v.reason, txId: tx.id, sequence });
                return; // reject whole block in this demo
            }
        }

        // Broadcast PREPARE
        this.addPrepareVote(hash, this.nodeId);
        this.emit('prepare', { view: this.view, sequence, hash });
    }

    onReceivePrepare({ view, sequence, hash, from }) {
        if (view !== this.view) return;
        this.addPrepareVote(hash, from);
        if (this.hasQuorum(this.prepareVotes.get(hash))) {
            // Broadcast COMMIT
            this.addCommitVote(hash, this.nodeId);
            this.emit('commit', { view: this.view, sequence, hash });
        }
    }

    onReceiveCommit({ view, sequence, hash, from }) {
        if (view !== this.view) return;
        this.addCommitVote(hash, from);
        if (this.hasQuorum(this.commitVotes.get(hash))) {
            // Apply state transitions
            const block = this.currentBlock?.block;
            if (block && block.transactions) {
                for (const tx of block.transactions) {
                    this.stateManager.applyStateTransition(tx);
                }
            }
            
            // Finalize
            this.emit('finalize', { hash, block, sequence });
            this.emit('reply', { ok: true, hash, sequence });
            this.reset(hash);
        }
    }

    hasQuorum(set) {
        return set && set.size >= (2 * this.f + 1);
    }

    addPrepareVote(hash, nodeId) {
        if (!this.prepareVotes.has(hash)) this.prepareVotes.set(hash, new Set());
        this.prepareVotes.get(hash).add(nodeId);
    }

    addCommitVote(hash, nodeId) {
        if (!this.commitVotes.has(hash)) this.commitVotes.set(hash, new Set());
        this.commitVotes.get(hash).add(nodeId);
    }

    reset(hash) {
        this.prepareVotes.delete(hash);
        this.commitVotes.delete(hash);
        this.currentBlock = null;
    }

    // Get current state for debugging
    getState() {
        return {
            view: this.view,
            sequence: this.sequence,
            leader: this.getLeaderIndex(),
            cases: this.stateManager.getAllCases()
        };
    }
}

module.exports = { PBFTManager };


