'use client';
import { useRef } from 'react';
import Sidebar from './components/Sidebar';
import { useDQContext } from './context/DQContext';

export default function Home() {
  const { analysisResult, isLoading, error, uploadFile } = useDQContext();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleSampleDataUpload = async () => {
    try {
      const response = await fetch('/HDFC_Sample_Data.xlsx');
      const blob = await response.blob();
      const file = new File([blob], 'HDFC_Sample_Data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      uploadFile(file);
    } catch (err) {
      console.error("Failed to load sample data", err);
      alert("Failed to load sample data.");
    }
  };

  const getMetricData = (name, fallbackScore, icon, iconClass, barClass) => {
    if (!analysisResult || !analysisResult.dq_results || !analysisResult.dq_results[name]) {
      return { label: name, value: '---', score: 0, icon, iconClass, barClass, width: '0%', details: 'Upload data to view' };
    }
    const score = analysisResult.dq_results[name].score;
    return {
      label: name,
      value: `${score}%`,
      score: score,
      icon, 
      iconClass, 
      barClass, 
      width: `${score}%`,
      details: analysisResult.dq_results[name].details
    };
  };

  const metrics = [
    getMetricData('Completeness', 0, '✅', 'metric-icon-green', 'bar-green'),
    getMetricData('Validity', 0, '🔍', 'metric-icon-purple', 'bar-purple'),
    getMetricData('Accuracy', 0, '🎯', 'metric-icon-amber', 'bar-amber'),
    getMetricData('Consistency', 0, '🔗', 'metric-icon-cyan', 'bar-cyan'),
    getMetricData('Timeliness', 0, '⏱️', 'metric-icon-violet', 'bar-violet'),
    getMetricData('Uniqueness', 0, '🔑', 'metric-icon-rose', 'bar-rose'),
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1>Dashboard</h1>
            <p>Real-time data quality monitoring across 6 dimensions</p>
          </div>
          <div className="top-bar-actions">
            <span className="badge badge-success">
              <span className="badge-dot"></span>
              Gemma LLM Online
            </span>
            <span className="badge badge-primary">Admin Role</span>
          </div>
        </header>

        {/* Upload Section */}
        <section className="panel" style={{ marginBottom: 24 }}>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <h2 style={{ marginBottom: 16 }}>Upload Dataset for Processing</h2>
            <p style={{ color: 'var(--slate-400)', marginBottom: 20 }}>
              Upload a `.csv` or `.xlsx` file. Our pipeline will instantly extract metadata, mask PII, run 6 DQ checks, and generate business rules via local AI.
            </p>
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => fileInputRef.current.click()}
                disabled={isLoading}
                style={{ padding: '12px 24px', fontSize: '1.1rem' }}
              >
                {isLoading ? (
                  <><span className="loading-spinner"></span> Processing Pipeline...</>
                ) : (
                  '⬆️ Select Data File'
                )}
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={handleSampleDataUpload}
                disabled={isLoading}
                style={{ padding: '12px 24px', fontSize: '1.1rem', backgroundColor: 'var(--primary-800)', border: '1px solid var(--primary-600)', color: 'white' }}
              >
                {isLoading ? (
                  <><span className="loading-spinner"></span> Please Wait...</>
                ) : (
                  '📄 Load HDFC Sample Data'
                )}
              </button>
            </div>
            {error && <div style={{ color: '#ef4444', marginTop: 16 }}>Error: {error}</div>}
          </div>
        </section>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ width: 48, height: 48, borderWidth: 4, marginBottom: 20 }}></div>
            <h2 style={{ color: 'var(--slate-300)', marginBottom: 8 }}>Running Enterprise Pipeline...</h2>
            <p style={{ color: 'var(--slate-400)' }}>1. Schema Extraction → 2. Checking PII → 3. Checking DQ Dimensions → 4. Gemma LLM Rules Generation</p>
          </div>
        ) : (
          <>
            {/* 6 DQ Dimension Cards */}
            <section className="metrics-grid">
              {metrics.map((m, i) => (
                <div className="metric-card" key={i}>
                  <div className="metric-header">
                    <h3>{m.label}</h3>
                    <div className={`metric-icon ${m.iconClass}`}>{m.icon}</div>
                  </div>
                  <div className="metric-value text-gradient">{m.value}</div>
                  <div className="metric-bar">
                    <div className={`metric-bar-fill ${m.barClass}`} style={{ width: m.width }}></div>
                  </div>
                  <div className="metric-footer" style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    {m.details}
                  </div>
                </div>
              ))}
            </section>

            {/* Workflow Jobs Table */}
            {analysisResult && (
              <section className="panel">
                <div className="panel-header">
                  <h2>Current Workflow Job</h2>
                </div>
                <div className="panel-body">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Dataset</th>
                        <th>Records</th>
                        <th>Masking</th>
                        <th>Status</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--primary-300)' }}>#DQ-LIVE</td>
                        <td>{analysisResult.filename}</td>
                        <td>{analysisResult.rows?.toLocaleString()}</td>
                        <td><span className="badge badge-success">DPDP Masked</span></td>
                        <td>
                          <span className="status-dot complete"></span>
                          Complete
                        </td>
                        <td style={{ color: 'var(--slate-500)', fontSize: '0.82rem' }}>Just now</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
