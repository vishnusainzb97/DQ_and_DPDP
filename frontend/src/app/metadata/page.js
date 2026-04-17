'use client';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function MetadataPage() {
  const [activeTab, setActiveTab] = useState('schema');

  const bankingSchema = [
    { name: 'id', type: 'INTEGER', pii: false },
    { name: 'account_number', type: 'VARCHAR', pii: false },
    { name: 'customer_name', type: 'VARCHAR', pii: true },
    { name: 'ssn', type: 'VARCHAR', pii: true },
    { name: 'transaction_amount', type: 'INTEGER', pii: false },
    { name: 'status', type: 'VARCHAR', pii: false },
    { name: 'is_flagged', type: 'BOOLEAN', pii: false },
  ];

  const healthSchema = [
    { name: 'id', type: 'INTEGER', pii: false },
    { name: 'patient_id', type: 'VARCHAR', pii: false },
    { name: 'patient_name', type: 'VARCHAR', pii: true },
    { name: 'dob', type: 'VARCHAR', pii: true },
    { name: 'diagnosis_code', type: 'VARCHAR', pii: false },
    { name: 'blood_type', type: 'VARCHAR', pii: false },
    { name: 'bill_amount', type: 'INTEGER', pii: false },
  ];

  const maskedBanking = [
    { id: 1, account_number: 'ACT-4821', customer_name: 'C***', ssn: '***-**-****', transaction_amount: 2340, status: 'APPROVED' },
    { id: 2, account_number: 'ACT-7193', customer_name: 'C***', ssn: '***-**-****', transaction_amount: 890, status: 'PENDING' },
    { id: 3, account_number: 'ACT-3562', customer_name: 'C***', ssn: '***-**-****', transaction_amount: 4510, status: 'APPROVED' },
  ];

  const maskedHealth = [
    { id: 1, patient_id: 'PT-482', patient_name: 'P***', dob: '****-**-** (MASKED)', diagnosis_code: 'A01', blood_type: 'O+', bill_amount: 12500 },
    { id: 2, patient_id: 'PT-713', patient_name: 'P***', dob: '****-**-** (MASKED)', diagnosis_code: 'B02', blood_type: 'A-', bill_amount: 8900 },
    { id: 3, patient_id: 'PT-256', patient_name: 'P***', dob: '****-**-** (MASKED)', diagnosis_code: 'C03', blood_type: 'B+', bill_amount: 15600 },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1>Schema & Data Masking</h1>
            <p>Read-only schema inspection with DPDP-compliant PII masking</p>
          </div>
          <div className="top-bar-actions">
            <button
              className={`btn ${activeTab === 'schema' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('schema')}
            >
              Schema View
            </button>
            <button
              className={`btn ${activeTab === 'masked' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('masked')}
            >
              Masked Preview
            </button>
          </div>
        </header>

        {activeTab === 'schema' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div className="panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>🔒</span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                  <strong style={{ color: 'var(--amber-400)' }}>Privacy First:</strong> Only metadata schema is extracted — no actual data is read, transferred, or stored. Fully DPDP Act compliant.
                </p>
              </div>
            </div>
            <div className="schema-grid">
              {/* Banking Schema */}
              <div className="schema-block">
                <div className="schema-block-header">
                  <div className="schema-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>🏦</div>
                  <div>
                    <h3>banking_transactions</h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--slate-500)' }}>7 columns · 10 rows</p>
                  </div>
                </div>
                <div className="column-list">
                  {bankingSchema.map((col, i) => (
                    <div className="column-item" key={i}>
                      <span className="column-name">{col.name}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {col.pii && <span className="column-pii">🔴 PII</span>}
                        <span className="column-type">{col.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Schema */}
              <div className="schema-block">
                <div className="schema-block-header">
                  <div className="schema-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>🏥</div>
                  <div>
                    <h3>patient_ehr</h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--slate-500)' }}>7 columns · 10 rows</p>
                  </div>
                </div>
                <div className="column-list">
                  {healthSchema.map((col, i) => (
                    <div className="column-item" key={i}>
                      <span className="column-name">{col.name}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {col.pii && <span className="column-pii">🔴 PII</span>}
                        <span className="column-type">{col.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'masked' && (
          <>
            <div className="panel" style={{ marginBottom: 24 }}>
              <div className="panel-header">
                <h2>🏦 Banking Transactions — Masked Preview</h2>
                <span className="badge badge-success">DPDP Compliant</span>
              </div>
              <div className="panel-body">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Account</th><th>Customer Name</th><th>SSN</th><th>Amount</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maskedBanking.map((row, i) => (
                      <tr key={i}>
                        <td>{row.id}</td>
                        <td>{row.account_number}</td>
                        <td className="masked-cell">{row.customer_name}</td>
                        <td className="masked-cell">{row.ssn}</td>
                        <td>₹{row.transaction_amount.toLocaleString()}</td>
                        <td><span className={`badge ${row.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>🏥 Patient EHR — Masked Preview</h2>
                <span className="badge badge-success">DPDP Compliant</span>
              </div>
              <div className="panel-body">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Patient ID</th><th>Name</th><th>DOB</th><th>Diagnosis</th><th>Blood</th><th>Bill</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maskedHealth.map((row, i) => (
                      <tr key={i}>
                        <td>{row.id}</td>
                        <td>{row.patient_id}</td>
                        <td className="masked-cell">{row.patient_name}</td>
                        <td className="masked-cell">{row.dob}</td>
                        <td>{row.diagnosis_code}</td>
                        <td>{row.blood_type}</td>
                        <td>₹{row.bill_amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
