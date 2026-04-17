'use client';
import Sidebar from './components/Sidebar';

export default function Home() {
  const metrics = [
    { label: 'Completeness', value: '98.2%', change: '+1.3%', positive: true, target: 'Target: 99%', icon: '✅', iconClass: 'metric-icon-green', barClass: 'bar-green', width: '98.2%' },
    { label: 'Validity', value: '94.5%', change: '+2.1%', positive: true, target: 'Target: 98%', icon: '🔍', iconClass: 'metric-icon-purple', barClass: 'bar-purple', width: '94.5%' },
    { label: 'Accuracy', value: '99.1%', change: '+0.5%', positive: true, target: 'Target: 99.5%', icon: '🎯', iconClass: 'metric-icon-amber', barClass: 'bar-amber', width: '99.1%' },
    { label: 'Consistency', value: '97.2%', change: '-0.3%', positive: false, target: 'Target: 98%', icon: '🔗', iconClass: 'metric-icon-cyan', barClass: 'bar-cyan', width: '97.2%' },
    { label: 'Timeliness', value: '100%', change: '+0.0%', positive: true, target: 'Target: 100%', icon: '⏱️', iconClass: 'metric-icon-violet', barClass: 'bar-violet', width: '100%' },
    { label: 'Uniqueness', value: '96.8%', change: '+1.7%', positive: true, target: 'Target: 99%', icon: '🔑', iconClass: 'metric-icon-rose', barClass: 'bar-rose', width: '96.8%' },
  ];

  const jobs = [
    { id: '#DQ-8812', dataset: 'Banking Transactions', records: '12,450', masking: 'DPDP Masked', status: 'complete', time: '2 min ago' },
    { id: '#DQ-8813', dataset: 'Patient EHR Records', records: '8,230', masking: 'DPDP Masked', status: 'complete', time: '5 min ago' },
    { id: '#DQ-8814', dataset: 'Loan Applications', records: '3,102', masking: 'Processing', status: 'processing', time: 'In progress' },
    { id: '#DQ-8815', dataset: 'Insurance Claims', records: '6,780', masking: 'Queued', status: 'processing', time: 'Pending' },
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
              <div className="metric-footer">
                <span className={`metric-change ${m.positive ? 'positive' : 'negative'}`}>
                  {m.positive ? '↑' : '↓'} {m.change}
                </span>
                <span className="metric-target">{m.target}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Workflow Jobs Table */}
        <section className="panel">
          <div className="panel-header">
            <h2>Workflow Automation Pipeline</h2>
            <button className="btn btn-ghost">View All Jobs</button>
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
                {jobs.map((job, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-300)' }}>{job.id}</td>
                    <td>{job.dataset}</td>
                    <td>{job.records}</td>
                    <td><span className={`badge ${job.masking === 'DPDP Masked' ? 'badge-success' : 'badge-warning'}`}>{job.masking}</span></td>
                    <td>
                      <span className={`status-dot ${job.status}`}></span>
                      {job.status === 'complete' ? 'Complete' : 'Processing'}
                    </td>
                    <td style={{ color: 'var(--slate-500)', fontSize: '0.82rem' }}>{job.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
