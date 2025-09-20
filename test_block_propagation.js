const axios = require('axios');

// Test configuration
const NODE_URLS = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
];

// Test data
const testTransactions = [
    {
        id: 'tx_001',
        from: 'NGO_001',
        to: 'Government_001',
        amount: 0,
        action: 'create_record',
        childRecordId: 'child_001',
        data: {
            name: 'John Doe',
            age: 8,
            location: 'New York',
            status: 'in_care'
        }
    },
    {
        id: 'tx_002',
        from: 'Hospital_001',
        to: 'NGO_001',
        amount: 0,
        action: 'update_record',
        childRecordId: 'child_001',
        data: {
            medicalStatus: 'healthy',
            lastCheckup: Date.now()
        }
    },
    {
        id: 'tx_003',
        from: 'Government_001',
        to: 'FosterFamily_001',
        amount: 0,
        action: 'transfer_guardianship',
        childRecordId: 'child_001',
        data: {
            transferReason: 'foster_care_placement',
            newGuardian: 'FosterFamily_001'
        }
    }
];

class BlockPropagationTester {
    constructor() {
        this.results = [];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkNodeHealth(nodeUrl) {
        try {
            const response = await axios.get(`${nodeUrl}/health`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to check health for ${nodeUrl}:`, error.message);
            return null;
        }
    }

    async addTransaction(nodeUrl, transaction) {
        try {
            const response = await axios.post(`${nodeUrl}/transaction`, transaction);
            console.log(`✅ Transaction ${transaction.id} added to ${nodeUrl}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to add transaction to ${nodeUrl}:`, error.message);
            return null;
        }
    }

    async createBlock(nodeUrl) {
        try {
            const response = await axios.post(`${nodeUrl}/block`);
            console.log(`✅ Block created on ${nodeUrl}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to create block on ${nodeUrl}:`, error.message);
            return null;
        }
    }

    async getConsensusStats(nodeUrl) {
        try {
            const response = await axios.get(`${nodeUrl}/consensus`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to get consensus stats from ${nodeUrl}:`, error.message);
            return null;
        }
    }

    async getLedgerState(nodeUrl) {
        try {
            const response = await axios.get(`${nodeUrl}/ledger`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to get ledger state from ${nodeUrl}:`, error.message);
            return null;
        }
    }

    async testBlockPropagation() {
        console.log('🚀 Starting Block Propagation and Ledger Update Test\n');

        // Step 1: Check all nodes are healthy
        console.log('📊 Step 1: Checking node health...');
        for (const nodeUrl of NODE_URLS) {
            const health = await this.checkNodeHealth(nodeUrl);
            if (health) {
                console.log(`✅ ${nodeUrl} - Role: ${health.nodeRole}, Leader: ${health.currentLeader}, Blockchain: ${health.blockchainLength} blocks`);
            }
        }

        // Step 2: Add transactions to the first node
        console.log('\n📝 Step 2: Adding test transactions...');
        for (const transaction of testTransactions) {
            await this.addTransaction(NODE_URLS[0], transaction);
            await this.delay(1000); // Wait between transactions
        }

        // Step 3: Create a block (if first node is leader)
        console.log('\n🔨 Step 3: Creating block...');
        const blockResult = await this.createBlock(NODE_URLS[0]);
        if (blockResult && blockResult.success) {
            console.log(`✅ Block ${blockResult.block.index} created and propagated`);
        }

        // Step 4: Wait for consensus and propagation
        console.log('\n⏳ Step 4: Waiting for consensus and propagation...');
        await this.delay(5000);

        // Step 5: Check consensus status on all nodes
        console.log('\n🗳️ Step 5: Checking consensus status...');
        for (const nodeUrl of NODE_URLS) {
            const consensusStats = await this.getConsensusStats(nodeUrl);
            if (consensusStats) {
                console.log(`📊 ${nodeUrl} - Pending blocks: ${consensusStats.stats.pendingBlocks}, Votes: ${consensusStats.stats.consensusVotes}`);
            }
        }

        // Step 6: Check ledger state on all nodes
        console.log('\n📚 Step 6: Checking ledger state...');
        for (const nodeUrl of NODE_URLS) {
            const ledgerState = await this.getLedgerState(nodeUrl);
            if (ledgerState) {
                console.log(`📖 ${nodeUrl} - Records: ${ledgerState.records.length}`);
                if (ledgerState.records.length > 0) {
                    console.log(`   Sample record: ${JSON.stringify(ledgerState.records[0], null, 2)}`);
                }
            }
        }

        // Step 7: Final health check
        console.log('\n🏁 Step 7: Final health check...');
        for (const nodeUrl of NODE_URLS) {
            const health = await this.checkNodeHealth(nodeUrl);
            if (health) {
                console.log(`✅ ${nodeUrl} - Blockchain: ${health.blockchainLength} blocks, Ledger: ${health.stats.ledger.totalRecords} records`);
            }
        }

        console.log('\n🎉 Block propagation and ledger update test completed!');
    }

    async testRollback() {
        console.log('\n🔄 Testing rollback functionality...');
        
        // Get current blockchain length
        const health = await this.checkNodeHealth(NODE_URLS[0]);
        if (!health || health.blockchainLength === 0) {
            console.log('❌ No blocks to rollback');
            return;
        }

        // Get the last block hash
        const blockchainResponse = await axios.get(`${NODE_URLS[0]}/blockchain`);
        const lastBlock = blockchainResponse.data.blocks[blockchainResponse.data.blocks.length - 1];
        
        console.log(`🔄 Attempting rollback of block ${lastBlock.index} (${lastBlock.hash})`);
        
        // Trigger rollback
        try {
            const rollbackResponse = await axios.post(`${NODE_URLS[0]}/rollback`, {
                blockHash: lastBlock.hash
            });
            
            if (rollbackResponse.data.success) {
                console.log('✅ Rollback completed successfully');
            } else {
                console.log('❌ Rollback failed:', rollbackResponse.data.message);
            }
        } catch (error) {
            console.error('❌ Rollback error:', error.message);
        }

        // Check final state
        await this.delay(2000);
        const finalHealth = await this.checkNodeHealth(NODE_URLS[0]);
        if (finalHealth) {
            console.log(`📊 Final state - Blockchain: ${finalHealth.blockchainLength} blocks, Rollback history: ${finalHealth.stats.ledger.rollbackHistory}`);
        }
    }
}

// Run the test
async function runTests() {
    const tester = new BlockPropagationTester();
    
    try {
        await tester.testBlockPropagation();
        await tester.testRollback();
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Check if running directly
if (require.main === module) {
    runTests();
}

module.exports = BlockPropagationTester;
