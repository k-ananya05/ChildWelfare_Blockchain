import React, { useEffect, useMemo, useRef, useState } from 'react';
import BlockVisualizer from '../components/BlockVisualizer.jsx';
import TransactionHistory from '../components/TransactionHistory.jsx';
import TxStatus from '../components/TxStatus.jsx';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5002';

export default function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [filter, setFilter] = useState({ sender: '', leader: '' });
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [signOnly, setSignOnly] = useState(false);
  const wsRef = useRef(null);

  const fetchBlocks = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/blocks?limit=50`);
      const data = await res.json();
      setBlocks(data.blocks || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchBlocks();
    const id = setInterval(fetchBlocks, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === 'tx_confirmed') {
            setTxStatus((prev) =>
              prev?.hash === msg?.data?.txId
                ? { ...prev, status: 'confirmed', confirmedIn: msg?.data?.blockIndex }
                : prev
            );
            fetchBlocks();
          }
        } catch {}
      };
      return () => ws.close();
    } catch {}
  }, []);

  const filteredBlocks = useMemo(() => {
    return (blocks || []).filter((b) => {
      const leaderOk = filter.leader ? String(b.leader || '').toLowerCase().includes(filter.leader.toLowerCase()) : true;
      const senderOk = filter.sender
        ? (Array.isArray(b.transactions) ? b.transactions.some(tx => String(tx.from || '').toLowerCase().includes(filter.sender.toLowerCase())) : false)
        : true;
      return leaderOk && senderOk;
    });
  }, [blocks, filter]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask not found');
      return;
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setConnectedAccount(accounts[0]);
  };

  const createChildRecord = async (json) => {
    try {
      const uploadRes = await fetch(`${BASE_URL}/api/ipfs/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      const { cid, url } = await uploadRes.json();

      if (!window.ethereum) throw new Error('MetaMask not available');

      // Option A: Gasless demo (message signature only)
      if (signOnly) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const from = accounts[0];
        const message = `ipfs:${cid}`;
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, from]
        });
        setTxStatus({ signature, status: 'signed', ipfsCid: cid, ipfsUrl: url });
        return;
      }

      // Option B: On-chain tx (0 ETH). Try zero-gas first; fallback to default gas if wallet rejects.
      const { ethers } = await import('https://cdn.skypack.dev/ethers@5.7.2');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const fromAddr = await signer.getAddress();

      let txResp;
      try {
        const txReqNoDataZeroGas = {
          to: fromAddr,
          value: ethers.utils.parseEther('0.0'),
          maxFeePerGas: 0,
          maxPriorityFeePerGas: 0
        };
        txResp = await signer.sendTransaction(txReqNoDataZeroGas);
      } catch (err) {
        const txReqNoData = { to: fromAddr, value: ethers.utils.parseEther('0.0') };
        txResp = await signer.sendTransaction(txReqNoData);
      }

      setTxStatus({ hash: txResp.hash, status: 'pending', ipfsCid: cid, ipfsUrl: url });

      const receipt = await txResp.wait();
      if (receipt?.status === 1) {
        setTxStatus((prev) => ({ ...prev, status: 'confirmed' }));
        fetchBlocks();
      } else {
        setTxStatus((prev) => ({ ...prev, status: 'failed' }));
      }
    } catch (e) {
      alert(`Failed to create record: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={connectWallet}>
          {connectedAccount ? `Connected: ${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}` : 'Connect Wallet'}
        </button>
        <input
          placeholder="Filter by sender"
          value={filter.sender}
          onChange={(e) => setFilter((f) => ({ ...f, sender: e.target.value }))}
          style={{ padding: 6 }}
        />
        <input
          placeholder="Filter by leader"
          value={filter.leader}
          onChange={(e) => setFilter((f) => ({ ...f, leader: e.target.value }))}
          style={{ padding: 6 }}
        />
        <label className="row" style={{ gap: 6 }}>
          <input type="checkbox" checked={signOnly} onChange={(e) => setSignOnly(e.target.checked)} />
          Sign only (no gas)
        </label>
        <button
          onClick={() =>
            createChildRecord({
              recordId: `rec_${Date.now()}`,
              child: { name: 'Test Child', dob: '2015-01-01' },
              guardian: { name: 'Jane Doe' },
              meta: { createdAt: new Date().toISOString() }
            })
          }
        >
          Create Child Record (Demo)
        </button>
      </div>

      <TxStatus baseUrl={BASE_URL} status={txStatus} />
      <BlockVisualizer baseUrl={BASE_URL} blocks={filteredBlocks} />
      <TransactionHistory blocks={filteredBlocks} />
    </div>
  );
}


