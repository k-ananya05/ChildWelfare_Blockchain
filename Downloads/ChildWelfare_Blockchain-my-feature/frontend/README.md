# Child Welfare Frontend (Vite + React)

Run against backend at http://localhost:5002 by default.

## Setup

```
cd frontend
npm install
npm run dev
```

## Environment (optional)

Create `.env.local` in `frontend/` to override defaults:

```
VITE_API_URL=http://localhost:5002
VITE_WS_URL=ws://localhost:5002
```

## Routes

- /blocks: Block visualization with live updates, IPFS previews, MetaMask demo

## Notes

- Connect Wallet requires MetaMask on a local Hardhat network (localhost:8545)
- The demo Create Child Record uploads JSON to backend /api/ipfs/upload and then sends a MetaMask transaction embedding the IPFS CID in data


