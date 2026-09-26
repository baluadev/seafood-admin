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

interface Recipe { icon: string; title: string; content: string; }
interface NutritionInfo { [key: string]: string; calories: string; protein: string; fat: string; carbs: string; fiber: string; }

const EMPTY_NUTRITION: NutritionInfo = { calories: '', protein: '', fat: '', carbs: '', fiber: '' };

const EMPTY_FORM = {
  // ── Cơ bản ──
  categoryId: '', title: '', slug: '', description: '',
  price: '', discountRate: '', thumbnailUrl: '',
  stockQuantity: '', unit: 'kg', isHot: false, isActive: true,
  // ── Dinh dưỡng ──
  origin: '', packagingInfo: '', preservationDays: '', cultivationMethod: '',
  nutritionInfo: { ...EMPTY_NUTRITION },
  // ── Nguồn gốc ──
  farmName: '', farmAddress: '', farmImageUrl: '',
  certifications: [] as string[],
  // ── Gợi ý & Bảo quản ──
  storageGuide: '',
  recipes: [] as Recipe[],
};

const FORM_TABS = ['Cơ bản', 'Dinh dưỡng', 'Nguồn gốc', 'Gợi ý & Bảo quản'];

function toSlug(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const qc = useQueryClient();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [certInput, setCertInput] = useState('');

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) => adminApi.products.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); closeModal(); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.products.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  function closeModal() { setModal(null); setActiveTab(0); setCertInput(''); }

  function openCreate() {
    setForm({ ...EMPTY_FORM, nutritionInfo: { ...EMPTY_NUTRITION }, certifications: [], recipes: [] });
    setActiveTab(0);
    setModal('create');
  }

  function openEdit(p: any) {
    setForm({
      categoryId: p.categoryId ?? '',
      title: p.title ?? '',
      slug: p.slug ?? '',
      description: p.description ?? '',
      price: String(p.price ?? ''),
      discountRate: String(p.discountRate ?? ''),
      thumbnailUrl: p.thumbnailUrl ?? '',
      stockQuantity: String(p.stockQuantity ?? ''),
      unit: p.unit ?? 'kg',
      isHot: p.isHot ?? false,
      isActive: p.isActive ?? true,
      // Dinh dưỡng
      origin: p.origin ?? '',
      packagingInfo: p.packagingInfo ?? '',
      preservationDays: p.preservationDays ? String(p.preservationDays) : '',
      cultivationMethod: p.cultivationMethod ?? '',
      nutritionInfo: p.nutritionInfo
        ? { ...EMPTY_NUTRITION, ...(p.nutritionInfo as Record<string, string>) }
        : { ...EMPTY_NUTRITION },
      // Nguồn gốc
      farmName: p.farmName ?? '',
      farmAddress: p.farmAddress ?? '',
      farmImageUrl: p.farmImageUrl ?? '',
      certifications: p.certifications ?? [],
      // Gợi ý & Bảo quản
      storageGuide: p.storageGuide ?? '',
      recipes: p.recipes ?? [],
    });
    setEditId(p.id);
    setActiveTab(0);
    setModal('edit');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) {
      alert('Vui lòng chọn danh mục sản phẩm (Tab Cơ bản)');
      setActiveTab(0);
      return;
    }
    const hasNutrition = Object.values(form.nutritionInfo).some(v => v.trim());
    const payload = {
      ...form,
      price: Number(form.price),
      discountRate: Number(form.discountRate),
      stockQuantity: Number(form.stockQuantity),
      preservationDays: form.preservationDays ? Number(form.preservationDays) : undefined,
      nutritionInfo: hasNutrition ? form.nutritionInfo : undefined,
      certifications: form.certifications,
      recipes: form.recipes.length ? form.recipes : undefined,
    };
    if (modal === 'create') createMutation.mutate(payload);
    else updateMutation.mutate({ id: editId, d: payload });
  }

  // Helpers
  function setF(key: string, val: unknown) {
    setForm(f => ({ ...f, [key]: val }));
  }
  function setNutrition(key: string, val: string) {
    setForm(f => ({ ...f, nutritionInfo: { ...f.nutritionInfo, [key]: val } }));
  }
  function addCert() {
    const v = certInput.trim();
    if (v && !form.certifications.includes(v)) {
      setF('certifications', [...form.certifications, v]);
      setCertInput('');
    }
  }
  function removeCert(c: string) {
    setF('certifications', form.certifications.filter(x => x !== c));
  }
  function addRecipe() {
    setF('recipes', [...form.recipes, { icon: '🍽️', title: '', content: '' }]);
  }
  function updateRecipe(i: number, key: string, val: string) {
    const r = [...form.recipes];
    r[i] = { ...r[i], [key]: val };
    setF('recipes', r);
  }
  function removeRecipe(i: number) {
    setF('recipes', form.recipes.filter((_, j) => j !== i));
  }

  if (!isAuthenticated) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <div className="card">
        <div className="card-header">
          <span className="card-title">🦐 Danh sách sản phẩm ({data?.meta?.total ?? 0})</span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              className="form-input" style={{ width: '220px' }}
              placeholder="🔍 Tìm sản phẩm..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
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
                  <th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th>
                  <th>Giá</th><th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--gray-100)', position: 'relative' }}>
                        {p.thumbnailUrl
                          ? <Image src={p.thumbnailUrl} alt={p.title} fill style={{ objectFit: 'cover' }} />
                          : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '1.5rem' }}>🦐</span>}
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
                        <button
                          className={`btn btn-xs ${p.isActive ? '' : 'btn-primary'}`}
                          style={p.isActive ? { background: '#fef9c3', color: '#854d0e' } : {}}
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(p.id)}
                        >
                          {p.isActive ? '🙈 Ẩn' : '👁️ Hiện'}
                        </button>
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

      {/* ─── Modal Create / Edit ─── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <span className="modal-title">
                {modal === 'create' ? '➕ Thêm sản phẩm mới' : '✏️ Chỉnh sửa sản phẩm'}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>

            {/* Tab Nav */}
            <div className="modal-tabs">
              {FORM_TABS.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  className={`modal-tab${activeTab === i ? ' active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {(createMutation.error || updateMutation.error) && (
                  <div className="alert alert-error">
                    {String((createMutation.error || updateMutation.error) as any)}
                  </div>
                )}

                {/* ══ Tab 0: Cơ bản ══ */}
                {activeTab === 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Tên sản phẩm *</label>
                      <input
                        className="form-input" required value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: toSlug(e.target.value) }))}
                        placeholder="Bơ Sáp Đắk Lắk Hạng A"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Slug *</label>
                      <input className="form-input" required value={form.slug}
                        onChange={e => setF('slug', e.target.value)} placeholder="bo-sap-dak-lak-hang-a" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Danh mục *</label>
                      <select className="form-select" required value={form.categoryId}
                        onChange={e => setF('categoryId', e.target.value)}>
                        <option value="">-- Chọn danh mục --</option>
                        {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giá (đ) *</label>
                      <input className="form-input" type="number" required min="0"
                        value={form.price} onChange={e => setF('price', e.target.value)} placeholder="85000" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giảm giá (0–1)</label>
                      <input className="form-input" type="number" min="0" max="1" step="0.01"
                        value={form.discountRate} onChange={e => setF('discountRate', e.target.value)} placeholder="0.12" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tồn kho</label>
                      <input className="form-input" type="number" min="0"
                        value={form.stockQuantity} onChange={e => setF('stockQuantity', e.target.value)} placeholder="50" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Đơn vị</label>
                      <input className="form-input" value={form.unit}
                        onChange={e => setF('unit', e.target.value)} placeholder="kg" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <ImageUploader
                        label="Ảnh đại diện"
                        value={form.thumbnailUrl}
                        onChange={(url) => setF('thumbnailUrl', url)}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Mô tả</label>
                      <textarea className="form-input" rows={3} value={form.description}
                        onChange={e => setF('description', e.target.value)}
                        placeholder="Mô tả sản phẩm..." style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                        <input type="checkbox" checked={form.isHot} onChange={e => setF('isHot', e.target.checked)} />
                        🔥 Sản phẩm hot
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                        <input type="checkbox" checked={form.isActive} onChange={e => setF('isActive', e.target.checked)} />
                        Đang bán
                      </label>
                    </div>
                  </div>
                )}

                {/* ══ Tab 1: Dinh dưỡng ══ */}
                {activeTab === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Xuất xứ</label>
                        <input className="form-input" value={form.origin}
                          onChange={e => setF('origin', e.target.value)} placeholder="Đắk Lắk, Việt Nam" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quy cách đóng gói</label>
                        <input className="form-input" value={form.packagingInfo}
                          onChange={e => setF('packagingInfo', e.target.value)} placeholder="Hộp 1kg đóng gói chân không" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Thời gian bảo quản (ngày)</label>
                        <input className="form-input" type="number" min="0" value={form.preservationDays}
                          onChange={e => setF('preservationDays', e.target.value)} placeholder="5" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phương pháp trồng</label>
                        <input className="form-input" value={form.cultivationMethod}
                          onChange={e => setF('cultivationMethod', e.target.value)} placeholder="Thuần hữu cơ" />
                      </div>
                    </div>

                    {/* Nutrition grid */}
                    <div>
                      <span className="section-label">🥗 Thông tin dinh dưỡng (per 100g)</span>
                      <div className="nutrition-grid">
                        {([
                          { key: 'calories', label: 'Calories', ph: '160 kcal' },
                          { key: 'protein', label: 'Protein', ph: '2g' },
                          { key: 'fat', label: 'Chất béo', ph: '15.4g' },
                          { key: 'carbs', label: 'Carbohydrate', ph: '8.5g' },
                          { key: 'fiber', label: 'Chất xơ', ph: '6.7g' },
                        ]).map(f => (
                          <div key={f.key} className="nutrition-item form-group" style={{ margin: 0 }}>
                            <label className="form-label">{f.label}</label>
                            <input className="form-input" value={form.nutritionInfo[f.key] ?? ''}
                              onChange={e => setNutrition(f.key, e.target.value)} placeholder={f.ph} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ Tab 2: Nguồn gốc ══ */}
                {activeTab === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Tên trang trại / nhà vườn</label>
                        <input className="form-input" value={form.farmName}
                          onChange={e => setF('farmName', e.target.value)} placeholder="Trang trại Hoàng Anh" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Địa chỉ trang trại</label>
                        <input className="form-input" value={form.farmAddress}
                          onChange={e => setF('farmAddress', e.target.value)} placeholder="Krông Pắk, Đắk Lắk" />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label className="form-label">URL ảnh trang trại</label>
                        <input className="form-input" value={form.farmImageUrl}
                          onChange={e => setF('farmImageUrl', e.target.value)} placeholder="https://..." />
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="form-group">
                      <label className="form-label">Chứng nhận</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          className="form-input" style={{ flex: 1 }}
                          value={certInput}
                          onChange={e => setCertInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                          placeholder="VietGAP, GlobalGAP, Hữu cơ... rồi Enter"
                        />
                        <button type="button" className="btn btn-primary btn-sm" onClick={addCert}>
                          + Thêm
                        </button>
                      </div>
                      {form.certifications.length > 0 && (
                        <div className="tag-list">
                          {form.certifications.map(c => (
                            <span key={c} className="tag-chip">
                              ✓ {c}
                              <button type="button" className="tag-chip-remove" onClick={() => removeCert(c)}>✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ Tab 3: Gợi ý & Bảo quản ══ */}
                {activeTab === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">💡 Hướng dẫn bảo quản</label>
                      <textarea
                        className="form-input" rows={3}
                        value={form.storageGuide}
                        onChange={e => setF('storageGuide', e.target.value)}
                        placeholder="Để bơ nơi thoáng mát 22-26°C. Kèm chuối chín để ủ nhanh. Sau khi chín bảo quản tủ lạnh 3-5 ngày."
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    {/* Recipes */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span className="section-label" style={{ marginBottom: 0, border: 'none' }}>🍽️ Gợi ý món ngon & Công thức</span>
                        <button type="button" className="btn btn-outline btn-xs" onClick={addRecipe}>
                          + Thêm gợi ý
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {form.recipes.map((r, i) => (
                          <div key={i} className="recipe-card">
                            <button type="button" className="recipe-card-remove" onClick={() => removeRecipe(i)}>✕</button>
                            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '8px' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Icon</label>
                                <input
                                  className="form-input"
                                  style={{ fontSize: '22px', textAlign: 'center', padding: '4px' }}
                                  value={r.icon}
                                  onChange={e => updateRecipe(i, 'icon', e.target.value)}
                                />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Tiêu đề</label>
                                <input
                                  className="form-input" value={r.title}
                                  onChange={e => updateRecipe(i, 'title', e.target.value)}
                                  placeholder="Salad bơ ức gà nướng mật ong"
                                />
                              </div>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label">Nội dung</label>
                              <textarea
                                className="form-input" rows={2}
                                value={r.content}
                                onChange={e => updateRecipe(i, 'content', e.target.value)}
                                placeholder="Mô tả chi tiết cách làm hoặc công thức..."
                                style={{ resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        ))}
                        {form.recipes.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--gray-400)', fontSize: '0.875rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                            Chưa có gợi ý nào. Click "+ Thêm gợi ý" để thêm công thức món ngon.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Hủy</button>
                {activeTab < 3 ? (
                  <button type="button" className="btn btn-primary" onClick={() => setActiveTab(t => t + 1)}>
                    Tiếp theo →
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? 'Đang lưu...' : modal === 'create' ? '💾 Tạo sản phẩm' : '💾 Lưu thay đổi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
