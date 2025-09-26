import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Blocks from './pages/Blocks.jsx'
import './index.css'
import RoleDashboard from './components/RoleDashboard.jsx'
import ContractInteraction from './components/ContractInteraction.jsx'

function Home() {
  return (
    <div style={{ padding: 16 }}>
      <h2>Child Welfare Blockchain</h2>
      <p>Navigate to the Blocks view to see recent blocks.</p>
      <Link to="/blocks">Go to Blocks</Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <nav className="row panel" style={{ padding: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/blocks">Blocks</Link>
        <Link to="/roles">Roles</Link>
        <Link to="/contract">Contract</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blocks" element={<Blocks />} />
        <Route path="/roles" element={<RoleDashboard />} />
        <Route path="/contract" element={<ContractInteraction />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)


