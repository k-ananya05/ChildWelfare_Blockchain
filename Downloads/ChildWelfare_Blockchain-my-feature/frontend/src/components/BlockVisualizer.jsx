import React from 'react';
import BlockCard from './BlockCard.jsx';

export default function BlockVisualizer({ baseUrl, blocks }) {
  return (
    <div>
      <h2 style={{ marginTop: 16 }}>Recent Blocks</h2>
      <div className="grid">
        {(blocks || []).slice().reverse().map((b) => (
          <BlockCard key={b.hash || `${b.index}-${b.timestamp}`} baseUrl={baseUrl} block={b} />
        ))}
      </div>
    </div>
  );
}


