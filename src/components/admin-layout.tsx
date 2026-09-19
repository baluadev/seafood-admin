'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/store/admin-auth.store';

const NAV = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/products', icon: '🦐', label: 'Sản phẩm' },
  { href: '/dashboard/categories', icon: '📂', label: 'Danh mục' },
  { href: '/dashboard/sliders', icon: '🖼️', label: 'Sliders' },
  { href: '/dashboard/orders', icon: '📦', label: 'Đơn hàng' },
  { href: '/dashboard/users', icon: '👥', label: 'Người dùng' },
];

export function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🦐</span>
            <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'white' }}>
              Sea<span style={{ color: 'var(--primary)' }}>Shop</span>
              <span style={{ fontSize: '0.6875rem', background: 'var(--primary)', color: 'white', borderRadius: '4px', padding: '1px 6px', marginLeft: '6px', fontWeight: 700 }}>ADMIN</span>
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--sidebar-text)', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'white' }}>{user?.fullName}</span>
            <br />{user?.email}
          </div>
          <button className="btn btn-ghost" onClick={logout} style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', padding: '0.375rem 0.25rem' }}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header">
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-800)' }}>{title}</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="http://localhost:3000" target="_blank" className="btn btn-outline btn-sm">
              🌐 Xem trang
            </Link>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
              {user?.fullName?.[0] || 'A'}
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
