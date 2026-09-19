'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: '⏳ Chờ xác nhận', color: '#854d0e', bg: '#fef9c3' },
  CONFIRMED: { label: '✅ Đã xác nhận',  color: '#1d4ed8', bg: '#dbeafe' },
  SHIPPING:  { label: '🚚 Đang giao',    color: '#0369a1', bg: '#e0f2fe' },
  COMPLETED: { label: '🎉 Hoàn thành',   color: '#15803d', bg: '#dcfce7' },
  CANCELLED: { label: '❌ Đã hủy',       color: '#dc2626', bg: '#fee2e2' },
};

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.users.getOne(id),
    enabled: isAuthenticated && !!id,
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminApi.users.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', id] }),
  });

  if (isLoading) {
    return (
      <AdminLayout title="Chi tiết người dùng">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />)}
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const { user, stats, orders } = data;
  const status = user.isActive
    ? { label: '✅ Hoạt động', color: 'var(--success)', bg: '#dcfce7' }
    : { label: '🔒 Đã khoá', color: 'var(--error)', bg: '#fee2e2' };

  return (
    <AdminLayout title={user.fullName}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: '1.25rem', gap: '0.375rem' }}>
        ← Quay lại danh sách
      </button>

      {/* User profile card */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: user.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
          }}>
            {user.role === 'ADMIN' ? '👑' : '👤'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{user.fullName}</h2>
              <span style={{
                padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                background: user.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                color: user.role === 'ADMIN' ? '#1d4ed8' : '#6b7280',
              }}>{user.role}</span>
              <span style={{ padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: status.bg, color: status.color }}>
                {status.label}
              </span>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9375rem', marginTop: '0.375rem' }}>✉️ {user.email}</p>
            {user.phone && <p style={{ color: 'var(--gray-500)', fontSize: '0.9375rem' }}>📱 {user.phone}</p>}
            <p style={{ color: 'var(--gray-400)', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
              Ngày đăng ký: {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        {user.role !== 'ADMIN' && (
          <button
            className={`btn ${user.isActive ? 'btn-outline' : 'btn-primary'} btn-sm`}
            style={{ color: user.isActive ? 'var(--error)' : undefined, flexShrink: 0 }}
            disabled={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate()}
          >
            {toggleMutation.isPending ? 'Đang xử lý...' : user.isActive ? '🔒 Khoá tài khoản' : '🔓 Mở tài khoản'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: '📦', label: 'Tổng đơn hàng', value: stats.totalOrders, color: '#1d4ed8', bg: '#dbeafe' },
          { icon: '💰', label: 'Tổng đã chi', value: formatPrice(stats.totalSpent), color: '#15803d', bg: '#dcfce7' },
          { icon: '✅', label: 'Đơn hoàn thành', value: stats.completedOrders, color: '#854d0e', bg: '#fef9c3' },
        ].map((s, i) => (
          <div key={i} className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              {s.icon}
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Order history */}
      <div className="admin-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '1rem' }}>
          📜 Lịch sử đơn hàng ({orders.length})
        </div>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Sản phẩm</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                return (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                      {order.items?.slice(0, 2).map((item: any) => (
                        <div key={item.product?.title}>{item.product?.title} × {item.quantity}</div>
                      ))}
                      {order.items?.length > 2 && <div style={{ color: 'var(--gray-400)' }}>+{order.items.length - 2} sp khác</div>}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{formatDate(order.createdAt)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatPrice(Number(order.totalAmount))}</td>
                    <td>
                      <span style={{ padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
