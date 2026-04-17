'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: '📊', label: 'Dashboard' },
    { href: '/metadata', icon: '🗄️', label: 'Schema & Masking' },
    { href: '/rules', icon: '🤖', label: 'AI Rules Engine' },
    { href: '/dq-metrics', icon: '📈', label: 'DQ Dimensions' },
    { href: '/clean-export', icon: '🧹', label: 'Clean & Export' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🛡️</div>
        <div>
          <h2 className="text-gradient">DataGuard</h2>
          <p>Enterprise DQ · DPDP</p>
        </div>
      </div>

      <div className="sidebar-section-label">Analytics</div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${pathname === item.href ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}

      <div className="sidebar-section-label">System</div>
      <Link href="/login" className={`nav-link ${pathname === '/login' ? 'active' : ''}`}>
        <span className="nav-icon">🔐</span>
        RBAC & Identity
      </Link>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">VS</div>
          <div className="user-info">
            <span>Vishnu Sai</span>
            <small>Data Admin</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
