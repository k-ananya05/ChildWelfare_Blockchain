// IPFS service using NFT.Storage for large JSON payloads
// This module provides two functions:
// - uploadJSON(jsonObj): uploads a JSON object to IPFS via NFT.Storage and returns the CID
// - getJSON(cid): fetches JSON content from a public IPFS gateway by CID

// Mock IPFS service for demo purposes
// In production, replace with real IPFS or NFT.Storage

// Support Node < 18 by falling back to node-fetch (ESM) via dynamic import
// eslint-disable-next-line node/no-unsupported-features/node-builtins
const fetchImpl = typeof fetch === 'function'
    ? fetch
    : async (...args) => {
        const mod = await import('node-fetch');
        return mod.default(...args);
    };

// In-memory storage for demo (replace with real IPFS in production)
const mockStorage = new Map();

async function uploadJSON(jsonObj) {
    // Generate a mock CID for demo purposes
    const mockCid = 'bafy' + Math.random().toString(36).substr(2, 50);
    
    // Store in memory for demo
    mockStorage.set(mockCid, jsonObj);
    
    console.log(`Mock IPFS upload: ${mockCid}`);
    return mockCid;
}

async function getJSON(cid) {
    // Check mock storage first
    if (mockStorage.has(cid)) {
        return mockStorage.get(cid);
    }
    
    // Fallback: try public gateway
    try {
        const url = `https://ipfs.io/ipfs/${cid}`;
        const res = await fetchImpl(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch IPFS JSON (status ${res.status})`);
        }
        return res.json();
    } catch (error) {
        throw new Error(`Failed to fetch IPFS JSON: ${error.message}`);
    }
}

module.exports = { uploadJSON, getJSON };


