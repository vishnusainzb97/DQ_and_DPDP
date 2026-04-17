'use client';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useDQContext } from '../context/DQContext';

export default function MetadataPage() {
  const [activeTab, setActiveTab] = useState('schema');
  const { analysisResult } = useDQContext();

  const renderContent = () => {
    if (!analysisResult) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
          <h2 style={{ color: 'var(--slate-300)', marginBottom: 8 }}>No Data Loaded</h2>
          <p>Please upload a dataset on the Dashboard to view its schema and masked preview.</p>
        </div>
      );
    }

    if (activeTab === 'schema') {
      return (
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
            <div className="schema-block" style={{ gridColumn: 'span 2' }}>
              <div className="schema-block-header">
                <div className="schema-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>📄</div>
                <div>
                  <h3>{analysisResult.filename}</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--slate-500)' }}>{analysisResult.columns} columns · {analysisResult.rows} rows</p>
                </div>
              </div>
              <div className="column-list">
                {analysisResult.schema.map((col, i) => {
                  const isPii = analysisResult.pii_columns && analysisResult.pii_columns[col.column_name];
                  return (
                    <div className="column-item" key={i}>
                      <span className="column-name">{col.column_name}</span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {isPii && (
                          <span className="column-pii" title={analysisResult.pii_columns[col.column_name].reason}>
                            🔴 PII ({analysisResult.pii_columns[col.column_name].pattern_match || 'Keyword Match'})
                          </span>
                        )}
                        <span className="column-type">{col.dtype}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'masked') {
      if (!analysisResult.masked_preview || analysisResult.masked_preview.length === 0) {
        return <div>No preview available</div>;
      }
      const headers = Object.keys(analysisResult.masked_preview[0]);
      
      return (
        <div className="panel" style={{ marginBottom: 24, overflowX: 'auto' }}>
          <div className="panel-header">
            <h2>Masked Preview: {analysisResult.filename}</h2>
            <span className="badge badge-success">DPDP Compliant</span>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {analysisResult.masked_preview.map((row, i) => (
                  <tr key={i}>
                    {headers.map(h => {
                      const isPii = analysisResult.pii_columns && analysisResult.pii_columns[h];
                      return (
                        <td key={h} className={isPii ? 'masked-cell' : ''}>
                          {row[h] !== null ? String(row[h]) : 'NULL'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

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

        {renderContent()}

      </main>
    </div>
  );
}
