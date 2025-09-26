const { uploadJSON } = require('./services/ipfsService');

// Offload large record payloads to IPFS via NFT.Storage
// If txData.data.record JSON exceeds 2KB, upload and replace with { ipfsCid, ipfsUrl }
async function buildTransactionPayload(txData) {
    const updated = { ...txData, data: { ...(txData.data || {}) } };

    const record = updated.data && updated.data.record;
    if (record) {
        const jsonString = JSON.stringify(record);
        const byteLength = Buffer.byteLength(jsonString, 'utf8');
        if (byteLength > 2048) {
            const cid = await uploadJSON(record);
            const url = `https://ipfs.io/ipfs/${cid}`;
            updated.data.record = { ipfsCid: cid, ipfsUrl: url };
        }
    }

    return updated;
}

module.exports = { buildTransactionPayload };


