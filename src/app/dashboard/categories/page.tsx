'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';
import { ImageUploader } from '@/components/image-uploader';

const EMPTY = { name: '', slug: '', imageUrl: '', description: '', isActive: true, sortOrder: '0' };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<any>(EMPTY);

  useEffect(() => { if (!isAuthenticated) router.push('/'); }, [isAuthenticated, router]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminApi.categories.getAll,
    enabled: isAuthenticated,
  });

  const createMut = useMutation({
    mutationFn: (d: object) => adminApi.categories.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setModal(null); setForm(EMPTY); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.categories.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setModal(null); },
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => adminApi.categories.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  function openEdit(c: any) { setEditId(c.id); setForm({ name: c.name, slug: c.slug, imageUrl: c.imageUrl || '', description: c.description || '', isActive: c.isActive, sortOrder: String(c.sortOrder) }); setModal('edit'); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, sortOrder: Number(form.sortOrder) };
    if (modal === 'create') createMut.mutate(payload);
    else updateMut.mutate({ id: editId, d: payload });
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Quản lý danh mục">
      <div className="card">
        <div className="card-header">
          <span className="card-title">📂 Danh mục ({categories?.length ?? 0})</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY); setModal('create'); }}>+ Thêm danh mục</button>
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
                  <th>Tên danh mục</th>
                  <th>Slug</th>
                  <th>Thứ tự</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((c: any) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td><code style={{ fontSize: '0.8125rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px' }}>{c.slug}</code></td>
                    <td>{c.sortOrder}</td>
                    <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-gray'}`}>{c.isActive ? 'Hiển thị' : 'Ẩn'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => openEdit(c)}>✏️ Sửa</button>
                        <button
                          className={`btn btn-xs ${c.isActive ? '' : 'btn-primary'}`}
                          style={c.isActive ? { background: '#fef9c3', color: '#854d0e' } : {}}
                          disabled={toggleMut.isPending}
                          onClick={() => toggleMut.mutate(c.id)}
                        >
                          {c.isActive ? '🙈 Ẩn' : '👁️ Hiện'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? '➕ Thêm danh mục' : '✏️ Chỉnh sửa danh mục'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên danh mục *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} placeholder="Tôm" />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug *</label>
                  <input className="form-input" required value={form.slug} onChange={e => setForm((p: any) => ({ ...p, slug: e.target.value }))} placeholder="tom" />
                </div>
                <ImageUploader
                  value={form.imageUrl}
                  onChange={(url) => setForm((p: any) => ({ ...p, imageUrl: url }))}
                  label="Ảnh danh mục"
                  folder="categories"
                />
                <div className="form-group">
                  <label className="form-label">Thứ tự hiển thị</label>
                  <input className="form-input" type="number" min="0" value={form.sortOrder} onChange={e => setForm((p: any) => ({ ...p, sortOrder: e.target.value }))} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                  Hiển thị danh mục
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                  {(createMut.isPending || updateMut.isPending) ? 'Đang lưu...' : '💾 Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
