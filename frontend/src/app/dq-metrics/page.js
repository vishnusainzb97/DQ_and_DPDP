'use client';
import Sidebar from '../components/Sidebar';
import { useDQContext } from '../context/DQContext';

export default function DqMetricsPage() {
  const { analysisResult } = useDQContext();

  const getDimData = (name, dIcon, color, description) => {
    if (!analysisResult || !analysisResult.dq_results) {
      return {
        name, icon: dIcon, score: 0, color, description, issues: ['No data loaded.']
      };
    }
    const data = analysisResult.dq_results[name] || { score: 0, details: '', issues: [] };
    return {
      name, icon: dIcon, score: data.score, color, description, issues: data.issues, details: data.details
    };
  };

  const dimensions = [
    getDimData('Completeness', '✅', '#10b981', 'Measures whether all required data fields are populated with valid, non-null values.'),
    getDimData('Validity', '🔍', '#6366f1', 'Ensures data conforms to defined formats, patterns, and business constraints.'),
    getDimData('Accuracy', '🎯', '#f59e0b', 'Validates that data values correctly represent real-world entities and facts.'),
    getDimData('Consistency', '🔗', '#22d3ee', 'Checks that the same data across systems and time does not contradict itself.'),
    getDimData('Timeliness', '⏱️', '#a78bfa', 'Ensures data is available when needed and reflects the most current state.'),
    getDimData('Uniqueness', '🔑', '#fb7185', 'Ensures no unintended duplicate records exist within or across datasets.'),
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1>6 Dimensions of Data Quality</h1>
            <p>Detailed breakdown of each DQ dimension across Datasets</p>
          </div>
        </header>

        {!analysisResult ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📈</div>
            <h2 style={{ color: 'var(--slate-300)', marginBottom: 8 }}>Metrics Pending</h2>
            <p>Please upload a dataset on the Dashboard to execute the pipeline.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
            {dimensions.map((dim, i) => (
              <div className="panel" key={i}>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `${dim.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem'
                      }}>
                        {dim.icon}
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{dim.name}</h2>
                        <p style={{ margin: 0, fontSize: '0.82rem' }}>{dim.description}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: dim.color }}>
                        {dim.score}%
                      </div>
                      <span className={`badge ${dim.score >= 98 ? 'badge-success' : dim.score >= 95 ? 'badge-primary' : 'badge-warning'}`}>
                        {dim.score >= 98 ? 'Excellent' : dim.score >= 95 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    width: '100%', height: 6, borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    marginBottom: 20
                  }}>
                    <div style={{
                      width: `${dim.score}%`, height: '100%', borderRadius: 999,
                      background: `linear-gradient(90deg, ${dim.color}, ${dim.color}88)`,
                      transition: 'width 1s ease'
                    }}></div>
                  </div>

                  {/* Breakdown */}
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 8, padding: 16, border: '1px solid rgba(255,255,255,0.04)'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--slate-400)', marginBottom: 12 }}>
                      <strong>Summary:</strong> {dim.details}
                    </p>
                    {dim.issues && dim.issues.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.82rem', color: 'var(--slate-300)' }}>
                        {dim.issues.map((issue, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--emerald-400)' }}>✓ No issues found. Data strictly meets constraints.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
