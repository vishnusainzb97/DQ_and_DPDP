'use client';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useDQContext } from '../context/DQContext';

export default function CleanExportPage() {
  const { analysisResult, cleanResult, isCleanLoading, cleanError, runCleanTransform } = useDQContext();
  const [activeTab, setActiveTab] = useState('log');

  const handleExport = async (format) => {
    try {
      const res = await fetch(`http://localhost:8000/api/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_data.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const dimensionColors = {
    'Completeness': '#10b981',
    'Validity': '#6366f1',
    'Accuracy': '#f59e0b',
    'Consistency': '#22d3ee',
    'Timeliness': '#a78bfa',
    'Uniqueness': '#fb7185',
    'PII Masking': '#34d399',
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1>Clean & Export</h1>
            <p>Transform, clean, mask, and export your dataset — aligned with 6 DQ dimensions</p>
          </div>
          {cleanResult && (
            <div className="top-bar-actions">
              <button className="btn btn-export btn-export-excel" onClick={() => handleExport('xlsx')}>
                📥 Export Excel
              </button>
              <button className="btn btn-export btn-export-csv" onClick={() => handleExport('csv')}>
                📄 Export CSV
              </button>
            </div>
          )}
        </header>

        {!analysisResult ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧹</div>
            <h2 style={{ color: 'var(--slate-300)', marginBottom: 8 }}>No Data Loaded</h2>
            <p>Please upload a dataset on the Dashboard first. Then return here to clean, transform, and export.</p>
          </div>
        ) : !cleanResult ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="panel" style={{ maxWidth: 600, margin: '0 auto', padding: 40 }}>
              <div style={{ fontSize: '3rem', marginBottom: 20 }}>⚡</div>
              <h2 style={{ marginBottom: 12 }}>Ready to Clean & Transform</h2>
              <p style={{ marginBottom: 8 }}>
                Dataset: <strong style={{ color: 'var(--primary-300)' }}>{analysisResult.filename}</strong> — {analysisResult.rows} rows × {analysisResult.columns} columns
              </p>
              <p style={{ marginBottom: 24, fontSize: '0.82rem' }}>
                This will apply all 6 DQ transformations (remove duplicates, fill nulls, cap outliers, standardize casing, flag stale dates) and mask PII columns.
              </p>
              <button
                className="btn btn-primary"
                onClick={runCleanTransform}
                disabled={isCleanLoading}
                style={{ padding: '14px 32px', fontSize: '1.05rem' }}
              >
                {isCleanLoading ? (
                  <><span className="loading-spinner"></span> Running Cleaning Pipeline...</>
                ) : (
                  '🚀 Run Cleaning Pipeline'
                )}
              </button>
              {cleanError && <div style={{ color: '#ef4444', marginTop: 16 }}>Error: {cleanError}</div>}
            </div>
          </div>
        ) : (
          <>
            {/* Before vs After Stats */}
            <section className="before-after-grid">
              {[
                { label: 'Rows', before: cleanResult.before_after.rows_before, after: cleanResult.before_after.rows_after, icon: '📊', color: '#6366f1' },
                { label: 'Nulls Fixed', before: cleanResult.before_after.nulls_before, after: cleanResult.before_after.nulls_after, icon: '✅', color: '#10b981' },
                { label: 'Duplicates Removed', before: cleanResult.before_after.duplicates_removed, after: 0, icon: '🔑', color: '#fb7185' },
                { label: 'Columns', before: cleanResult.before_after.cols_before, after: cleanResult.before_after.cols_after, icon: '📐', color: '#a78bfa' },
                { label: 'PII Masked', before: cleanResult.before_after.pii_columns_masked, after: cleanResult.before_after.pii_columns_masked, icon: '🛡️', color: '#34d399' },
                { label: 'Transformations', before: '', after: cleanResult.before_after.total_transformations, icon: '⚡', color: '#f59e0b' },
              ].map((stat, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-card-icon" style={{ background: `${stat.color}18`, color: stat.color }}>{stat.icon}</div>
                  <div className="stat-card-info">
                    <div className="stat-card-label">{stat.label}</div>
                    <div className="stat-card-value" style={{ color: stat.color }}>
                      {stat.before !== '' && stat.label !== 'Duplicates Removed' && stat.label !== 'PII Masked' && stat.label !== 'Transformations'
                        ? <>{stat.before} <span className="stat-arrow">→</span> {stat.after}</>
                        : stat.label === 'Duplicates Removed'
                          ? stat.before
                          : stat.after
                      }
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <button className={`btn ${activeTab === 'log' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('log')}>
                Transformation Log
              </button>
              <button className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('preview')}>
                Cleaned Data Preview
              </button>
            </div>

            {activeTab === 'log' && (
              <section className="panel">
                <div className="panel-header">
                  <h2>Transformation Log</h2>
                  <span className="badge badge-success">{cleanResult.transformation_log.length} Actions</span>
                </div>
                <div style={{ padding: 0 }}>
                  {cleanResult.transformation_log.map((entry, i) => (
                    <div className="transform-log-item" key={i}>
                      <div className="transform-log-icon">{entry.icon}</div>
                      <div className="transform-log-body">
                        <div className="transform-log-dimension" style={{ color: dimensionColors[entry.dimension] || '#94a3b8' }}>
                          {entry.dimension}
                        </div>
                        <div className="transform-log-action">{entry.action}</div>
                      </div>
                      <div className="transform-log-count" style={{ color: entry.count > 0 ? dimensionColors[entry.dimension] : 'var(--slate-600)' }}>
                        {entry.count > 0 ? `${entry.count} affected` : 'Clean ✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'preview' && cleanResult.cleaned_preview && (
              <section className="panel" style={{ overflowX: 'auto' }}>
                <div className="panel-header">
                  <h2>Cleaned & Masked Preview (First 15 Rows)</h2>
                  <span className="badge badge-success">DPDP Compliant</span>
                </div>
                <div className="panel-body">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {Object.keys(cleanResult.cleaned_preview[0] || {}).map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cleanResult.cleaned_preview.map((row, i) => (
                        <tr key={i}>
                          {Object.entries(row).map(([key, val]) => {
                            const isPii = analysisResult?.pii_columns?.[key];
                            return (
                              <td key={key} className={isPii ? 'masked-cell' : ''}>
                                {val !== null && val !== undefined ? String(val) : 'NULL'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Export Section */}
            <section className="panel" style={{ marginTop: 24 }}>
              <div style={{ padding: 32, textAlign: 'center' }}>
                <h2 style={{ marginBottom: 12 }}>📥 Export Cleaned Dataset</h2>
                <p style={{ marginBottom: 24 }}>Download the fully cleaned, transformed, and PII-masked dataset for production use.</p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <button className="btn btn-export btn-export-excel" onClick={() => handleExport('xlsx')} style={{ padding: '14px 28px', fontSize: '1rem' }}>
                    📗 Download as Excel (.xlsx)
                  </button>
                  <button className="btn btn-export btn-export-csv" onClick={() => handleExport('csv')} style={{ padding: '14px 28px', fontSize: '1rem' }}>
                    📄 Download as CSV (.csv)
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
