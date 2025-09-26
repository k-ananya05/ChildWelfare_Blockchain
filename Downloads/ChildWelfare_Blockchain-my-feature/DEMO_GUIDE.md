# Child Welfare Blockchain Demo Guide

## Quick Start for Professor Demo

### 1. Start the Blockchain Network
```bash
./demo-start.sh
```
This starts 4 nodes (NGO, Government, Hospital, Auditor) and shows live leader rotation.

### 2. Start the Frontend (in new terminal)
```bash
./demo-frontend.sh
```
This starts the React frontend on http://localhost:5173

### 3. Demo the System

#### A. Show Leader Rotation
- Watch the terminal running `./demo-start.sh`
- Every 30 seconds, you'll see leader rotation
- Only one node shows "👑 LEADER" at a time

#### B. Show Role-Based Transactions
1. Go to http://localhost:5173/roles
2. Connect MetaMask (use Hardhat account)
3. Try different roles:
   - **NGO**: Create child record
   - **Government**: Approve/validate case
   - **Hospital**: Add medical record
   - **Auditor**: View records
   - **Admin**: Transfer guardianship

#### C. Show Blockchain Visualization
1. Go to http://localhost:5173/blocks
2. Submit transactions from /roles page
3. Click "Create Block" (only works when you're the leader)
4. Watch blocks appear with transactions and IPFS previews

#### D. Show Smart Contract Integration
1. Go to http://localhost:5173/contract
2. Connect MetaMask
3. Try on-chain operations (Open Case, Add Records, etc.)

## Key Features to Highlight

### 1. PBFT Consensus
- **Leader Selection**: Round-robin rotation every 30 seconds
- **Quorum**: Requires 2f+1 votes for block finalization
- **Fault Tolerance**: Can handle up to f Byzantine failures

### 2. Role-Based Access Control
- **NGO**: Can create cases and upload welfare records
- **Government**: Can approve/reject cases and close them
- **Hospital**: Can add medical records
- **Auditor**: Can view all records and flag issues
- **Admin**: Can transfer guardianship and override decisions

### 3. IPFS Integration
- Large records stored off-chain on IPFS
- Only CID (Content Identifier) stored on-chain
- Reduces blockchain bloat while maintaining data integrity

### 4. MetaMask Integration
- Every transaction requires user signature
- No gas fees (message signing only)
- Demonstrates real-world wallet integration

### 5. Real-time Updates
- WebSocket connections for live updates
- Leader change notifications
- Transaction confirmation events

## Demo Script for Professor

1. **"This is a blockchain-based child welfare system with 4 different node types..."**
2. **"Watch the leader rotation - only one node can create blocks at a time..."**
3. **"Let me show you role-based access control..."**
4. **"Notice how large records are stored on IPFS, not the blockchain..."**
5. **"Every transaction requires MetaMask signature for security..."**
6. **"The system uses PBFT consensus for Byzantine fault tolerance..."**

## Troubleshooting

- If ports are busy: `lsof -ti:5002-5005 | xargs kill -9`
- If frontend won't start: `cd frontend && npm install`
- If MetaMask issues: Make sure you're on localhost:8545 network

## Architecture

```
Frontend (React) → Backend (Node.js) → PBFT Consensus → IPFS Storage
                ↓
            MetaMask (Signing)
                ↓
            Smart Contract (Solidity)
```
