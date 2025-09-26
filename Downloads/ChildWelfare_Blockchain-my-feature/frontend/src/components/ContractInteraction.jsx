import React, { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export default function ContractInteraction() {
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        initWeb3();
    }, []);

    const initWeb3 = async () => {
        if (!window.ethereum) {
            alert('MetaMask not found');
            return;
        }

        try {
            const { ethers } = await import('https://cdn.skypack.dev/ethers@5.7.2');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            
            setAccount(address);
            
            // Contract ABI (simplified for demo)
            const contractABI = [
                "function openCase(string memory caseId)",
                "function addWelfareRecord(string memory caseId, string memory ipfsHash)",
                "function addMedicalRecord(string memory caseId, string memory ipfsHash)",
                "function validateCase(string memory caseId, string memory decision)",
                "function closeCase(string memory caseId)",
                "function flagCase(string memory caseId, string memory reason)",
                "function freezeCase(string memory caseId)",
                "function unfreezeCase(string memory caseId)",
                "function getCase(string memory caseId) view returns (string memory, address, uint256, uint256, uint256)",
                "event CaseOpened(string indexed caseId, address indexed creator)",
                "event RecordAdded(string indexed caseId, string recordType, string ipfsHash)",
                "event CaseValidated(string indexed caseId, string decision, address validator)"
            ];
            
            // Contract address (deploy and update this)
            const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
            const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
            setContract(contractInstance);
            
        } catch (error) {
            console.error('Web3 init failed:', error);
        }
    };

    const executeContractMethod = async (methodName, ...args) => {
        if (!contract) return;
        
        setLoading(true);
        try {
            const tx = await contract[methodName](...args);
            console.log('Transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            alert(`Transaction successful: ${tx.hash}`);
        } catch (error) {
            console.error('Transaction failed:', error);
            alert(`Transaction failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const openCase = async () => {
        const caseId = prompt('Enter Case ID:');
        if (caseId) {
            await executeContractMethod('openCase', caseId);
        }
    };

    const addWelfareRecord = async () => {
        const caseId = prompt('Enter Case ID:');
        const ipfsHash = prompt('Enter IPFS Hash:');
        if (caseId && ipfsHash) {
            await executeContractMethod('addWelfareRecord', caseId, ipfsHash);
        }
    };

    const addMedicalRecord = async () => {
        const caseId = prompt('Enter Case ID:');
        const ipfsHash = prompt('Enter IPFS Hash:');
        if (caseId && ipfsHash) {
            await executeContractMethod('addMedicalRecord', caseId, ipfsHash);
        }
    };

    const validateCase = async () => {
        const caseId = prompt('Enter Case ID:');
        const decision = prompt('Enter decision (APPROVE/REJECT):');
        if (caseId && decision) {
            await executeContractMethod('validateCase', caseId, decision);
        }
    };

    const closeCase = async () => {
        const caseId = prompt('Enter Case ID:');
        if (caseId) {
            await executeContractMethod('closeCase', caseId);
        }
    };

    const flagCase = async () => {
        const caseId = prompt('Enter Case ID:');
        const reason = prompt('Enter flag reason:');
        if (caseId && reason) {
            await executeContractMethod('flagCase', caseId, reason);
        }
    };

    const freezeCase = async () => {
        const caseId = prompt('Enter Case ID:');
        if (caseId) {
            await executeContractMethod('freezeCase', caseId);
        }
    };

    const unfreezeCase = async () => {
        const caseId = prompt('Enter Case ID:');
        if (caseId) {
            await executeContractMethod('unfreezeCase', caseId);
        }
    };

    if (!account) {
        return (
            <div className="card" style={{ padding: 16 }}>
                <h3>Contract Interaction</h3>
                <p>Please connect MetaMask to interact with the smart contract.</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: 16 }}>
            <h3>Smart Contract Interaction</h3>
            <p>Account: {account}</p>
            
            <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                <h4>NGO Actions</h4>
                <button onClick={openCase} disabled={loading}>Open Case</button>
                <button onClick={addWelfareRecord} disabled={loading}>Add Welfare Record</button>
                
                <h4>Hospital Actions</h4>
                <button onClick={addMedicalRecord} disabled={loading}>Add Medical Record</button>
                
                <h4>Government Actions</h4>
                <button onClick={validateCase} disabled={loading}>Validate Case</button>
                <button onClick={closeCase} disabled={loading}>Close Case</button>
                <button onClick={flagCase} disabled={loading}>Flag Case</button>
                
                <h4>Admin Actions</h4>
                <button onClick={freezeCase} disabled={loading}>Freeze Case</button>
                <button onClick={unfreezeCase} disabled={loading}>Unfreeze Case</button>
            </div>
            
            {loading && <p>Transaction pending...</p>}
        </div>
    );
}
