import React, { useState } from 'react';
import MerkleView from './MerkleView.jsx';

export default function BlockCard({ baseUrl, block }) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const txs = Array.isArray(block?.transactions) ? block.transactions : [];

  const previewIpfs = async (cid) => {
    if (!cid) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`${baseUrl}/api/ipfs/${cid}`);
      const data = await res.json();
      const str = JSON.stringify(data, null, 2);
      setPreview(str.length > 1024 ? str.slice(0, 1024) + '\n...\n(truncated)' : str);
    } catch (e) {
      setPreview(`Failed to load ${cid}: ${e.message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="row">
        <strong>Block #{block.index}</strong>
        <span>Hash: {shorten(block.hash)}</span>
        <span>Prev: {shorten(block.previousHash)}</span>
        <span>Leader: {String(block.leader || 'N/A')}</span>
        <span>Txs: {txs.length}</span>
        <span>Time: {new Date(block.timestamp).toLocaleString()}</span>
        <button onClick={() => setExpanded((v) => !v)} style={{ marginLeft: 'auto' }}>
          {expanded ? 'Hide' : 'Show'} details
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          <MerkleView block={block} />
          <div style={{ marginTop: 10 }}>
            <h4>Transactions</h4>
            <div className="grid">
              {txs.map((tx) => {
                const cid = tx?.data?.record?.ipfsCid;
                return (
                  <div key={tx.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 4 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>txId: {shorten(tx.id)}</span>
                      <span>from: {shorten(tx.from)}</span>
                      <span>to: {shorten(tx.to)}</span>
                      {cid && (
                        <span>
                          ipfsCid:{' '}
                          <a href={`https://ipfs.io/ipfs/${cid}`} target="_blank" rel="noreferrer">
                            {shorten(cid)}
                          </a>{' '}
                          <button onClick={() => previewIpfs(cid)} disabled={loadingPreview}>
                            Preview
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {preview && (
              <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, marginTop: 8 }}>{preview}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function shorten(s) {
  if (!s) return 'N/A';
  const str = String(s);
  return str.length > 16 ? `${str.slice(0, 8)}...${str.slice(-6)}` : str;
}


