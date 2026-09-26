'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';

/* ── Helpers ── */
function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDatetime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TYPE_OPTIONS = [
  { value: 'FIXED_AMOUNT', label: '💰 Giảm số tiền', badge: 'badge-info' },
  { value: 'PERCENT', label: '📊 Giảm %', badge: 'badge-warning' },
  { value: 'FREE_SHIPPING', label: '🚚 Miễn ship', badge: 'badge-success' },
];
const TYPE_MAP = Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t]));

function typeLabel(type: string, value: number) {
  if (type === 'FIXED_AMOUNT') return `-${fmtPrice(value)}`;
  if (type === 'PERCENT') return `-${value}%`;
  return 'Free ship';
}

const EMPTY_FORM = {
  code: '', type: 'FIXED_AMOUNT', value: '', minOrderAmt: '', maxDiscount: '',
  usageLimit: '', perUserLimit: '1', startDate: '', endDate: '',
  description: '', isActive: true,
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [usageModal, setUsageModal] = useState<any>(null);

  useEffect(() => { if (!isAuthenticated) router.push('/'); }, [isAuthenticated, router]);

  /* ── Queries ── */
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: adminApi.coupons.getAll,
    enabled: isAuthenticated,
  });

  /* ── Mutations ── */
  const createMut = useMutation({
    mutationFn: (d: object) => adminApi.coupons.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setModal(null); setForm(EMPTY_FORM); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.coupons.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setModal(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.coupons.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.coupons.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  /* ── Handlers ── */
  function openEdit(c: any) {
    setEditId(c.id);
    setForm({
      code: c.code, type: c.type, value: String(Number(c.value)),
      minOrderAmt: c.minOrderAmt ? String(Number(c.minOrderAmt)) : '',
      maxDiscount: c.maxDiscount ? String(Number(c.maxDiscount)) : '',
      usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      perUserLimit: String(c.perUserLimit),
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '',
      description: c.description || '', isActive: c.isActive,
    });
    setModal('edit');
  }

  async function openUsages(c: any) {
    try {
      const detail = await adminApi.coupons.getOne(c.id);
      setUsageModal(detail);
    } catch { setUsageModal({ ...c, usages: [] }); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: Number(form.value) || 0,
      minOrderAmt: form.minOrderAmt ? Number(form.minOrderAmt) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: Number(form.perUserLimit) || 1,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      description: form.description || null,
      isActive: form.isActive,
    };
    if (modal === 'create') createMut.mutate(payload);
    else updateMut.mutate({ id: editId, d: payload });
  }

  function updateField(field: string, value: any) {
    setForm((p: any) => ({ ...p, [field]: value }));
  }

  if (!isAuthenticated) return null;

  /* ── Stats ── */
  const total = coupons?.length ?? 0;
  const active = coupons?.filter((c: any) => c.isActive).length ?? 0;
  const totalUsed = coupons?.reduce((s: number, c: any) => s + (c._count?.usages ?? c.usageCount ?? 0), 0) ?? 0;

  return (
    <AdminLayout title="Quản lý mã giảm giá">
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '4px' }}>Tổng mã</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-800)' }}>{total}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '4px' }}>Đang hoạt động</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{active}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '4px' }}>Lượt sử dụng</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{totalUsed}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🎫 Mã giảm giá ({total})</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY_FORM); setModal('create'); }}>
            + Tạo mã mới
          </button>
        </div>

        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '48px' }} />)}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Loại</th>
                  <th>Giảm</th>
                  <th>Đơn tối thiểu</th>
                  <th>Sử dụng</th>
                  <th>Thời hạn</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {coupons?.map((c: any) => {
                  const usageCount = c._count?.usages ?? c.usageCount ?? 0;
                  const usagePct = c.usageLimit ? Math.round((usageCount / c.usageLimit) * 100) : 0;
                  const isExpired = c.endDate && new Date(c.endDate) < new Date();
                  return (
                    <tr key={c.id} style={{ opacity: !c.isActive ? 0.5 : 1 }}>
                      <td>
                        <code style={{
                          fontWeight: 700, fontSize: '0.875rem', background: '#f4f5f9',
                          padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px',
                        }}>
                          {c.code}
                        </code>
                        {c.description && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${TYPE_MAP[c.type]?.badge || 'badge-gray'}`}>
                          {TYPE_MAP[c.type]?.label || c.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.875rem', color: '#16a34a' }}>
                        {typeLabel(c.type, Number(c.value))}
                        {c.maxDiscount && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', fontWeight: 400 }}>
                            max {fmtPrice(Number(c.maxDiscount))}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {c.minOrderAmt ? fmtPrice(Number(c.minOrderAmt)) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                            {usageCount}/{c.usageLimit ?? '∞'}
                          </span>
                          {c.usageLimit && (
                            <div style={{ width: '48px', height: '6px', background: '#f4f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${usagePct}%`, height: '100%', background: usagePct > 80 ? '#ef4444' : 'var(--primary)', borderRadius: '3px', transition: 'width 0.3s' }} />
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--gray-500)' }}>
                          {c.perUserLimit}/user
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {c.startDate || c.endDate ? (
                          <div>
                            <div>{fmtDate(c.startDate)} →</div>
                            <div style={{ color: isExpired ? '#ef4444' : 'inherit', fontWeight: isExpired ? 600 : 400 }}>
                              {fmtDate(c.endDate)} {isExpired && '⚠️'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>Không giới hạn</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`badge ${c.isActive ? 'badge-success' : 'badge-gray'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          onClick={() => toggleMut.mutate({ id: c.id, isActive: !c.isActive })}
                          disabled={toggleMut.isPending}
                        >
                          {c.isActive ? '✅ Hoạt động' : '⏸ Tạm dừng'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn btn-outline btn-xs" onClick={() => openUsages(c)} title="Xem lịch sử sử dụng">
                            📋
                          </button>
                          <button className="btn btn-outline btn-xs" onClick={() => openEdit(c)}>
                            ✏️
                          </button>
                          <button
                            className="btn btn-xs"
                            style={{ background: '#fee2e2', color: '#dc2626' }}
                            onClick={() => { if (confirm(`Xóa mã "${c.code}"?`)) deleteMut.mutate(c.id); }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!coupons?.length && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>Chưa có mã giảm giá nào</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Create/Edit Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? '➕ Tạo mã giảm giá' : '✏️ Chỉnh sửa mã'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Preview badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                  background: '#ebffd7', borderRadius: '10px', marginBottom: '16px',
                }}>
                  <span style={{ fontSize: '20px' }}>🎫</span>
                  <div>
                    <code style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '1px', color: '#356b00' }}>
                      {form.code.toUpperCase() || 'CODE'}
                    </code>
                    <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                      {form.type === 'FIXED_AMOUNT' && form.value ? `Giảm ${fmtPrice(Number(form.value))}` :
                       form.type === 'PERCENT' && form.value ? `Giảm ${form.value}%${form.maxDiscount ? ` (max ${fmtPrice(Number(form.maxDiscount))})` : ''}` :
                       form.type === 'FREE_SHIPPING' ? 'Miễn phí vận chuyển' : 'Nhập thông tin...'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {/* Code */}
                  <div className="form-group">
                    <label className="form-label">Mã code *</label>
                    <input className="form-input" required value={form.code}
                      onChange={e => updateField('code', e.target.value.toUpperCase())}
                      placeholder="VD: SALE30" style={{ fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}
                      disabled={modal === 'edit'} />
                  </div>
                  {/* Type */}
                  <div className="form-group">
                    <label className="form-label">Loại giảm giá *</label>
                    <select className="form-select" value={form.type} onChange={e => updateField('type', e.target.value)}>
                      {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  {/* Value */}
                  <div className="form-group">
                    <label className="form-label">
                      {form.type === 'PERCENT' ? 'Phần trăm (%)' : form.type === 'FREE_SHIPPING' ? 'Giá trị (0)' : 'Số tiền giảm (₫)'}
                    </label>
                    <input className="form-input" type="number" min="0" required value={form.value}
                      onChange={e => updateField('value', e.target.value)}
                      placeholder={form.type === 'PERCENT' ? '10' : '30000'} />
                  </div>
                  {/* Min order */}
                  <div className="form-group">
                    <label className="form-label">Đơn tối thiểu (₫)</label>
                    <input className="form-input" type="number" min="0" value={form.minOrderAmt}
                      onChange={e => updateField('minOrderAmt', e.target.value)} placeholder="100000" />
                  </div>
                  {/* Max discount (only for PERCENT) */}
                  {form.type === 'PERCENT' && (
                    <div className="form-group">
                      <label className="form-label">Giảm tối đa (₫)</label>
                      <input className="form-input" type="number" min="0" value={form.maxDiscount}
                        onChange={e => updateField('maxDiscount', e.target.value)} placeholder="50000" />
                    </div>
                  )}
                  {/* Usage limit */}
                  <div className="form-group">
                    <label className="form-label">Giới hạn tổng lượt</label>
                    <input className="form-input" type="number" min="0" value={form.usageLimit}
                      onChange={e => updateField('usageLimit', e.target.value)} placeholder="500 (bỏ trống = ∞)" />
                  </div>
                  {/* Per user limit */}
                  <div className="form-group">
                    <label className="form-label">Giới hạn / user</label>
                    <input className="form-input" type="number" min="1" value={form.perUserLimit}
                      onChange={e => updateField('perUserLimit', e.target.value)} placeholder="1" />
                  </div>
                  {/* Start date */}
                  <div className="form-group">
                    <label className="form-label">Ngày bắt đầu</label>
                    <input className="form-input" type="date" value={form.startDate}
                      onChange={e => updateField('startDate', e.target.value)} />
                  </div>
                  {/* End date */}
                  <div className="form-group">
                    <label className="form-label">Ngày kết thúc</label>
                    <input className="form-input" type="date" value={form.endDate}
                      onChange={e => updateField('endDate', e.target.value)} />
                  </div>
                  {/* Description */}
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Mô tả</label>
                    <input className="form-input" value={form.description}
                      onChange={e => updateField('description', e.target.value)}
                      placeholder="Giảm 30.000₫ cho đơn từ 100.000₫" />
                  </div>
                </div>

                {/* Active toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', marginTop: '0.75rem' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => updateField('isActive', e.target.checked)} />
                  Kích hoạt ngay
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                  {createMut.isPending || updateMut.isPending ? '⏳ Đang lưu...' : '💾 Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Usage History Modal ── */}
      {usageModal && (
        <div className="modal-overlay" onClick={() => setUsageModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <span className="modal-title">📋 Lịch sử sử dụng — <code>{usageModal.code}</code></span>
              <button className="btn btn-ghost btn-sm" onClick={() => setUsageModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Summary */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '10px 16px', background: '#f4f5f9', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Đã dùng</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{usageModal.usageCount ?? usageModal._count?.usages ?? 0}</div>
                </div>
                <div style={{ padding: '10px 16px', background: '#f4f5f9', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Giới hạn</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{usageModal.usageLimit ?? '∞'}</div>
                </div>
                <div style={{ padding: '10px 16px', background: '#f4f5f9', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Giới hạn/user</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{usageModal.perUserLimit}</div>
                </div>
              </div>

              {/* Usage list */}
              {usageModal.usages?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Khách hàng</th>
                      <th>Email</th>
                      <th>Ngày dùng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageModal.usages.map((u: any, i: number) => (
                      <tr key={u.id || i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{u.user?.fullName || '—'}</td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{u.user?.email || '—'}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{fmtDatetime(u.usedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                  Chưa có lượt sử dụng nào
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setUsageModal(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
