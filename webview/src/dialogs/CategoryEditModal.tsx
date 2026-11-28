import React, { useState, useEffect } from 'react';
import { useERDStore } from '../store/useERDStore.js';
import { ERCategory } from '../types/erm.types.js';
import { X, Check, Trash2, Folder } from 'lucide-react';

const PRESET_COLORS: Array<{ label: string; r: number; g: number; b: number }> = [
  { label: '블루', r: 137, g: 180, b: 250 },
  { label: '퍼플', r: 203, g: 166, b: 247 },
  { label: '그린', r: 166, g: 227, b: 161 },
  { label: '틸', r: 148, g: 226, b: 213 },
  { label: '옐로우', r: 249, g: 226, b: 175 },
  { label: '오렌지', r: 250, g: 179, b: 135 },
  { label: '레드', r: 243, g: 139, b: 168 },
  { label: '그레이', r: 166, g: 173, b: 200 }
];

function rgbToHex(c: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 137, g: 180, b: 250 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

export const CategoryEditModal: React.FC = () => {
  const isCategoryModalOpen = useERDStore((state) => state.isCategoryModalOpen);
  const editingCategory = useERDStore((state) => state.editingCategory);
  const updateCategory = useERDStore((state) => state.updateCategory);
  const deleteCategory = useERDStore((state) => state.deleteCategory);
  const closeCategoryModal = useERDStore((state) => state.closeCategoryModal);
  const diagram = useERDStore((state) => state.diagram);

  const [name, setName] = useState('');
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [color, setColor] = useState<{ r: number; g: number; b: number }>({ r: 137, g: 180, b: 250 });
  const [nodeElementIds, setNodeElementIds] = useState<string[]>([]);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setWidth(editingCategory.width || 400);
      setHeight(editingCategory.height || 300);
      setColor(editingCategory.color || { r: 137, g: 180, b: 250 });
      setNodeElementIds([...(editingCategory.nodeElementIds || [])]);
    }
  }, [editingCategory]);

  if (!isCategoryModalOpen || !editingCategory) return null;

  const toggleNode = (id: string) => {
    setNodeElementIds((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const updated: ERCategory = {
      ...editingCategory,
      name: name.trim() || '카테고리',
      width: Math.max(150, width),
      height: Math.max(100, height),
      color,
      nodeElementIds
    };
    updateCategory(updated);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={16} color="#cba6f7" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>카테고리 설정</span>
          </div>
          <button onClick={closeCategoryModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>카테고리 이름</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>너비 (Width)</label>
              <input type="number" className="input-field" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>높이 (Height)</label>
              <input type="number" className="input-field" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              카테고리 색상
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((preset) => {
                const isSelected =
                  color.r === preset.r && color.g === preset.g && color.b === preset.b;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={() => setColor({ r: preset.r, g: preset.g, b: preset.b })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})`,
                      border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: isSelected ? '0 0 0 2px var(--accent-primary)' : 'none',
                      cursor: 'pointer'
                    }}
                  />
                );
              })}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginLeft: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="color"
                  value={rgbToHex(color)}
                  onChange={(e) => setColor(hexToRgb(e.target.value))}
                  style={{ width: '20px', height: '20px', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                />
                <span>직접 선택</span>
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>포함할 테이블 / 뷰</label>
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {diagram.tables.map((t) => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={nodeElementIds.includes(t.id)} onChange={() => toggleNode(t.id)} />
                  <span>[Table] {t.physicalName} ({t.logicalName})</span>
                </label>
              ))}
              {(diagram.views || []).map((v) => (
                <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={nodeElementIds.includes(v.id)} onChange={() => toggleNode(v.id)} />
                  <span>[View] {v.physicalName} ({v.logicalName})</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn"
            style={{ backgroundColor: 'rgba(243, 139, 168, 0.15)', color: '#f38ba8', border: '1px solid rgba(243, 139, 168, 0.3)' }}
            onClick={() => deleteCategory(editingCategory.id)}
          >
            <Trash2 size={14} />
            <span>삭제</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={closeCategoryModal}>취소</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Check size={14} />
              <span>저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
