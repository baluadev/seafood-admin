'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (!isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  const { data: productsData } = useQuery({ queryKey: ['admin-products'], queryFn: () => adminApi.products.getAll({ limit: 1 }), enabled: isAuthenticated });
  const { data: categoriesData } = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories.getAll, enabled: isAuthenticated });
  const { data: ordersData } = useQuery({ queryKey: ['admin-orders'], queryFn: () => adminApi.orders.getAll({ limit: 5 }), enabled: isAuthenticated });

  if (!isAuthenticated) return null;

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: '⏳ Chờ xác nhận', cls: 'badge-warning' },
    CONFIRMED: { label: '✅ Đã xác nhận',  cls: 'badge-info' },
    SHIPPING:  { label: '🚚 Đang giao',    cls: 'badge-info' },
    COMPLETED: { label: '🎉 Hoàn thành',   cls: 'badge-success' },
    CANCELLED: { label: '❌ Đã hủy',       cls: 'badge-error' },
  };

  const stats = [
    { icon: '🦐', label: 'Tổng sản phẩm', value: productsData?.meta?.total ?? '…', color: 'var(--primary)' },
    { icon: '📂', label: 'Danh mục', value: categoriesData?.length ?? '…', color: '#8b5cf6' },
    { icon: '📦', label: 'Tổng đơn hàng', value: ordersData?.meta?.total ?? '…', color: 'var(--accent)' },
    { icon: '⏳', label: 'Chờ xử lý', value: ordersData?.data?.filter((o: any) => o.status === 'PENDING').length ?? '…', color: 'var(--warning)' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{s.icon}</div>
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📦 Đơn hàng gần đây</span>
          <a href="/dashboard/orders" className="btn btn-ghost btn-sm">Xem tất cả →</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {ordersData?.data?.map((order: any) => {
                const s = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                return (
                  <tr key={order.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{order.orderNumber}</span></td>
                    <td>{order.user?.fullName || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(Number(order.totalAmount))}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                );
              })}
              {!ordersData?.data?.length && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>Chưa có đơn hàng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
