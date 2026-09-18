'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';

const EMPTY = { title: '', subtitle: '', description: '', imageUrl: '', linkUrl: '', isActive: true, sortOrder: '0' };

export default function AdminSlidersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<any>(EMPTY);

  useEffect(() => { if (!isAuthenticated) router.push('/'); }, [isAuthenticated, router]);

  const { data: sliders, isLoading } = useQuery({
    queryKey: ['admin-sliders'],
    queryFn: adminApi.sliders.getAll,
    enabled: isAuthenticated,
  });

  const createMut = useMutation({
    mutationFn: (d: object) => adminApi.sliders.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sliders'] }); setModal(null); setForm(EMPTY); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.sliders.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sliders'] }); setModal(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.sliders.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-sliders'] }),
  });

  function openEdit(s: any) { setEditId(s.id); setForm({ title: s.title, subtitle: s.subtitle || '', description: s.description || '', imageUrl: s.imageUrl, linkUrl: s.linkUrl || '', isActive: s.isActive, sortOrder: String(s.sortOrder) }); setModal('edit'); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, sortOrder: Number(form.sortOrder) };
    if (modal === 'create') createMut.mutate(payload);
    else updateMut.mutate({ id: editId, d: payload });
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Quản lý Sliders">
      <div className="card">
        <div className="card-header">
          <span className="card-title">🖼️ Sliders ({sliders?.length ?? 0})</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY); setModal('create'); }}>+ Thêm slider</button>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '48px' }} />)}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Phụ đề</th>
                  <th>Link</th>
                  <th>Thứ tự</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sliders?.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{s.subtitle || '—'}</td>
                    <td><a href={s.linkUrl || '#'} target="_blank" style={{ color: 'var(--primary)', fontSize: '0.8125rem' }}>{s.linkUrl || '—'}</a></td>
                    <td>{s.sortOrder}</td>
                    <td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-gray'}`}>{s.isActive ? 'Hiện' : 'Ẩn'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => openEdit(s)}>✏️ Sửa</button>
                        <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => { if (confirm('Xóa slider?')) deleteMut.mutate(s.id); }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!sliders?.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>Chưa có slider nào</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? '➕ Thêm Slider' : '✏️ Chỉnh sửa Slider'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tiêu đề *</label>
                  <input className="form-input" required value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="Hải Sản Tươi Sống Mỗi Ngày" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phụ đề</label>
                  <input className="form-input" value={form.subtitle} onChange={e => setForm((p: any) => ({ ...p, subtitle: e.target.value }))} placeholder="🌊 Trực tiếp từ biển" />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">URL ảnh *</label>
                  <input className="form-input" type="url" required value={form.imageUrl} onChange={e => setForm((p: any) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Link khi click</label>
                  <input className="form-input" value={form.linkUrl} onChange={e => setForm((p: any) => ({ ...p, linkUrl: e.target.value }))} placeholder="/shop" />
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Thứ tự</label>
                    <input className="form-input" type="number" min="0" value={form.sortOrder} onChange={e => setForm((p: any) => ({ ...p, sortOrder: e.target.value }))} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', marginTop: '1.25rem' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                    Hiển thị
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>💾 Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
