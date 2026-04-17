'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();

  return (
    <div className="auth-container">
      <div className="glass-panel" style={{ maxWidth: 400, width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 30 }} className="text-gradient">Platform Login</h2>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>Email / Username</label>
          <input type="text" className="glass-input" defaultValue="admin@enterprise.com" />
        </div>

        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>Password</label>
          <input type="password" className="glass-input" defaultValue="password123" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>Select Role (RBAC Demo)</label>
          <select className="glass-input" style={{ appearance: 'none' }}>
            <option value="admin">Data Admin</option>
            <option value="steward">Data Steward</option>
            <option value="viewer">Business Viewer</option>
          </select>
        </div>

        <button className="glass-button" onClick={() => router.push('/')}>
          Authenticate Request
        </button>
      </div>
    </div>
  );
}
