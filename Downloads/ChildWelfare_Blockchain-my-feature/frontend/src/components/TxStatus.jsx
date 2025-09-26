import React, { useEffect, useState } from 'react';

export default function TxStatus({ baseUrl, status }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setPreview(null);
    if (!status?.ipfsCid) return;
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/ipfs/${status.ipfsCid}`);
        const data = await res.json();
        const str = JSON.stringify(data, null, 2);
        if (!aborted) setPreview(str.length > 1024 ? str.slice(0, 1024) + '\n...\n(truncated)' : str);
      } catch {}
    })();
    return () => { aborted = true; };
  }, [status?.ipfsCid, baseUrl]);

  if (!status) return null;
  const etherscanLike = `http://localhost:8545/tx/${status.hash}`;

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 6, marginTop: 12 }}>
      <h3>Transaction Status</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>
          Hash:{' '}
          <a href={etherscanLike} target="_blank" rel="noreferrer">
            {shorten(status.hash)}
          </a>
        </span>
        <span>Status: {status.status}</span>
        {typeof status.confirmedIn === 'number' && <span>Included in block: {status.confirmedIn}</span>}
        {status.ipfsCid && (
          <span>
            IPFS:{' '}
            <a href={`https://ipfs.io/ipfs/${status.ipfsCid}`} target="_blank" rel="noreferrer">
              {shorten(status.ipfsCid)}
            </a>
          </span>
        )}
      </div>
      {preview && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, marginTop: 8 }}>{preview}</pre>
      )}
    </div>
  );
}

function shorten(s) {
  if (!s) return 'N/A';
  const str = String(s);
  return str.length > 18 ? `${str.slice(0, 10)}...${str.slice(-6)}` : str;
}


