import React, { useMemo, useState } from 'react';

export default function TransactionHistory({ blocks }) {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const list = [];
    (blocks || []).forEach((b) => {
      (b.transactions || []).forEach((tx) => {
        list.push({
          block: b.index,
          id: tx.id,
          from: tx.from,
          to: tx.to,
          timestamp: tx.timestamp
        });
      });
    });
    const q = query.trim().toLowerCase();
    return q.length ? list.filter(r =>
      String(r.id).toLowerCase().includes(q) ||
      String(r.from).toLowerCase().includes(q) ||
      String(r.to).toLowerCase().includes(q) ||
      String(r.block).toLowerCase().includes(q)
    ) : list;
  }, [blocks, query]);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Transaction History</h3>
      <input
        placeholder="Search txId/from/to/block"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: 6, marginBottom: 8 }}
      />
      <div style={{ border: '1px solid #eee', borderRadius: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 2fr 2fr', gap: 8, padding: 8, background: '#fafafa' }}>
          <strong>Block</strong>
          <strong>TxId</strong>
          <strong>From</strong>
          <strong>To</strong>
          <strong>Time</strong>
        </div>
        {rows.map((r) => (
          <div key={`${r.block}-${r.id}`} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 2fr 2fr', gap: 8, padding: 8 }}>
            <span>{r.block}</span>
            <span>{shorten(r.id)}</span>
            <span>{shorten(r.from)}</span>
            <span>{shorten(r.to)}</span>
            <span>{new Date(r.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function shorten(s) {
  if (!s) return 'N/A';
  const str = String(s);
  return str.length > 16 ? `${str.slice(0, 8)}...${str.slice(-6)}` : str;
}


