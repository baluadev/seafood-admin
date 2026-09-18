'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '⏳ Chờ xác nhận', cls: 'badge-warning' },
  { value: 'CONFIRMED', label: '✅ Đã xác nhận', cls: 'badge-info' },
  { value: 'SHIPPING', label: '🚚 Đang giao hàng', cls: 'badge-info' },
  { value: 'COMPLETED', label: '🎉 Hoàn thành', cls: 'badge-success' },
  { value: 'CANCELLED', label: '❌ Đã hủy', cls: 'badge-error' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { if (!isAuthenticated) router.push('/'); }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, filterStatus],
    queryFn: () => adminApi.orders.getAll({ page, limit: 20, status: filterStatus || undefined }),
    enabled: isAuthenticated,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.orders.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); setSelected(null); },
  });

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Quản lý đơn hàng">
      <div className="card">
        <div className="card-header">
          <span className="card-title">📦 Đơn hàng ({data?.meta?.total ?? 0})</span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select className="form-select" style={{ width: '200px' }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '48px' }} />)}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>SP</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((order: any) => {
                  const s = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                  return (
                    <tr key={order.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '0.875rem' }}>{order.orderNumber}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.user?.fullName || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{order.user?.email}</div>
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{order.items?.length ?? 0} sp</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(Number(order.totalAmount))}</td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>{formatDate(order.createdAt)}</td>
                      <td>
                        <button className="btn btn-outline btn-xs" onClick={() => setSelected(order)}>📋 Xử lý</button>
                      </td>
                    </tr>
                  );
                })}
                {!data?.data?.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>Không có đơn hàng nào</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data?.meta?.totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
            {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn btn-xs ${page === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📦 {selected.orderNumber}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Status update */}
              <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Cập nhật trạng thái</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} className={`btn btn-sm ${selected.status === s.value ? 'btn-primary' : 'btn-outline'}`} disabled={updateStatus.isPending} onClick={() => { if (selected.status !== s.value) updateStatus.mutate({ id: selected.id, status: s.value }); }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipping address */}
              {selected.shippingAddress && (
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.875rem' }}>📍 Địa chỉ giao hàng</p>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: 1.7, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '0.875rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{selected.shippingAddress.fullName}</span> — {selected.shippingAddress.phone}<br />
                    {selected.shippingAddress.address}, {selected.shippingAddress.ward}<br />
                    {selected.shippingAddress.district}, {selected.shippingAddress.province}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.875rem' }}>🦐 Sản phẩm đặt mua</p>
                <table style={{ width: '100%' }}>
                  <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                  <tbody>
                    {selected.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ fontSize: '0.875rem' }}>{item.product?.title ?? '—'}</td>
                        <td style={{ fontSize: '0.875rem' }}>× {item.quantity}</td>
                        <td style={{ fontSize: '0.875rem' }}>{formatPrice(Number(item.unitPrice))}</td>
                        <td style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatPrice(Number(item.subtotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 800, fontSize: '1rem', color: 'var(--accent)', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-100)' }}>
                  Tổng: {formatPrice(Number(selected.totalAmount))}
                </div>
              </div>

              {selected.note && (
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                  📝 Ghi chú: <span style={{ fontStyle: 'italic' }}>{selected.note}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
