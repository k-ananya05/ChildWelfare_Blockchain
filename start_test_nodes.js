const { spawn } = require('child_process');
const path = require('path');

// Configuration for test nodes
const NODES = [
    { port: 3001, role: 'NGO' },
    { port: 3002, role: 'Government' },
    { port: 3003, role: 'Hospital' }
];

class TestNodeManager {
    constructor() {
        this.processes = [];
    }

    startNode(port, role) {
        console.log(`🚀 Starting node on port ${port} with role ${role}`);
        
        const env = {
            ...process.env,
            PORT: port,
            NODE_ROLE: role
        };

        const process = spawn('node', ['backend/server.js'], {
            env: env,
            stdio: 'pipe',
            cwd: __dirname
        });

        process.stdout.on('data', (data) => {
            console.log(`[${role}:${port}] ${data.toString().trim()}`);
        });

        process.stderr.on('data', (data) => {
            console.error(`[${role}:${port}] ERROR: ${data.toString().trim()}`);
        });

        process.on('close', (code) => {
            console.log(`[${role}:${port}] Process exited with code ${code}`);
        });

        this.processes.push({ process, port, role });
        return process;
    }

    startAllNodes() {
        console.log('🌟 Starting all test nodes...\n');
        
        NODES.forEach(({ port, role }) => {
            this.startNode(port, role);
        });

        console.log('\n⏳ Waiting for nodes to initialize...');
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('✅ All nodes should be running now!');
                console.log('\n📋 Node URLs:');
                NODES.forEach(({ port, role }) => {
                    console.log(`   ${role}: http://localhost:${port}`);
                });
                console.log('\n🧪 Run the test with: node test_block_propagation.js');
                resolve();
            }, 5000);
        });
    }

    stopAllNodes() {
        console.log('\n🛑 Stopping all nodes...');
        this.processes.forEach(({ process, port, role }) => {
            console.log(`Stopping ${role} on port ${port}`);
            process.kill('SIGINT');
        });
    }

    async connectNodes() {
        console.log('\n🔗 Connecting nodes to each other...');
        
        // Wait a bit for nodes to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Connect nodes in a chain: 3001 -> 3002 -> 3003
        for (let i = 0; i < NODES.length - 1; i++) {
            const currentPort = NODES[i].port;
            const nextPort = NODES[i + 1].port;
            const p2pPort = nextPort + 1000;
            
            try {
                const axios = require('axios');
                // This would require implementing a connect endpoint
                console.log(`Connecting node ${currentPort} to ${nextPort} (P2P: ${p2pPort})`);
            } catch (error) {
                console.log('Note: Manual P2P connection may be required');
            }
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    if (global.nodeManager) {
        global.nodeManager.stopAllNodes();
    }
    process.exit(0);
});

// Start nodes if running directly
if (require.main === module) {
    const nodeManager = new TestNodeManager();
    global.nodeManager = nodeManager;
    
    nodeManager.startAllNodes()
        .then(() => nodeManager.connectNodes())
        .catch(error => {
            console.error('❌ Failed to start nodes:', error);
            nodeManager.stopAllNodes();
        });
}

module.exports = TestNodeManager;
