'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin-layout';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/store/admin-auth.store';
import { ImageUploader } from '@/components/image-uploader';

const EMPTY = {
  tag: '',
  title: '',
  description: '',
  buttonText: 'Khám phá ngay →',
  linkUrl: '/shop',
  imageUrl: '',
  bgColor: '#d4f7a0',
  isActive: true,
  sortOrder: '0',
};

const PRESET_COLORS = ['#d4f7a0', '#c2f193', '#EBFFD7', '#fef9c3', '#fce7f3', '#dbeafe', '#f3e8ff', '#fee2e2'];

export default function AdminPromotionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<any>(EMPTY);

  useEffect(() => { if (!isAuthenticated) router.push('/'); }, [isAuthenticated, router]);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: adminApi.promotions.getAll,
    enabled: isAuthenticated,
  });

  const createMut = useMutation({
    mutationFn: (d: object) => adminApi.promotions.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-promotions'] }); setModal(null); setForm(EMPTY); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.promotions.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-promotions'] }); setModal(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.promotions.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-promotions'] }),
  });

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      tag: p.tag, title: p.title, description: p.description || '',
      buttonText: p.buttonText, linkUrl: p.linkUrl,
      imageUrl: p.imageUrl, bgColor: p.bgColor,
      isActive: p.isActive, sortOrder: String(p.sortOrder),
    });
    setModal('edit');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, sortOrder: Number(form.sortOrder) };
    if (modal === 'create') createMut.mutate(payload);
    else updateMut.mutate({ id: editId, d: payload });
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Quản lý Promotions">
      <div className="card">
        <div className="card-header">
          <span className="card-title">🎯 Promotion Cards ({promotions?.length ?? 0})</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY); setModal('create'); }}>
            + Thêm promotion
          </button>
        </div>

        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '56px' }} />)}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Tag / Tiêu đề</th>
                  <th>Button</th>
                  <th>Màu nền</th>
                  <th>Sort</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {promotions?.map((p: any) => (
                  <tr key={p.id}>
                    {/* Mini preview */}
                    <td>
                      <div style={{
                        background: p.bgColor, borderRadius: '8px', padding: '6px 10px',
                        width: '120px', display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '8px', fontWeight: 700, color: '#356b00', background: 'rgba(255,255,255,0.6)', display: 'inline-block', padding: '1px 4px', borderRadius: '99px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{p.tag}</div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#191c1d', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</div>
                        </div>
                        {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>{p.tag}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{p.buttonText}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: p.bgColor, border: '1px solid rgba(0,0,0,.1)' }} />
                        <code style={{ fontSize: '0.75rem' }}>{p.bgColor}</code>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{p.sortOrder}</td>
                    <td><span className={`badge ${p.isActive ? 'badge-success' : 'badge-gray'}`}>{p.isActive ? 'Hiện' : 'Ẩn'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => openEdit(p)}>✏️ Sửa</button>
                        <button
                          className="btn btn-xs"
                          style={{ background: '#fee2e2', color: '#dc2626' }}
                          onClick={() => { if (confirm(`Xóa promotion "${p.title}"?`)) deleteMut.mutate(p.id); }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!promotions?.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>Chưa có promotion nào</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'create' ? '➕ Thêm Promotion' : '✏️ Chỉnh sửa Promotion'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Preview */}
                <div style={{ background: form.bgColor, borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: '99px' }}>{form.tag || 'TAG'}</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px', marginBottom: '4px' }}>{form.title || 'Tiêu đề'}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '8px' }}>{form.description}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#356b00', color: '#fff', padding: '3px 10px', borderRadius: '6px' }}>{form.buttonText}</span>
                  </div>
                  {form.imageUrl && <img src={form.imageUrl} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Tag * <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--gray-500)' }}>(ví dụ: TƯƠI MỚI MỖI NGÀY)</span></label>
                    <input className="form-input" required value={form.tag} onChange={e => setForm((p: any) => ({ ...p, tag: e.target.value }))} placeholder="TƯƠI MỚI MỖI NGÀY" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Tiêu đề *</label>
                    <input className="form-input" required value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="Trái cây nhiệt đới tươi mới" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} placeholder="Mô tả ngắn hiển thị dưới tiêu đề..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Button text</label>
                    <input className="form-input" value={form.buttonText} onChange={e => setForm((p: any) => ({ ...p, buttonText: e.target.value }))} placeholder="Khám phá ngay →" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Link URL</label>
                    <input className="form-input" value={form.linkUrl} onChange={e => setForm((p: any) => ({ ...p, linkUrl: e.target.value }))} placeholder="/shop" />
                  </div>
                </div>

                <ImageUploader
                  value={form.imageUrl}
                  onChange={(url) => setForm((p: any) => ({ ...p, imageUrl: url }))}
                  label="Ảnh promotion"
                  folder="promotions"
                />

                {/* Color picker */}
                <div className="form-group">
                  <label className="form-label">Màu nền</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="color" value={form.bgColor} onChange={e => setForm((p: any) => ({ ...p, bgColor: e.target.value }))}
                      style={{ width: '36px', height: '36px', border: '1.5px solid var(--gray-200)', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <input className="form-input" style={{ flex: 1, minWidth: '100px' }} value={form.bgColor} onChange={e => setForm((p: any) => ({ ...p, bgColor: e.target.value }))} placeholder="#d4f7a0" />
                    {PRESET_COLORS.map(c => (
                      <div key={c} onClick={() => setForm((p: any) => ({ ...p, bgColor: c }))}
                        title={c}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: form.bgColor === c ? '2.5px solid var(--primary)' : '1px solid rgba(0,0,0,.1)', flexShrink: 0 }} />
                    ))}
                  </div>
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
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                  💾 Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
