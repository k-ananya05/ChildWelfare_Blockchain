import React, { useMemo, useState } from 'react';

export default function MerkleView({ block }) {
  const txs = Array.isArray(block?.transactions) ? block.transactions : [];
  const leavesInput = txs.map((t) => t.hash || t.id);
  const [focused, setFocused] = useState(null);

  const merkle = useMemo(() => {
    return buildMerkle(leavesInput);
  }, [JSON.stringify(leavesInput)]);

  const path = useMemo(() => {
    if (!focused || !merkle?.levels?.length) return [];
    return merklePath(merkle.levels, focused);
  }, [focused, merkle]);

  return (
    <div className="panel" style={{ padding: 8 }}>
      <div><strong>Merkle Root:</strong> {shorten(block?.merkleRoot || merkle?.root || '')}</div>
      <div className="row" style={{ marginTop: 8, overflowX: 'auto' }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Leaves</div>
          <div className="grid" style={{ gap: 6 }}>
            {leavesInput.map((leaf, idx) => {
              const isActive = path.some(p => p.level === 0 && p.index === idx);
              return (
                <div
                  key={idx}
                  onClick={() => setFocused(idx)}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: isActive ? '#e8f4ff' : 'white'
                  }}
                  title={leaf}
                >
                  {shorten(leaf)}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Path to Root</div>
          {path.length === 0 ? <div>Click a leaf to highlight its path</div> : (
            <div className="grid" style={{ gap: 6 }}>
              {path.map((node, i) => (
                <div key={i} style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 4 }}>
                  Level {node.level}, Index {node.index}: {shorten(node.hash)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function shorten(s) {
  if (!s) return 'N/A';
  const str = String(s);
  return str.length > 20 ? `${str.slice(0, 10)}...${str.slice(-8)}` : str;
}

function buildEmpty(levels) {
  return { levels, root: '' };
}

function buildMerkle(leaves) {
  if (!leaves || leaves.length === 0) return buildEmpty([]);
  const levels = [leaves.map((v) => String(v))];
  return {
    levels,
    get root() {
      return levels[levels.length - 1]?.[0] || '';
    }
  };
}

function merklePath(levels, leafIndex) {
  if (!Array.isArray(levels) || levels.length === 0) return [];
  const path = [{ level: 0, index: leafIndex, hash: String(levels[0][leafIndex] || '') }];
  let idx = leafIndex;
  for (let level = 0; levels[level]?.length > 1; level++) {
    const arr = levels[level];
    const isRight = idx % 2 === 1;
    const pairIndex = isRight ? idx - 1 : idx + 1;
    const left = arr[idx];
    const right = arr[pairIndex] ?? arr[idx];
    const parentHash = `${left}+${right}`;
    const nextIndex = Math.floor(idx / 2);
    if (!levels[level + 1]) levels[level + 1] = [];
    levels[level + 1][nextIndex] = parentHash;
    path.push({ level: level + 1, index: nextIndex, hash: parentHash });
    idx = nextIndex;
  }
  return path;
}


