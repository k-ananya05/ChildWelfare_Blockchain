const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

class Web3Service {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.contractAddress = null;
        this.account = null;
        this.isConnected = false;
        this.contractABI = null;
    }

    // Initialize Web3 connection
    async initialize(providerUrl = 'http://localhost:8545', contractAddress = null) {
        try {
            console.log('🔗 Initializing Web3 connection...');
            
            // Initialize Web3
            this.web3 = new Web3(providerUrl);
            
            // Check connection
            const isConnected = await this.web3.eth.net.isListening();
            if (!isConnected) {
                throw new Error('Failed to connect to Ethereum node');
            }
            
            console.log('✅ Connected to Ethereum node');
            
            // Load contract ABI
            await this.loadContractABI();
            
            // Set contract address if provided
            if (contractAddress) {
                this.contractAddress = contractAddress;
                await this.loadContract();
            }
            
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('❌ Web3 initialization failed:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    // Load contract ABI from compiled artifacts
    async loadContractABI() {
        try {
            // Try to load from Hardhat artifacts
            const artifactsPath = path.join(__dirname, '../artifacts/contracts/ChildWelfare.sol/ChildWelfare.json');
            
            if (fs.existsSync(artifactsPath)) {
                const artifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
                this.contractABI = artifact.abi;
                console.log('✅ Contract ABI loaded from artifacts');
            } else {
                // Fallback to hardcoded ABI (simplified version)
                this.contractABI = this.getSimplifiedABI();
                console.log('⚠️ Using simplified ABI (artifacts not found)');
            }
        } catch (error) {
            console.error('❌ Failed to load contract ABI:', error.message);
            this.contractABI = this.getSimplifiedABI();
        }
    }

    // Load contract instance
    async loadContract(contractAddress = null) {
        if (contractAddress) {
            this.contractAddress = contractAddress;
        }
        
        if (!this.contractAddress || !this.contractABI) {
            throw new Error('Contract address or ABI not available');
        }
        
        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
        console.log(`✅ Contract loaded at address: ${this.contractAddress}`);
    }

    // Set account for transactions
    setAccount(privateKey) {
        try {
            const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
            this.web3.eth.accounts.wallet.add(account);
            this.account = account.address;
            console.log(`✅ Account set: ${this.account}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to set account:', error.message);
            return false;
        }
    }

    // Get account balance
    async getBalance(address = null) {
        try {
            const targetAddress = address || this.account;
            if (!targetAddress) {
                throw new Error('No address provided');
            }
            
            const balance = await this.web3.eth.getBalance(targetAddress);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('❌ Failed to get balance:', error.message);
            return '0';
        }
    }

    // Get network information
    async getNetworkInfo() {
        try {
            const networkId = await this.web3.eth.net.getId();
            const blockNumber = await this.web3.eth.getBlockNumber();
            const gasPrice = await this.web3.eth.getGasPrice();
            
            return {
                networkId: networkId,
                blockNumber: blockNumber,
                gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei'),
                isConnected: this.isConnected,
                contractAddress: this.contractAddress,
                account: this.account
            };
        } catch (error) {
            console.error('❌ Failed to get network info:', error.message);
            return null;
        }
    }

    // Contract interaction methods
    async createRecord(name, age, healthStatus, location, guardian, metadata = '') {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Contract or account not initialized');
            }

            console.log('📝 Creating child record...');
            
            const tx = this.contract.methods.createRecord(
                name,
                age,
                healthStatus,
                location,
                guardian,
                metadata
            );

            const gasEstimate = await tx.estimateGas({ from: this.account });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: this.account,
                gas: gasEstimate,
                gasPrice: gasPrice
            });

            // Safely extract recordId from event; fallback to contract state
            let recordId = null;
            if (result && result.events && result.events.RecordCreated && result.events.RecordCreated.returnValues) {
                recordId = parseInt(result.events.RecordCreated.returnValues.recordId);
            } else {
                try {
                    const count = await this.contract.methods.recordCount().call();
                    recordId = parseInt(count);
                } catch (_) {
                    // ignore; recordId will remain null
                }
            }

            console.log('✅ Record created successfully');
            return {
                success: true,
                transactionHash: result.transactionHash,
                recordId: recordId,
                blockNumber: result.blockNumber
            };
        } catch (error) {
            console.error('❌ Failed to create record:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateRecord(recordId, field, newValue, reason) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Contract or account not initialized');
            }

            console.log(`📝 Updating record ${recordId}...`);
            
            const tx = this.contract.methods.updateRecord(
                recordId,
                field,
                newValue,
                reason
            );

            const gasEstimate = await tx.estimateGas({ from: this.account });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: this.account,
                gas: gasEstimate,
                gasPrice: gasPrice
            });

            console.log('✅ Record updated successfully');
            return {
                success: true,
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            };
        } catch (error) {
            console.error('❌ Failed to update record:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async transferGuardianship(recordId, newGuardian, reason) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Contract or account not initialized');
            }

            console.log(`🔄 Transferring guardianship for record ${recordId}...`);
            
            const tx = this.contract.methods.transferGuardianship(
                recordId,
                newGuardian,
                reason
            );

            const gasEstimate = await tx.estimateGas({ from: this.account });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: this.account,
                gas: gasEstimate,
                gasPrice: gasPrice
            });

            console.log('✅ Guardianship transferred successfully');
            return {
                success: true,
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            };
        } catch (error) {
            console.error('❌ Failed to transfer guardianship:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deactivateRecord(recordId, reason) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Contract or account not initialized');
            }

            console.log(`🚫 Deactivating record ${recordId}...`);
            
            const tx = this.contract.methods.deactivateRecord(
                recordId,
                reason
            );

            const gasEstimate = await tx.estimateGas({ from: this.account });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: this.account,
                gas: gasEstimate,
                gasPrice: gasPrice
            });

            console.log('✅ Record deactivated successfully');
            return {
                success: true,
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            };
        } catch (error) {
            console.error('❌ Failed to deactivate record:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // View methods (no gas required)
    async getRecord(recordId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const record = await this.contract.methods.getRecord(recordId).call();
            return {
                success: true,
                record: this.formatRecord(record)
            };
        } catch (error) {
            console.error('❌ Failed to get record:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAllRecords() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const records = await this.contract.methods.getAllRecords().call();
            return {
                success: true,
                records: records.map(record => this.formatRecord(record))
            };
        } catch (error) {
            console.error('❌ Failed to get all records:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getActiveRecords() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const records = await this.contract.methods.getActiveRecords().call();
            return {
                success: true,
                records: records.map(record => this.formatRecord(record))
            };
        } catch (error) {
            console.error('❌ Failed to get active records:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getRecordHistory(recordId) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const history = await this.contract.methods.getRecordHistory(recordId).call();
            return {
                success: true,
                history: history.map(item => this.formatHistoryItem(item))
            };
        } catch (error) {
            console.error('❌ Failed to get record history:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getRecordCount() {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const count = await this.contract.methods.recordCount().call();
            return {
                success: true,
                count: parseInt(count)
            };
        } catch (error) {
            console.error('❌ Failed to get record count:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Role management
    async grantRole(role, account) {
        try {
            if (!this.contract || !this.account) {
                throw new Error('Contract or account not initialized');
            }

            console.log(`🔐 Granting role ${role} to ${account}...`);
            
            const tx = this.contract.methods.grantRole(role, account);

            const gasEstimate = await tx.estimateGas({ from: this.account });
            const gasPrice = await this.web3.eth.getGasPrice();

            const result = await tx.send({
                from: this.account,
                gas: gasEstimate,
                gasPrice: gasPrice
            });

            console.log('✅ Role granted successfully');
            return {
                success: true,
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber
            };
        } catch (error) {
            console.error('❌ Failed to grant role:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility methods
    formatRecord(record) {
        return {
            id: parseInt(record.id),
            name: record.name,
            age: parseInt(record.age),
            healthStatus: record.healthStatus,
            location: record.location,
            guardian: record.guardian,
            status: record.status,
            createdAt: new Date(parseInt(record.createdAt) * 1000).toISOString(),
            lastUpdatedAt: new Date(parseInt(record.lastUpdatedAt) * 1000).toISOString(),
            createdBy: record.createdBy,
            lastUpdatedBy: record.lastUpdatedBy,
            isActive: record.isActive,
            metadata: record.metadata
        };
    }

    formatHistoryItem(item) {
        return {
            recordId: parseInt(item.recordId),
            action: item.action,
            actor: item.actor,
            oldValue: item.oldValue,
            newValue: item.newValue,
            timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString(),
            reason: item.reason
        };
    }

    // Get role constants
    getRoles() {
        return {
            NGO_ROLE: this.web3.utils.keccak256('NGO_ROLE'),
            GOVERNMENT_ROLE: this.web3.utils.keccak256('GOVERNMENT_ROLE'),
            HOSPITAL_ROLE: this.web3.utils.keccak256('HOSPITAL_ROLE'),
            AUDITOR_ROLE: this.web3.utils.keccak256('AUDITOR_ROLE'),
            ADMIN_ROLE: this.web3.utils.keccak256('ADMIN_ROLE')
        };
    }

    // Simplified ABI for fallback
    getSimplifiedABI() {
        return [
            {
                "inputs": [
                    {"internalType": "string", "name": "_name", "type": "string"},
                    {"internalType": "uint256", "name": "_age", "type": "uint256"},
                    {"internalType": "string", "name": "_healthStatus", "type": "string"},
                    {"internalType": "string", "name": "_location", "type": "string"},
                    {"internalType": "string", "name": "_guardian", "type": "string"},
                    {"internalType": "string", "name": "_metadata", "type": "string"}
                ],
                "name": "createRecord",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "_recordId", "type": "uint256"}],
                "name": "getRecord",
                "outputs": [
                    {
                        "components": [
                            {"internalType": "uint256", "name": "id", "type": "uint256"},
                            {"internalType": "string", "name": "name", "type": "string"},
                            {"internalType": "uint256", "name": "age", "type": "uint256"},
                            {"internalType": "string", "name": "healthStatus", "type": "string"},
                            {"internalType": "string", "name": "location", "type": "string"},
                            {"internalType": "string", "name": "guardian", "type": "string"},
                            {"internalType": "string", "name": "status", "type": "string"},
                            {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
                            {"internalType": "uint256", "name": "lastUpdatedAt", "type": "uint256"},
                            {"internalType": "address", "name": "createdBy", "type": "address"},
                            {"internalType": "address", "name": "lastUpdatedBy", "type": "address"},
                            {"internalType": "bool", "name": "isActive", "type": "bool"},
                            {"internalType": "string", "name": "metadata", "type": "string"}
                        ],
                        "internalType": "struct ChildWelfare.ChildRecord",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getAllRecords",
                "outputs": [
                    {
                        "components": [
                            {"internalType": "uint256", "name": "id", "type": "uint256"},
                            {"internalType": "string", "name": "name", "type": "string"},
                            {"internalType": "uint256", "name": "age", "type": "uint256"},
                            {"internalType": "string", "name": "healthStatus", "type": "string"},
                            {"internalType": "string", "name": "location", "type": "string"},
                            {"internalType": "string", "name": "guardian", "type": "string"},
                            {"internalType": "string", "name": "status", "type": "string"},
                            {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
                            {"internalType": "uint256", "name": "lastUpdatedAt", "type": "uint256"},
                            {"internalType": "address", "name": "createdBy", "type": "address"},
                            {"internalType": "address", "name": "lastUpdatedBy", "type": "address"},
                            {"internalType": "bool", "name": "isActive", "type": "bool"},
                            {"internalType": "string", "name": "metadata", "type": "string"}
                        ],
                        "internalType": "struct ChildWelfare.ChildRecord[]",
                        "name": "",
                        "type": "tuple[]"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "recordCount",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];
    }
}

module.exports = Web3Service;
