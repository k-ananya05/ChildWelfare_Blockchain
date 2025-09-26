import React, { useEffect, useMemo, useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const ROLE_COLORS = {
  NGO: '#3b82f6',
  Government: '#f59e0b',
  Hospital: '#22c55e',
  Auditor: '#a78bfa',
  Admin: '#ef4444'
};

export default function RoleDashboard() {
  const [active, setActive] = useState('NGO');
  const [leader, setLeader] = useState(null);
  const [isCurrentNodeLeader, setIsCurrentNodeLeader] = useState(false);
  const [notice, setNotice] = useState(null);
  const [recordId, setRecordId] = useState('');
  const [payload, setPayload] = useState('');
  const [leaderHistory, setLeaderHistory] = useState([]);

  const color = ROLE_COLORS[active] || '#888';

  const fetchLeader = async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      if (leader && data.currentLeader !== leader) {
        const change = {
          from: leader,
          to: data.currentLeader,
          timestamp: new Date().toLocaleTimeString()
        };
        setLeaderHistory(prev => [change, ...prev.slice(0, 9)]); // Keep last 10 changes
        setNotice(`🔄 Leader changed: ${leader} → ${data.currentLeader}`);
        setTimeout(() => setNotice(null), 4000);
      }
      setLeader(data.currentLeader);
      setIsCurrentNodeLeader(data.stats?.consensus?.isCurrentNodeLeader || false);
    } catch {}
  };

  useEffect(() => {
    fetchLeader();
    const id = setInterval(fetchLeader, 5000);
    return () => clearInterval(id);
  }, []);

  const submit = async (actionRole) => {
    try {
      const from = `${actionRole}_UI`;
      const recId = recordId || `rec_${Date.now()}`;
      let recordData = {};
      try { recordData = payload ? JSON.parse(payload) : {}; } catch {}

      // Optional: offload to IPFS first if payload is present
      let record = recordData;
      if (Object.keys(recordData).length) {
        const up = await fetch(`${BASE_URL}/api/ipfs/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recordData) });
        const { cid } = await up.json();
        record = { ipfsCid: cid, ipfsUrl: `https://ipfs.io/ipfs/${cid}` };
      }

      const tx = {
        from,
        to: 'ChildWelfare_System',
        amount: 1,
        action: actionForRole(active),
        childRecordId: recId,
        data: record ? { record } : {}
      };

      // Provide domainAction expected by backend PBFT validator
      tx.data = tx.data || {};
      tx.data.domainAction = domainActionForRole(active);
      if (tx.data.domainAction === 'ValidateCase' && !tx.data.decision) {
        tx.data.decision = 'APPROVE';
      }

      // Require MetaMask message signing for every client tx
      if (!window.ethereum) throw new Error('MetaMask not available');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = accounts[0];
      const message = JSON.stringify({ ...tx, timestamp: Date.now() });
      const signature = await window.ethereum.request({ method: 'personal_sign', params: [message, signer] });
      tx.data.ethSignature = signature;

      const resp = await fetch(`${BASE_URL}/transaction`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tx) });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        alert(`Rejected: ${json.message || 'Invalid transaction'}`);
      } else {
        alert(`Submitted: ${json.transactionId}`);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const createBlock = async () => {
    try {
      const resp = await fetch(`${BASE_URL}/block`, { method: 'POST' });
      const json = await resp.json();
      if (json.success) {
        alert(`Block created: ${json.block?.index || 'unknown'}`);
      } else {
        alert(`Failed: ${json.message}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <div className="card" style={{ padding: 12 }}>
      <h3>Role Dashboard</h3>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        {['NGO', 'Government', 'Hospital', 'Auditor', 'Admin'].map((r) => (
          <button key={r} onClick={() => setActive(r)} style={{ background: active === r ? color : 'var(--panel)' }}>{r}</button>
        ))}
      </div>
      <div className="row" style={{ gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <div className="muted">Current Leader:</div>
        <div style={{ color, fontWeight: 'bold' }}>{leader ?? 'N/A'}</div>
        {isCurrentNodeLeader && (
          <div style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '12px' }}>
            YOU ARE LEADER
          </div>
        )}
        {notice && <div className="muted">{notice}</div>}
      </div>

      <div className="grid">
        <div>
          <div className="muted">Record ID</div>
          <input value={recordId} onChange={(e) => setRecordId(e.target.value)} placeholder="rec_123" style={{ padding: 6, width: 280 }} />
        </div>
        <div>
          <div className="muted">Payload (JSON) - optional</div>
          <textarea value={payload} onChange={(e) => setPayload(e.target.value)} placeholder='{"child":{"name":"A"}}' style={{ width: 400, height: 120, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }} />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => submit(active)} style={{ background: color }}>Submit {labelForRole(active)}</button>
        <button 
          onClick={createBlock} 
          style={{ 
            background: isCurrentNodeLeader ? '#22c55e' : '#6b7280', 
            marginLeft: 8,
            opacity: isCurrentNodeLeader ? 1 : 0.6
          }}
          disabled={!isCurrentNodeLeader}
        >
          {isCurrentNodeLeader ? 'Create Block (You are Leader)' : 'Create Block (Not Leader)'}
        </button>
      </div>

      <div className="muted" style={{ marginTop: 8 }}>
        {helpTextForRole(active)}
      </div>

      {/* Leader History */}
      {leaderHistory.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--panel)', borderRadius: 6 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Leader Rotation History</h4>
          <div style={{ maxHeight: 120, overflowY: 'auto' }}>
            {leaderHistory.map((change, i) => (
              <div key={i} style={{ fontSize: '12px', marginBottom: 4, display: 'flex', gap: 8 }}>
                <span className="muted">{change.timestamp}</span>
                <span>🔄 {change.from} → {change.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function actionForRole(role) {
  if (role === 'NGO') return 'create_record';
  if (role === 'Government') return 'approve_record';
  if (role === 'Hospital') return 'update_record';
  if (role === 'Auditor') return 'view_records';
  if (role === 'Admin') return 'transfer_guardianship';
  return 'update_record';
}

function domainActionForRole(role) {
  if (role === 'NGO') return 'OpenCase';
  if (role === 'Government') return 'ValidateCase';
  if (role === 'Hospital') return 'AddMedicalRecord';
  if (role === 'Auditor') return 'AuditCheck';
  if (role === 'Admin') return 'FreezeCase';
  return 'UploadWelfareRecord';
}

function labelForRole(role) {
  if (role === 'NGO') return 'Create Record';
  if (role === 'Government') return 'Approve/Verify';
  if (role === 'Hospital') return 'Update Health Status';
  if (role === 'Auditor') return 'View Records';
  if (role === 'Admin') return 'Transfer Guardianship';
  return 'Submit';
}

function helpTextForRole(role) {
  if (role === 'NGO') return 'NGO creates/registers children. Payload is offloaded to IPFS if large.';
  if (role === 'Government') return 'Government approves/verifies existing records (include recordId).';
  if (role === 'Hospital') return 'Hospital updates medical/health status for a record.';
  if (role === 'Auditor') return 'Auditor can submit a view request; records are visible on Blocks page.';
  if (role === 'Admin') return 'Admin can transfer guardianship for a record.';
  return '';
}


