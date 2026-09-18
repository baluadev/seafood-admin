'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';
import { ImageUploader } from '@/components/image-uploader';

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

const EMPTY_FORM = { categoryId: '', title: '', slug: '', description: '', price: '', discountRate: '', thumbnailUrl: '', stockQuantity: '', unit: 'kg', isHot: false, isActive: true };

export default function AdminProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { if (!isAuthenticated) router.push('/'); }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => adminApi.products.getAll({ page, limit: 15, search: search || undefined }),
    enabled: isAuthenticated,
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminApi.categories.getAll,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (d: object) => adminApi.products.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setModal(null); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.products.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.products.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  function openCreate() { setForm(EMPTY_FORM); setModal('create'); }
  function openEdit(p: any) { setEditId(p.id); setForm({ categoryId: p.categoryId, title: p.title, slug: p.slug, description: p.description || '', price: String(p.price), discountRate: String(p.discountRate), thumbnailUrl: p.thumbnailUrl || '', stockQuantity: String(p.stockQuantity), unit: p.unit, isHot: p.isHot, isActive: p.isActive }); setModal('edit'); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), discountRate: Number(form.discountRate), stockQuantity: Number(form.stockQuantity) };
    if (modal === 'create') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editId, d: payload });
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <div className="card">
        <div className="card-header">
          <span className="card-title">🦐 Danh sách sản phẩm ({data?.meta?.total ?? 0})</span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input className="form-input" style={{ width: '220px' }} placeholder="🔍 Tìm sản phẩm..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Thêm sản phẩm</button>
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
                  <th>Ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--gray-100)', position: 'relative' }}>
                        {p.thumbnailUrl ? <Image src={p.thumbnailUrl} alt={p.title} fill style={{ objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '1.5rem' }}>🦐</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontFamily: 'monospace' }}>{p.slug}</div>
                      {p.isHot && <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginTop: '2px' }}>🔥 Hot</span>}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{p.category?.name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatPrice(p.price)}</div>
                      {p.discountRate > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--error)' }}>-{Math.round(p.discountRate * 100)}%</div>}
                    </td>
                    <td>
                      <span className={`badge ${p.stockQuantity > 0 ? 'badge-success' : 'badge-error'}`}>
                        {p.stockQuantity} {p.unit}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-success' : 'badge-gray'}`}>
                        {p.isActive ? 'Đang bán' : 'Ẩn'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => openEdit(p)}>✏️ Sửa</button>
                        <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => { if (confirm('Xóa sản phẩm này?')) deleteMutation.mutate(p.id); }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!data?.data?.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>Không có sản phẩm nào</td></tr>
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

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? '➕ Thêm sản phẩm mới' : '✏️ Chỉnh sửa sản phẩm'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {(createMutation.error || updateMutation.error) && (
                  <div className="alert alert-error">{String((createMutation.error || updateMutation.error) as any)}</div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Tên sản phẩm *</label>
                    <input className="form-input" required value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} placeholder="Tôm Sú Tươi Sống" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Slug *</label>
                    <input className="form-input" required value={form.slug} onChange={e => setForm((p: any) => ({ ...p, slug: e.target.value }))} placeholder="tom-su-tuoi-song" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Danh mục *</label>
                    <select className="form-select" required value={form.categoryId} onChange={e => setForm((p: any) => ({ ...p, categoryId: e.target.value }))}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giá (đ) *</label>
                    <input className="form-input" type="number" required min="0" value={form.price} onChange={e => setForm((p: any) => ({ ...p, price: e.target.value }))} placeholder="350000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giảm giá (0–1)</label>
                    <input className="form-input" type="number" min="0" max="1" step="0.01" value={form.discountRate} onChange={e => setForm((p: any) => ({ ...p, discountRate: e.target.value }))} placeholder="0.1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tồn kho</label>
                    <input className="form-input" type="number" min="0" value={form.stockQuantity} onChange={e => setForm((p: any) => ({ ...p, stockQuantity: e.target.value }))} placeholder="50" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Đơn vị</label>
                    <input className="form-input" value={form.unit} onChange={e => setForm((p: any) => ({ ...p, unit: e.target.value }))} placeholder="kg" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <ImageUploader
                      label="Ảnh đại diện"
                      value={form.thumbnailUrl}
                      onChange={(url) => setForm((p: any) => ({ ...p, thumbnailUrl: url }))}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Mô tả sản phẩm..." style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                      <input type="checkbox" checked={form.isHot} onChange={e => setForm((p: any) => ({ ...p, isHot: e.target.checked }))} />
                      🔥 Sản phẩm hot
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                      Đang bán
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Đang lưu...' : '💾 Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
