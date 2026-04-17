'use client';
import Sidebar from '../components/Sidebar';

export default function DqMetricsPage() {
  const dimensions = [
    {
      name: 'Completeness',
      icon: '✅',
      score: 98.2,
      color: '#10b981',
      description: 'Measures whether all required data fields are populated with valid, non-null values.',
      banking: '99.1%',
      health: '97.3%',
      rules: 'Non-null checks on account_number, patient_id, ssn, dob'
    },
    {
      name: 'Validity',
      icon: '🔍',
      score: 94.5,
      color: '#6366f1',
      description: 'Ensures data conforms to defined formats, patterns, and business constraints.',
      banking: '96.2%',
      health: '92.8%',
      rules: 'Regex validation on SSN format, ISO date checks on DOB'
    },
    {
      name: 'Accuracy',
      icon: '🎯',
      score: 99.1,
      color: '#f59e0b',
      description: 'Validates that data values correctly represent real-world entities and facts.',
      banking: '99.5%',
      health: '98.7%',
      rules: 'Cross-reference diagnosis_code against ICD-10, amount range checks'
    },
    {
      name: 'Consistency',
      icon: '🔗',
      score: 97.2,
      color: '#22d3ee',
      description: 'Checks that the same data across systems and time does not contradict itself.',
      banking: '98.0%',
      health: '96.4%',
      rules: 'Enum enforcement on status, blood_type standardization'
    },
    {
      name: 'Timeliness',
      icon: '⏱️',
      score: 100.0,
      color: '#a78bfa',
      description: 'Ensures data is available when needed and reflects the most current state.',
      banking: '100%',
      health: '100%',
      rules: '15-min SLA on banking ingestion, 90-day staleness flag on EHR'
    },
    {
      name: 'Uniqueness',
      icon: '🔑',
      score: 96.8,
      color: '#fb7185',
      description: 'Ensures no unintended duplicate records exist within or across datasets.',
      banking: '98.5%',
      health: '95.1%',
      rules: 'Composite key dedup for transactions, fuzzy name matching for patients'
    },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-bar">
          <div>
            <h1>6 Dimensions of Data Quality</h1>
            <p>Detailed breakdown of each DQ dimension across Banking & Healthcare datasets</p>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
                  padding: 16, background: 'rgba(255,255,255,0.02)',
                  borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate-500)', marginBottom: 4 }}>Banking</p>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-200)' }}>{dim.banking}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate-500)', marginBottom: 4 }}>Healthcare</p>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-200)' }}>{dim.health}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate-500)', marginBottom: 4 }}>Active Rules</p>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--slate-300)' }}>{dim.rules}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
