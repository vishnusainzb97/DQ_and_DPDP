'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/');
    }, 1200);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="text-gradient">DataGuard</h1>
        <p>Enterprise Identity & Access Control</p>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-input" defaultValue="admin@enterprise.com" />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-input" defaultValue="••••••••••" />
        </div>

        <div className="form-group">
          <label className="form-label">Access Role (RBAC)</label>
          <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">🛡️  Data Admin — Full Access</option>
            <option value="steward">📋  Data Steward — Edit Rules & Masking</option>
            <option value="viewer">👁️  Business Viewer — Read Only</option>
          </select>
        </div>

        <button className="btn-auth" onClick={handleLogin} disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="loading-spinner"></span>
              Authenticating...
            </span>
          ) : (
            'Sign In Securely'
          )}
        </button>

        <div className="auth-divider">RBAC DEMO MODE</div>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--slate-500)' }}>
          Select any role above to experience different permission levels across the platform.
        </p>
      </div>
    </div>
  );
}
