const express = require('express');
const router = express.Router();

const { uploadJSON, getJSON } = require('../services/ipfsService');

// POST /api/ipfs/upload -> receives JSON, uploads to NFT.Storage, returns { cid, url }
router.post('/ipfs/upload', async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
        const cid = await uploadJSON(req.body);
        const url = `https://ipfs.io/ipfs/${cid}`;
        res.json({ cid, url });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
});

// GET /api/ipfs/:cid -> fetch JSON from IPFS and return it
router.get('/ipfs/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        if (!cid || typeof cid !== 'string') {
            return res.status(400).json({ error: 'CID is required' });
        }
        const data = await getJSON(cid);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || 'Fetch failed' });
    }
});

module.exports = router;


