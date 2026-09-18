'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/store/admin-auth.store';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sidebar-bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🦐</span>
            <span style={{ fontWeight: 800, fontSize: '1.75rem', color: 'white' }}>
              Sea<span style={{ color: 'var(--primary)' }}>Shop</span>
            </span>
          </div>
          <p style={{ color: 'var(--sidebar-text)', fontSize: '0.9375rem' }}>Quản trị hệ thống</p>
        </div>

        <div style={{ background: 'var(--gray-800)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>Đăng nhập Admin</h2>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email" style={{ color: 'var(--gray-300)' }}>Email</label>
              <input
                className="form-input"
                id="email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@seashop.vn"
                style={{ background: 'var(--gray-700)', borderColor: 'rgba(255,255,255,.1)', color: 'white' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password" style={{ color: 'var(--gray-300)' }}>Mật khẩu</label>
              <input
                className="form-input"
                id="password"
                type="password"
                required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                style={{ background: 'var(--gray-700)', borderColor: 'rgba(255,255,255,.1)', color: 'white' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
              {loading ? 'Đang đăng nhập...' : '🔐 Đăng nhập'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--sidebar-text)', fontSize: '0.8125rem', marginTop: '1.5rem' }}>
          💡 Dev: admin@seashop.vn / admin123456
        </p>
      </div>
    </div>
  );
}
