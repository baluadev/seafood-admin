'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import api from '@/lib/api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label = 'Ảnh' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      // 1. Get presigned URL from API
      const { data: { uploadUrl, publicUrl } } = await api.post('/upload/signed-url', {
        filename: file.name,
        contentType: file.type,
        folder: 'products',
      });

      // 2. Upload directly to Supabase Storage
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
        body: file,
      });

      if (!res.ok) throw new Error('Upload failed');

      onChange(publicUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload thất bại. Kiểm tra Supabase config.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}

      {/* Preview */}
      {value && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--gray-100)', marginBottom: '0.5rem' }}>
          <Image src={value} alt="Preview" fill style={{ objectFit: 'cover' }} />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          border: `2px dashed ${uploading ? 'var(--primary)' : 'var(--gray-200)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: uploading ? '#f0f9ff' : 'var(--gray-50)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>
          {uploading ? '⏳' : '📸'}
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 500 }}>
          {uploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để chọn ảnh'}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
          JPG, PNG, WebP • Tối đa 5MB
        </p>
      </div>

      {/* URL input fallback */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>hoặc URL:</span>
        <input
          className="form-input"
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://..."
          style={{ fontSize: '0.8125rem' }}
        />
      </div>

      {error && <p style={{ fontSize: '0.8125rem', color: 'var(--error)', marginTop: '0.375rem' }}>{error}</p>}
    </div>
  );
}
