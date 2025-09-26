// Child Welfare Blockchain Frontend Application
class ChildWelfareApp {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.contractAddress = null;
        this.isConnected = false;
        this.contractABI = null;
        this.role = null;
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
        // Use inline ABI to avoid fetch issues
        this.contractABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "recordId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "createdBy",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        }
      ],
      "name": "RecordCreated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_age",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_healthStatus",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_location",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_guardian",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_metadata",
          "type": "string"
        }
      ],
      "name": "createRecord",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_recordId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_reason",
          "type": "string"
        }
      ],
      "name": "deactivateRecord",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        },
        {
          "internalType": "uint8",
          "name": "_role",
          "type": "uint8"
        }
      ],
      "name": "setRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "roles",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getActiveRecords",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "age",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "healthStatus",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "guardian",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "status",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lastUpdatedAt",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "createdBy",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "lastUpdatedBy",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            },
            {
              "internalType": "string",
              "name": "metadata",
              "type": "string"
            }
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
      "name": "getAllRecords",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "age",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "healthStatus",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "guardian",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "status",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lastUpdatedAt",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "createdBy",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "lastUpdatedBy",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            },
            {
              "internalType": "string",
              "name": "metadata",
              "type": "string"
            }
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
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_recordId",
          "type": "uint256"
        }
      ],
      "name": "getRecord",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "age",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "healthStatus",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "location",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "guardian",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "status",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lastUpdatedAt",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "createdBy",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "lastUpdatedBy",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            },
            {
              "internalType": "string",
              "name": "metadata",
              "type": "string"
            }
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
      "name": "recordCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "records",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "age",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "healthStatus",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "location",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "guardian",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "status",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "createdAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastUpdatedAt",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "createdBy",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "lastUpdatedBy",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "metadata",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_recordId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_newGuardian",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_reason",
          "type": "string"
        }
      ],
      "name": "transferGuardianship",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_recordId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_field",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_newValue",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_reason",
          "type": "string"
        }
      ],
      "name": "updateRecord",
      "outputs": [],
      "stateMutability": "nonpayable",
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
            await this.getRole();
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
            await this.getRole();
            await this.updateNetworkInfo();

            this.showMessage('Connected to MetaMask!', 'success');
        } catch (error) {
            console.error('MetaMask connection error:', error);
            this.showMessage(`MetaMask connection failed: ${error.message}`, 'error');
        }
    }

    // Get user role
    async getRole() {
        if (!this.contract || !this.account) return;

        try {
            const roleNum = await this.contract.methods.roles(this.account).call();
            this.role = parseInt(roleNum);
            this.updateRoleUI();
        } catch (error) {
            console.error('Get role error:', error);
            this.role = null;
        }
    }

    // Get role name
    getRoleName(role) {
        const names = ['NGO', 'Hospital', 'Government', 'Auditor'];
        return names[role] || 'Unknown';
    }

    // Update role-based UI
    updateRoleUI() {
        // Hide/show tabs based on role
        const tabs = document.querySelectorAll('.tab');
        const visibleTabs = [];
        tabs.forEach(tab => {
            const onclickStr = tab.getAttribute('onclick');
            const match = onclickStr.match(/switchTab\('(\w+)'\)/);
            if (match) {
                const tabName = match[1];
                let show = false;
                switch(tabName) {
                    case 'create':
                        show = this.role === 0; // NGO
                        break;
                    case 'update':
                        show = this.role === 0; // NGO
                        break;
                    case 'health':
                        show = this.role === 1; // Hospital
                        break;
                    case 'transfer':
                        show = this.role === 2; // Government
                        break;
                    case 'view':
                        show = this.role === 3; // Auditor
                        break;
                    case 'chain':
                        show = true; // All can see blockchain
                        break;
                }
                tab.style.display = show ? '' : 'none';
                if (show) visibleTabs.push(tab);
            }
        });

        // If current active tab is hidden, switch to first visible
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.style.display === 'none' && visibleTabs.length > 0) {
            this.switchTab(visibleTabs[0].getAttribute('onclick').match(/switchTab\('(\w+)'\)/)[1]);
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
                ${this.role !== null ? `
                <div class="detail-item">
                    <div class="detail-label">User Role</div>
                    <div class="detail-value">${this.getRoleName(this.role)}</div>
                </div>
                ` : ''}
            `;
            
            networkInfo.style.display = 'block';
        } catch (error) {
            console.error('Failed to get network info:', error);
        }
    }

    // Load blockchain from Hardhat Ethereum and render visualization
    async loadChain() {
        if (!this.web3 || !this.isConnected) {
            this.showMessage('Please connect to Web3 first to load the blockchain', 'error');
            return;
        }

        try {
            const container = document.getElementById('chainContainer');
            container.innerHTML = '<div class="loading">Loading chain...</div>';

            const latestBlockNumber = await this.web3.eth.getBlockNumber();
            const latestNum = Number(latestBlockNumber);
            const numBlocksToShow = Math.min(10, latestNum + 1);
            const blocks = [];

            // Fetch the last 10 blocks (or fewer if chain is shorter)
            for (let i = latestNum; i >= 0 && blocks.length < numBlocksToShow; i--) {
                const block = await this.web3.eth.getBlock(i, true); // true includes transaction details
                blocks.unshift({
                    index: block.number ? block.number.toString() : '0',
                    hash: block.hash || '0x0',
                    previousHash: block.parentHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
                    timestamp: Number(block.timestamp) * 1000, // Convert to ms for Date
                    transactions: block.transactions || [],
                    merkleRoot: block.stateRoot || '0x0' // Use stateRoot as equivalent to merkleRoot
                });
            }

            if (blocks.length === 0) {
                container.innerHTML = '<div class="loading">No blocks found</div>';
                return;
            }

            const html = this.renderChain(blocks);
            container.innerHTML = html;
            this.showMessage(`Loaded ${blocks.length} recent blocks from Hardhat Ethereum`, 'success');
        } catch (error) {
            console.error('Load chain error:', error);
            const container = document.getElementById('chainContainer');
            container.innerHTML = `<div class="error">Failed to load chain: ${error.message}</div>`;
            this.showMessage(`Failed to load blockchain: ${error.message}`, 'error');
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
                        <div class="block-index">#${b.index}</div>
                        <div style="font-size:12px;color:#7f8c8d;">${new Date(b.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="block-hash"><strong>Hash:</strong> ${b.hash}</div>
                    <div class="block-prevhash"><strong>Prev:</strong> ${b.previousHash}</div>
                    <div style="margin-top:8px;font-size:12px;color:#7f8c8d;">
                        <div><strong>Txn count:</strong> ${b.transactions.length}</div>
                        <div><strong>State Root:</strong> ${b.merkleRoot}</div>
                    </div>
                </div>
            `);
            if (i < blocks.length - 1) {
                parts.push('<span class="arrow">➜</span>');
            }
        }
        return parts.join('');
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
            const recordIdStr = document.getElementById('updateRecordId').value.trim();
            const recordId = parseInt(recordIdStr);
            const field = document.getElementById('updateField').value.trim();
            const newValue = document.getElementById('updateValue').value.trim();
            const reason = document.getElementById('updateReason').value.trim();

            // Validate inputs
            if (isNaN(recordId) || recordId < 0 || !field || !newValue || !reason) {
                this.showMessage('Please fill in all fields with valid values (Record ID must be a positive number)', 'error');
                return;
            }

            // Role-based field access control
            const allowedFields = {
                0: ['name', 'location', 'guardian', 'metadata'], // NGO
                1: ['healthStatus'], // Hospital
            };

            if (!allowedFields[this.role] || !allowedFields[this.role].includes(field)) {
                this.showMessage(`You do not have permission to update the '${field}' field.`, 'error');
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
            const recordIdStr = document.getElementById('transferRecordId').value.trim();
            const recordId = parseInt(recordIdStr);
            const newGuardian = document.getElementById('newGuardian').value.trim();
            const reason = document.getElementById('transferReason').value.trim();

            // Validate inputs
            if (isNaN(recordId) || recordId < 0 || !newGuardian || !reason) {
                this.showMessage('Please fill in all fields with valid values (Record ID must be a positive number)', 'error');
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

// Set role for an address
async function setRole() {
    if (!app.contract || !app.account) {
        app.showMessage('Please connect to Web3 first', 'error');
        return;
    }

    try {
        const userAddress = document.getElementById('userAddress').value.trim();
        const roleValue = parseInt(document.getElementById('roleSelect').value);

        if (!userAddress || isNaN(roleValue)) {
            app.showMessage('Please fill in all fields with valid values', 'error');
            return;
        }

        app.showMessage('Setting role... Please wait for transaction confirmation.', 'info');

        // Estimate gas
        const gasEstimate = await app.contract.methods.setRole(
            userAddress, roleValue
        ).estimateGas({ from: app.account });

        // Send transaction
        const result = await app.contract.methods.setRole(
            userAddress, roleValue
        ).send({
            from: app.account,
            gas: gasEstimate
        });

        app.showMessage('Role set successfully!', 'success');

        // Update the local role after setting
        await app.getRole();

        // Clear form
        document.getElementById('userAddress').value = '';
        document.getElementById('roleSelect').value = '';

    } catch (error) {
        console.error('Set role error:', error);
        app.showMessage(`Failed to set role: ${error.message}`, 'error');
    }
}

// Health status update (Hospital-only convenience wrapper)
async function updateHealthStatus() {
    if (!app.contract || !app.account) {
        app.showMessage('Please connect to Web3 first', 'error');
        return;
    }

    try {
        const recordIdStr = document.getElementById('healthRecordId').value.trim();
        const recordId = parseInt(recordIdStr);
        const newValue = document.getElementById('healthUpdateValue').value.trim();
        const reason = document.getElementById('healthUpdateReason').value.trim();

        if (isNaN(recordId) || recordId < 0 || !newValue || !reason) {
            app.showMessage('Please fill in all fields with valid values (Record ID must be a positive number)', 'error');
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
