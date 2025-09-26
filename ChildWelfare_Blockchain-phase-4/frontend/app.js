// Child Welfare Blockchain Frontend Application
class ChildWelfareApp {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.contractAddress = null;
        this.isConnected = false;
        this.contractABI = null;
        this.backendUrl = 'http://127.0.0.1:3001';
    }

    // Initialize the application
    async init() {
        console.log('🚀 Initializing Child Welfare Blockchain App...');
        this.setupEventListeners();
        await this.loadContractABI();
    }

    // Setup event listeners
    setupEventListeners() {
        // Auto-connect on page load if MetaMask is available
        if (typeof window.ethereum !== 'undefined') {
            this.connectMetaMask();
        }
    }

    // Load contract ABI (simplified version for demo)
    async loadContractABI() {
        // Try to fetch ABI from Hardhat artifacts served by the static server
        try {
            const res = await fetch('/artifacts/contracts/ChildWelfare.sol/ChildWelfare.json');
            if (res.ok) {
                const artifact = await res.json();
                if (artifact && artifact.abi) {
                    this.contractABI = artifact.abi;
                    return;
                }
            }
        } catch (_) {
            // ignore and fall back to inline ABI
        }

        // Fallback inline ABI (subset needed by the UI)
        this.contractABI = [
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
                "inputs": [
                    {"internalType": "uint256", "name": "_recordId", "type": "uint256"},
                    {"internalType": "string", "name": "_field", "type": "string"},
                    {"internalType": "string", "name": "_newValue", "type": "string"},
                    {"internalType": "string", "name": "_reason", "type": "string"}
                ],
                "name": "updateRecord",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "_recordId", "type": "uint256"},
                    {"internalType": "string", "name": "_newGuardian", "type": "string"},
                    {"internalType": "string", "name": "_reason", "type": "string"}
                ],
                "name": "transferGuardianship",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "_recordId", "type": "uint256"},
                    {"internalType": "string", "name": "_reason", "type": "string"}
                ],
                "name": "deactivateRecord",
                "outputs": [],
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
                "outputs": [{"internalType": "tuple[]","name": "","type": "tuple[]","components": [
                    {"internalType":"uint256","name":"id","type":"uint256"},
                    {"internalType":"string","name":"name","type":"string"},
                    {"internalType":"uint256","name":"age","type":"uint256"},
                    {"internalType":"string","name":"healthStatus","type":"string"},
                    {"internalType":"string","name":"location","type":"string"},
                    {"internalType":"string","name":"guardian","type":"string"},
                    {"internalType":"string","name":"status","type":"string"},
                    {"internalType":"uint256","name":"createdAt","type":"uint256"},
                    {"internalType":"uint256","name":"lastUpdatedAt","type":"uint256"},
                    {"internalType":"address","name":"createdBy","type":"address"},
                    {"internalType":"address","name":"lastUpdatedBy","type":"address"},
                    {"internalType":"bool","name":"isActive","type":"bool"},
                    {"internalType":"string","name":"metadata","type":"string"}
                ]}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getActiveRecords",
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

    // Connect to Web3
    async connectWeb3() {
        try {
            const providerUrl = document.getElementById('providerUrl').value;
            const contractAddress = document.getElementById('contractAddress').value;
            const privateKey = document.getElementById('privateKey').value;

            if (!providerUrl) {
                this.showMessage('Please enter a provider URL', 'error');
                return;
            }

            if (!contractAddress) {
                this.showMessage('Please enter a contract address', 'error');
                return;
            }

            // Initialize Web3
            this.web3 = new Web3(providerUrl);
            
            // Check connection
            const isConnected = await this.web3.eth.net.isListening();
            if (!isConnected) {
                throw new Error('Failed to connect to Ethereum node');
            }

            // Set account if private key provided
            if (privateKey) {
                const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
                this.web3.eth.accounts.wallet.add(account);
                this.account = account.address;
            }

            // Load contract
            this.contractAddress = contractAddress;
            this.contract = new this.web3.eth.Contract(this.contractABI, contractAddress);

            this.isConnected = true;
            this.updateConnectionStatus(true);
            await this.updateNetworkInfo();
            
            this.showMessage('Successfully connected to Web3!', 'success');
        } catch (error) {
            console.error('Connection error:', error);
            this.showMessage(`Connection failed: ${error.message}`, 'error');
            this.updateConnectionStatus(false);
        }
    }

    // Connect to MetaMask
    async connectMetaMask() {
        try {
            if (typeof window.ethereum === 'undefined') {
                this.showMessage('MetaMask is not installed. Please install MetaMask to use this feature.', 'error');
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Initialize Web3 with MetaMask provider
            this.web3 = new Web3(window.ethereum);
            this.account = accounts[0];

            this.isConnected = true;
            this.updateConnectionStatus(true);
            await this.updateNetworkInfo();
            
            this.showMessage('Connected to MetaMask!', 'success');
        } catch (error) {
            console.error('MetaMask connection error:', error);
            this.showMessage(`MetaMask connection failed: ${error.message}`, 'error');
        }
    }

    // Update connection status UI
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (connected) {
            statusElement.className = 'status connected';
            statusElement.textContent = `Connected to Ethereum network (Account: ${this.account || 'Not set'})`;
        } else {
            statusElement.className = 'status disconnected';
            statusElement.textContent = 'Not connected to Ethereum network';
        }
    }

    // Update network information
    async updateNetworkInfo() {
        if (!this.web3) return;

        try {
            const networkId = await this.web3.eth.net.getId();
            const blockNumber = await this.web3.eth.getBlockNumber();
            const gasPrice = await this.web3.eth.getGasPrice();
            const balance = this.account ? await this.web3.eth.getBalance(this.account) : '0';

            const networkInfo = document.getElementById('networkInfo');
            const networkDetails = document.getElementById('networkDetails');
            
            networkDetails.innerHTML = `
                <div class="detail-item">
                    <div class="detail-label">Network ID</div>
                    <div class="detail-value">${networkId}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Block Number</div>
                    <div class="detail-value">${blockNumber}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Gas Price</div>
                    <div class="detail-value">${this.web3.utils.fromWei(gasPrice, 'gwei')} Gwei</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Account Balance</div>
                    <div class="detail-value">${this.web3.utils.fromWei(balance, 'ether')} ETH</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Contract Address</div>
                    <div class="detail-value">${this.contractAddress || 'Not set'}</div>
                </div>
            `;
            
            networkInfo.style.display = 'block';
        } catch (error) {
            console.error('Failed to get network info:', error);
        }
    }

    // Load blockchain from backend and render visualization
    async loadChain() {
        try {
            const backendInput = document.getElementById('backendUrl');
            if (backendInput && backendInput.value) {
                this.backendUrl = backendInput.value;
            }

            const container = document.getElementById('chainContainer');
            container.innerHTML = '<div class="loading">Loading chain...</div>';

            const urlsToTry = this._buildBackendCandidates(this.backendUrl);
            let lastError = null;
            let data = null;
            for (const baseUrl of urlsToTry) {
                try {
                    await this._fetchWithTimeout(`${baseUrl}/health`, { method: 'GET' }, 4000);
                    const res = await this._fetchWithTimeout(`${baseUrl}/blockchain`, { method: 'GET' }, 8000);
                    if (!res.ok) throw new Error(`Backend error ${res.status}`);
                    data = await res.json();
                    this.backendUrl = baseUrl;
                    if (backendInput) backendInput.value = baseUrl;
                    lastError = null;
                    break;
                } catch (e) {
                    lastError = e;
                }
            }
            if (lastError) throw lastError;

            const blocks = (data && data.blocks) ? data.blocks : [];
            if (!blocks || blocks.length === 0) {
                container.innerHTML = '<div class="loading">No blocks found</div>';
                return;
            }

            const html = this.renderChain(blocks);
            container.innerHTML = html;
        } catch (error) {
            console.error('Load chain error:', error);
            const container = document.getElementById('chainContainer');
            container.innerHTML = `<div class="error">Failed to load chain: ${error.message}</div>`;
        }
    }

    // Render blocks with links
    renderChain(blocks) {
        const parts = [];
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            parts.push(`
                <div class="block-item">
                    <div class="block-header">
                        <div class="block-index">#${b.index ?? i}</div>
                        <div style="font-size:12px;color:#7f8c8d;">${new Date(b.timestamp || Date.now()).toLocaleString()}</div>
                    </div>
                    <div class="block-hash"><strong>Hash:</strong> ${b.hash || 'n/a'}</div>
                    <div class="block-prevhash"><strong>Prev:</strong> ${b.previousHash || '0'}</div>
                    <div style="margin-top:8px;font-size:12px;color:#7f8c8d;">
                        <div><strong>Txn count:</strong> ${(b.transactions && b.transactions.length) || 0}</div>
                        ${b.merkleRoot ? `<div><strong>Merkle:</strong> ${b.merkleRoot}</div>` : ''}
                        ${b.leader ? `<div><strong>Leader:</strong> ${b.leader}</div>` : ''}
                    </div>
                </div>
            `);
            if (i < blocks.length - 1) {
                parts.push('<span class="arrow">➜</span>');
            }
        }
        return parts.join('');
    }

    _buildBackendCandidates(inputUrl) {
        const candidates = [];
        const normalized = this._normalizeUrl(inputUrl || 'http://127.0.0.1:3001');
        candidates.push(normalized);
        if (!normalized.includes('127.0.0.1')) candidates.push('http://127.0.0.1:3001');
        if (!normalized.includes('localhost')) candidates.push('http://localhost:3001');
        return candidates;
    }

    _normalizeUrl(u) {
        try {
            if (!/^https?:\/\//i.test(u)) {
                return `http://${u}`;
            }
            const url = new URL(u);
            return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
        } catch (_) {
            return 'http://127.0.0.1:3001';
        }
    }

    async _fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(resource, { ...options, signal: controller.signal });
            return res;
        } finally {
            clearTimeout(id);
        }
    }

    // Create a new child record
    async createRecord() {
        if (!this.contract || !this.account) {
            this.showMessage('Please connect to Web3 first', 'error');
            return;
        }

        try {
            const name = document.getElementById('childName').value;
            const age = parseInt(document.getElementById('childAge').value);
            const healthStatus = document.getElementById('healthStatus').value;
            const location = document.getElementById('location').value;
            const guardian = document.getElementById('guardian').value;
            const metadata = document.getElementById('metadata').value;

            // Validate inputs
            if (!name || !age || !healthStatus || !location || !guardian) {
                this.showMessage('Please fill in all required fields', 'error');
                return;
            }

            if (age < 0 || age > 18) {
                this.showMessage('Age must be between 0 and 18', 'error');
                return;
            }

            this.showMessage('Creating record... Please wait for transaction confirmation.', 'info');

            // Estimate gas
            const gasEstimate = await this.contract.methods.createRecord(
                name, age, healthStatus, location, guardian, metadata
            ).estimateGas({ from: this.account });

            // Send transaction
            const result = await this.contract.methods.createRecord(
                name, age, healthStatus, location, guardian, metadata
            ).send({
                from: this.account,
                gas: gasEstimate
            });

            // Safely extract recordId from receipt events; fallback to contract counter
            let recordId = 'unknown';
            try {
                if (result && result.events) {
                    const ev = result.events.RecordCreated || result.events['RecordCreated'];
                    if (ev && ev.returnValues && ev.returnValues.recordId !== undefined) {
                        recordId = parseInt(ev.returnValues.recordId);
                    }
                }
                if (recordId === 'unknown') {
                    const count = await this.contract.methods.recordCount().call();
                    recordId = parseInt(count);
                }
            } catch (e) {
                // keep 'unknown' if both methods fail
            }

            this.showMessage(`Record created successfully! Record ID: ${recordId}`, 'success');
            
            // Clear form
            document.getElementById('childName').value = '';
            document.getElementById('childAge').value = '';
            document.getElementById('healthStatus').value = '';
            document.getElementById('location').value = '';
            document.getElementById('guardian').value = '';
            document.getElementById('metadata').value = '';

        } catch (error) {
            console.error('Create record error:', error);
            this.showMessage(`Failed to create record: ${error.message}`, 'error');
        }
    }

    // Update a child record
    async updateRecord() {
        if (!this.contract || !this.account) {
            this.showMessage('Please connect to Web3 first', 'error');
            return;
        }

        try {
            const recordId = parseInt(document.getElementById('updateRecordId').value);
            const field = document.getElementById('updateField').value;
            const newValue = document.getElementById('updateValue').value;
            const reason = document.getElementById('updateReason').value;

            // Validate inputs
            if (!recordId || !field || !newValue || !reason) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            this.showMessage('Updating record... Please wait for transaction confirmation.', 'info');

            // Estimate gas
            const gasEstimate = await this.contract.methods.updateRecord(
                recordId, field, newValue, reason
            ).estimateGas({ from: this.account });

            // Send transaction
            const result = await this.contract.methods.updateRecord(
                recordId, field, newValue, reason
            ).send({
                from: this.account,
                gas: gasEstimate
            });

            this.showMessage('Record updated successfully!', 'success');
            
            // Clear form
            document.getElementById('updateRecordId').value = '';
            document.getElementById('updateField').value = '';
            document.getElementById('updateValue').value = '';
            document.getElementById('updateReason').value = '';

        } catch (error) {
            console.error('Update record error:', error);
            this.showMessage(`Failed to update record: ${error.message}`, 'error');
        }
    }

    // Transfer guardianship
    async transferGuardianship() {
        if (!this.contract || !this.account) {
            this.showMessage('Please connect to Web3 first', 'error');
            return;
        }

        try {
            const recordId = parseInt(document.getElementById('transferRecordId').value);
            const newGuardian = document.getElementById('newGuardian').value;
            const reason = document.getElementById('transferReason').value;

            // Validate inputs
            if (!recordId || !newGuardian || !reason) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            this.showMessage('Transferring guardianship... Please wait for transaction confirmation.', 'info');

            // Estimate gas
            const gasEstimate = await this.contract.methods.transferGuardianship(
                recordId, newGuardian, reason
            ).estimateGas({ from: this.account });

            // Send transaction
            const result = await this.contract.methods.transferGuardianship(
                recordId, newGuardian, reason
            ).send({
                from: this.account,
                gas: gasEstimate
            });

            this.showMessage('Guardianship transferred successfully!', 'success');
            
            // Clear form
            document.getElementById('transferRecordId').value = '';
            document.getElementById('newGuardian').value = '';
            document.getElementById('transferReason').value = '';

        } catch (error) {
            console.error('Transfer guardianship error:', error);
            this.showMessage(`Failed to transfer guardianship: ${error.message}`, 'error');
        }
    }

    // Load all records
    async loadRecords() {
        if (!this.contract) {
            this.showMessage('Please connect to Web3 first', 'error');
            return;
        }

        try {
            this.showMessage('Loading records...', 'info');
            
            const records = await this.contract.methods.getAllRecords().call();
            this.displayRecords(records);

        } catch (error) {
            console.error('Load records error:', error);
            this.showMessage(`Failed to load records: ${error.message}`, 'error');
        }
    }

    // Load active records only
    async loadActiveRecords() {
        if (!this.contract) {
            this.showMessage('Please connect to Web3 first', 'error');
            return;
        }

        try {
            this.showMessage('Loading active records...', 'info');
            
            const records = await this.contract.methods.getActiveRecords().call();
            this.displayRecords(records);

        } catch (error) {
            console.error('Load active records error:', error);
            this.showMessage(`Failed to load active records: ${error.message}`, 'error');
        }
    }

    // Display records in the UI
    displayRecords(records) {
        const recordsList = document.getElementById('recordsList');
        
        if (!records || records.length === 0) {
            recordsList.innerHTML = '<div class="loading">No records found</div>';
            return;
        }

        let html = '';
        records.forEach(record => {
            const formattedRecord = this.formatRecord(record);
            html += this.createRecordCard(formattedRecord);
        });

        recordsList.innerHTML = html;
        this.showMessage(`Loaded ${records.length} records`, 'success');
    }

    // Format record data
    formatRecord(record) {
        return {
            id: parseInt(record.id),
            name: record.name,
            age: parseInt(record.age),
            healthStatus: record.healthStatus,
            location: record.location,
            guardian: record.guardian,
            status: record.status,
            createdAt: new Date(parseInt(record.createdAt) * 1000).toLocaleString(),
            lastUpdatedAt: new Date(parseInt(record.lastUpdatedAt) * 1000).toLocaleString(),
            createdBy: record.createdBy,
            lastUpdatedBy: record.lastUpdatedBy,
            isActive: record.isActive,
            metadata: record.metadata
        };
    }

    // Create record card HTML
    createRecordCard(record) {
        const statusClass = record.isActive ? 'record-status' : 'record-status inactive';
        const statusText = record.isActive ? 'Active' : 'Inactive';
        
        return `
            <div class="record-card">
                <div class="record-header">
                    <div class="record-id">Record #${record.id}</div>
                    <div class="${statusClass}">${statusText}</div>
                </div>
                <div class="record-details">
                    <div class="detail-item">
                        <div class="detail-label">Name</div>
                        <div class="detail-value">${record.name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Age</div>
                        <div class="detail-value">${record.age} years</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Health Status</div>
                        <div class="detail-value">${record.healthStatus}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${record.location}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Guardian</div>
                        <div class="detail-value">${record.guardian}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">${record.status}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Created</div>
                        <div class="detail-value">${record.createdAt}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Last Updated</div>
                        <div class="detail-value">${record.lastUpdatedAt}</div>
                    </div>
                    ${record.metadata ? `
                    <div class="detail-item">
                        <div class="detail-label">Additional Info</div>
                        <div class="detail-value">${record.metadata}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Switch between tabs
    switchTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));

        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Show selected tab content
        document.getElementById(tabName + 'Tab').classList.add('active');

        // Add active class to clicked tab
        event.target.classList.add('active');
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messagesContainer = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.className = type;
        messageElement.textContent = message;
        
        messagesContainer.appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 5000);
    }
}

