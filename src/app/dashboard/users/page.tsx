'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.users.getAll({ page, limit: 20, search: search || undefined }),
    enabled: isAuthenticated,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.users.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const users = data?.data || [];
  const meta = data?.meta;

  return (
    <AdminLayout title="Người dùng">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>👥 Quản lý người dùng</h1>
          {meta && <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Tổng cộng {meta.total} người dùng</p>}
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="admin-input"
            placeholder="🔍 Tìm theo tên, email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ width: '260px' }}
          />
          <button className="btn btn-primary btn-sm" type="submit">Tìm</button>
          {search && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              ✕ Xoá
            </button>
          )}
        </form>
      </div>

      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Họ tên / Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Đơn hàng</th>
              <th>Ngày đăng ký</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: '20px', borderRadius: '4px' }} /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                  <p>Không tìm thấy người dùng nào</p>
                </td>
              </tr>
            ) : (
              users.map((user: any, idx: number) => (
                <tr
                  key={user.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                >
                  <td style={{ color: 'var(--gray-400)', fontWeight: 500 }}>
                    {(page - 1) * 20 + idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{user.fullName}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{user.email}</div>
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    {user.phone || '—'}
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.625rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: user.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                      color: user.role === 'ADMIN' ? '#1d4ed8' : '#6b7280',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{user._count?.orders ?? 0}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td>
                    {user.isActive ? (
                      <span style={{ color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 600 }}>✅ Hoạt động</span>
                    ) : (
                      <span style={{ color: 'var(--error)', fontSize: '0.8125rem', fontWeight: 600 }}>🔒 Đã khoá</span>
                    )}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className={`btn btn-sm ${user.isActive ? 'btn-outline' : 'btn-primary'}`}
                      style={{ fontSize: '0.75rem', color: user.isActive ? 'var(--error)' : undefined }}
                      disabled={user.role === 'ADMIN' || toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(user.id)}
                      title={user.role === 'ADMIN' ? 'Không thể khoá tài khoản ADMIN' : ''}
                    >
                      {user.isActive ? '🔒 Khoá' : '🔓 Mở'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-outline btn-sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
        </div>
      )}
    </AdminLayout>
  );
}
