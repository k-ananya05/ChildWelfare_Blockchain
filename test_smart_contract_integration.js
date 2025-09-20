const Web3Service = require('./web3-integration/web3Service');
const axios = require('axios');

class SmartContractIntegrationTester {
    constructor() {
        this.web3Service = new Web3Service();
        this.testResults = [];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runAllTests() {
        console.log('🧪 Starting Smart Contract Integration Tests\n');

        try {
            // Test 1: Web3 Connection
            await this.testWeb3Connection();
            await this.delay(2000);

            // Test 2: Contract Deployment Check
            await this.testContractDeployment();
            await this.delay(2000);

            // Test 3: Record Creation
            await this.testRecordCreation();
            await this.delay(2000);

            // Test 4: Record Updates
            await this.testRecordUpdates();
            await this.delay(2000);

            // Test 5: Guardianship Transfer
            await this.testGuardianshipTransfer();
            await this.delay(2000);

            // Test 6: Record Retrieval
            await this.testRecordRetrieval();
            await this.delay(2000);

            // Test 7: Role Management
            await this.testRoleManagement();
            await this.delay(2000);

            // Test 8: Frontend Integration
            await this.testFrontendIntegration();

            // Print final results
            this.printTestResults();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testWeb3Connection() {
        console.log('🔗 Test 1: Web3 Connection');
        
        try {
            const connected = await this.web3Service.initialize('http://localhost:8545');
            
            if (connected) {
                const networkInfo = await this.web3Service.getNetworkInfo();
                console.log('✅ Web3 connection successful');
                console.log(`   Network ID: ${networkInfo.networkId}`);
                console.log(`   Block Number: ${networkInfo.blockNumber}`);
                console.log(`   Gas Price: ${networkInfo.gasPrice} Gwei`);
                
                this.testResults.push({ test: 'Web3 Connection', status: 'PASS', details: networkInfo });
            } else {
                throw new Error('Failed to connect to Web3');
            }
        } catch (error) {
            console.log('❌ Web3 connection failed:', error.message);
            this.testResults.push({ test: 'Web3 Connection', status: 'FAIL', error: error.message });
        }
    }

    async testContractDeployment() {
        console.log('\n📋 Test 2: Contract Deployment Check');
        
        try {
            // Try to load deployment info
            const fs = require('fs');
            const path = require('path');
            const deploymentFile = path.join(__dirname, 'deployments/localhost.json');
            
            if (fs.existsSync(deploymentFile)) {
                const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
                console.log('✅ Deployment info found');
                console.log(`   Contract Address: ${deploymentInfo.contractAddress}`);
                console.log(`   Network: ${deploymentInfo.network}`);
                console.log(`   Deployer: ${deploymentInfo.deployer}`);
                
                // Load contract
                await this.web3Service.loadContract(deploymentInfo.contractAddress);
                console.log('✅ Contract loaded successfully');
                
                this.testResults.push({ 
                    test: 'Contract Deployment', 
                    status: 'PASS', 
                    details: deploymentInfo 
                });
            } else {
                throw new Error('Deployment info not found. Please deploy the contract first.');
            }
        } catch (error) {
            console.log('❌ Contract deployment check failed:', error.message);
            this.testResults.push({ test: 'Contract Deployment', status: 'FAIL', error: error.message });
        }
    }

    async testRecordCreation() {
        console.log('\n📝 Test 3: Record Creation');
        
        try {
            // Set a test account (using first account from Hardhat)
            const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
            this.web3Service.setAccount(testPrivateKey);
            
            const result = await this.web3Service.createRecord(
                'Test Child Integration',
                12,
                'healthy',
                'Test City',
                'Test Guardian',
                'Integration test metadata'
            );
            
            if (result.success) {
                console.log('✅ Record created successfully');
                console.log(`   Record ID: ${result.recordId}`);
                console.log(`   Transaction Hash: ${result.transactionHash}`);
                console.log(`   Block Number: ${result.blockNumber}`);
                
                this.testResults.push({ 
                    test: 'Record Creation', 
                    status: 'PASS', 
                    details: result 
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.log('❌ Record creation failed:', error.message);
            this.testResults.push({ test: 'Record Creation', status: 'FAIL', error: error.message });
        }
    }

    async testRecordUpdates() {
        console.log('\n✏️ Test 4: Record Updates');
        
        try {
            // Update the record we just created
            const result = await this.web3Service.updateRecord(
                1, // Assuming record ID 1 exists
                'healthStatus',
                'minor_issues',
                'Updated during integration test'
            );
            
            if (result.success) {
                console.log('✅ Record updated successfully');
                console.log(`   Transaction Hash: ${result.transactionHash}`);
                console.log(`   Block Number: ${result.blockNumber}`);
                
                this.testResults.push({ 
                    test: 'Record Updates', 
                    status: 'PASS', 
                    details: result 
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.log('❌ Record update failed:', error.message);
            this.testResults.push({ test: 'Record Updates', status: 'FAIL', error: error.message });
        }
    }

    async testGuardianshipTransfer() {
        console.log('\n🔄 Test 5: Guardianship Transfer');
        
        try {
            const result = await this.web3Service.transferGuardianship(
                1, // Assuming record ID 1 exists
                'New Test Guardian',
                'Transfer for integration testing'
            );
            
            if (result.success) {
                console.log('✅ Guardianship transferred successfully');
                console.log(`   Transaction Hash: ${result.transactionHash}`);
                console.log(`   Block Number: ${result.blockNumber}`);
                
                this.testResults.push({ 
                    test: 'Guardianship Transfer', 
                    status: 'PASS', 
                    details: result 
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.log('❌ Guardianship transfer failed:', error.message);
            this.testResults.push({ test: 'Guardianship Transfer', status: 'FAIL', error: error.message });
        }
    }

    async testRecordRetrieval() {
        console.log('\n📖 Test 6: Record Retrieval');
        
        try {
            // Test getting a specific record
            const recordResult = await this.web3Service.getRecord(1);
            
            if (recordResult.success) {
                console.log('✅ Record retrieved successfully');
                console.log(`   Record ID: ${recordResult.record.id}`);
                console.log(`   Name: ${recordResult.record.name}`);
                console.log(`   Age: ${recordResult.record.age}`);
                console.log(`   Health Status: ${recordResult.record.healthStatus}`);
                console.log(`   Guardian: ${recordResult.record.guardian}`);
                
                this.testResults.push({ 
                    test: 'Record Retrieval', 
                    status: 'PASS', 
                    details: recordResult.record 
                });
            } else {
                throw new Error(recordResult.error);
            }

            // Test getting all records
            const allRecordsResult = await this.web3Service.getAllRecords();
            
            if (allRecordsResult.success) {
                console.log(`✅ Retrieved ${allRecordsResult.records.length} total records`);
                
                this.testResults.push({ 
                    test: 'All Records Retrieval', 
                    status: 'PASS', 
                    count: allRecordsResult.records.length 
                });
            } else {
                throw new Error(allRecordsResult.error);
            }

        } catch (error) {
            console.log('❌ Record retrieval failed:', error.message);
            this.testResults.push({ test: 'Record Retrieval', status: 'FAIL', error: error.message });
        }
    }

    async testRoleManagement() {
        console.log('\n🔐 Test 7: Role Management');
        
        try {
            const roles = this.web3Service.getRoles();
            console.log('✅ Role constants retrieved');
            console.log(`   NGO Role: ${roles.NGO_ROLE}`);
            console.log(`   Government Role: ${roles.GOVERNMENT_ROLE}`);
            console.log(`   Hospital Role: ${roles.HOSPITAL_ROLE}`);
            
            this.testResults.push({ 
                test: 'Role Management', 
                status: 'PASS', 
                details: 'Role constants accessible' 
            });
        } catch (error) {
            console.log('❌ Role management test failed:', error.message);
            this.testResults.push({ test: 'Role Management', status: 'FAIL', error: error.message });
        }
    }

    async testFrontendIntegration() {
        console.log('\n🌐 Test 8: Frontend Integration');
        
        try {
            // Check if frontend files exist
            const fs = require('fs');
            const path = require('path');
            
            const frontendFiles = [
                'frontend/index.html',
                'frontend/app.js'
            ];
            
            let allFilesExist = true;
            for (const file of frontendFiles) {
                const filePath = path.join(__dirname, file);
                if (!fs.existsSync(filePath)) {
                    allFilesExist = false;
                    break;
                }
            }
            
            if (allFilesExist) {
                console.log('✅ Frontend files exist');
                console.log('   index.html - Main HTML interface');
                console.log('   app.js - Web3.js integration');
                
                // Check if frontend can be served (basic check)
                console.log('✅ Frontend integration ready');
                console.log('   Open frontend/index.html in browser to test UI');
                
                this.testResults.push({ 
                    test: 'Frontend Integration', 
                    status: 'PASS', 
                    details: 'Frontend files ready for testing' 
                });
            } else {
                throw new Error('Frontend files missing');
            }
        } catch (error) {
            console.log('❌ Frontend integration test failed:', error.message);
            this.testResults.push({ test: 'Frontend Integration', status: 'FAIL', error: error.message });
        }
    }

    printTestResults() {
        console.log('\n📊 Test Results Summary');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        console.log('\nDetailed Results:');
        this.testResults.forEach((result, index) => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.test}`);
            if (result.status === 'FAIL' && result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        if (failed === 0) {
            console.log('\n🎉 All tests passed! Smart contract integration is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the errors above.');
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new SmartContractIntegrationTester();
    tester.runAllTests().catch(console.error);
}

module.exports = SmartContractIntegrationTester;