// Global functions for HTML onclick events
let app;

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    app = new ChildWelfareApp();
    app.init();
});

// Global functions
function connectWeb3() {
    app.connectWeb3();
}

function createRecord() {
    app.createRecord();
}

function updateRecord() {
    app.updateRecord();
}

function transferGuardianship() {
    app.transferGuardianship();
}

function loadRecords() {
    app.loadRecords();
}

function loadActiveRecords() {
    app.loadActiveRecords();
}

function switchTab(tabName) {
    app.switchTab(tabName);
}

// Blockchain visualization
function loadChain() {
    app.loadChain();
}

// Health status update (Hospital-only convenience wrapper)
async function updateHealthStatus() {
    if (!app.contract || !app.account) {
        app.showMessage('Please connect to Web3 first', 'error');
        return;
    }

    try {
        const recordId = parseInt(document.getElementById('healthRecordId').value);
        const newValue = document.getElementById('healthUpdateValue').value;
        const reason = document.getElementById('healthUpdateReason').value;

        if (!recordId || !newValue || !reason) {
            app.showMessage('Please fill in all fields', 'error');
            return;
        }

        app.showMessage('Updating health status... Please wait for transaction confirmation.', 'info');

        // Estimate gas
        const gasEstimate = await app.contract.methods.updateRecord(
            recordId, 'healthStatus', newValue, reason
        ).estimateGas({ from: app.account });

        // Send tx
        await app.contract.methods.updateRecord(
            recordId, 'healthStatus', newValue, reason
        ).send({ from: app.account, gas: gasEstimate });

        app.showMessage('Health status updated successfully!', 'success');

        // Clear
        document.getElementById('healthRecordId').value = '';
        document.getElementById('healthUpdateValue').value = '';
        document.getElementById('healthUpdateReason').value = '';
    } catch (error) {
        console.error('Health status update error:', error);
        app.showMessage(`Failed to update health status: ${error.message}`, 'error');
    }
}
