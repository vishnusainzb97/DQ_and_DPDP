'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: 40 }}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>DataGuard</h2>
          <p style={{ fontSize: '0.8rem' }}>Enterprise DQ & DPDP</p>
        </div>
        <nav>
          <Link href="/" className="nav-link active">
            <span style={{ marginRight: 10 }}>📊</span> Dashboard
          </Link>
          <Link href="/metadata" className="nav-link">
            <span style={{ marginRight: 10 }}>🗃️</span> Schema & Masking
          </Link>
          <Link href="/rules" className="nav-link">
            <span style={{ marginRight: 10 }}>🤖</span> DQ Rules (Gemma AI)
          </Link>
          <Link href="/login" className="nav-link" style={{ marginTop: 'auto', display: 'flex', position: 'absolute', bottom: 20, width: 'calc(100% - 48px)' }}>
            <span style={{ marginRight: 10 }}>👤</span> Identity / RBAC
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-nav">
          <div>
            <h1>Overview</h1>
            <p>6 Dimensions of Data Quality Engine</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-warning">Local LLM Active</span>
            <span className="badge badge-primary">Admin Role</span>
          </div>
        </header>

        <section className="stats-grid">
          <div className="glass-card">
            <h3>Completeness</h3>
            <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>98.2%</div>
            <p style={{ fontSize: '0.85rem', marginTop: 10 }}>Health records dataset</p>
          </div>
          <div className="glass-card">
            <h3>Validity</h3>
            <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>94.5%</div>
            <p style={{ fontSize: '0.85rem', marginTop: 10 }}>PII Regex compliance</p>
          </div>
          <div className="glass-card">
            <h3>Accuracy</h3>
            <div className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>99.1%</div>
            <p style={{ fontSize: '0.85rem', marginTop: 10 }}>Matches source banking DB</p>
          </div>
        </section>

        <section>
          <h2>Workflow Automation Status</h2>
          <div className="glass-panel" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 15 }}>
              <div><strong>Job ID</strong></div>
              <div><strong>Dataset</strong></div>
              <div><strong>Masking Rule</strong></div>
              <div><strong>Status</strong></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
              <div>#DQ-8812</div>
              <div>Banking Transactions</div>
              <div><span className="badge badge-primary">DPDP Masked</span></div>
              <div style={{ color: 'var(--success)' }}>Complete</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>#DQ-8813</div>
              <div>Patient EHR</div>
              <div><span className="badge badge-primary">DPDP Masked</span></div>
              <div style={{ color: 'var(--success)' }}>Complete</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
