import React, { useState, useEffect } from 'react';
import { useERDStore } from '../store/useERDStore.js';
import { ERView, ERColumn } from '../types/erm.types.js';
import { Plus, Trash2, X, Check, Eye } from 'lucide-react';

export const ViewEditModal: React.FC = () => {
  const isViewModalOpen = useERDStore((state) => state.isViewModalOpen);
  const editingView = useERDStore((state) => state.editingView);
  const updateView = useERDStore((state) => state.updateView);
  const deleteView = useERDStore((state) => state.deleteView);
  const closeViewModal = useERDStore((state) => state.closeViewModal);
  const columnGroups = useERDStore((state) => state.diagram.columnGroups || []);

  const [physicalName, setPhysicalName] = useState('');
  const [logicalName, setLogicalName] = useState('');
  const [schema, setSchema] = useState('');
  const [description, setDescription] = useState('');
  const [sql, setSql] = useState('');
  const [columns, setColumns] = useState<ERColumn[]>([]);
  const [columnGroupIds, setColumnGroupIds] = useState<string[]>([]);

  useEffect(() => {
    if (editingView) {
      setPhysicalName(editingView.physicalName);
      setLogicalName(editingView.logicalName);
      setSchema(editingView.schema || '');
      setDescription(editingView.description || '');
      setSql(editingView.sql || '');
      setColumns([...editingView.columns]);
      setColumnGroupIds([...(editingView.columnGroupIds || [])]);
    }
  }, [editingView]);

  if (!isViewModalOpen || !editingView) return null;

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        id: `${editingView.id}_col_${Date.now()}`,
        physicalName: `col_${columns.length + 1}`,
        logicalName: `컬럼_${columns.length + 1}`,
        type: 'varchar',
        length: 255,
        primaryKey: false,
        notNull: false,
        uniqueKey: false,
        autoIncrement: false
      }
    ]);
  };

  const handleSave = () => {
    const updated: ERView = {
      ...editingView,
      physicalName: physicalName.trim() || 'v_view',
      logicalName: logicalName.trim() || physicalName,
      schema: schema.trim() || undefined,
      description,
      sql,
      columns,
      columnGroupIds: columnGroupIds.length > 0 ? columnGroupIds : undefined
    };
    updateView(updated);
  };

  const toggleGroup = (id: string) => {
    setColumnGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={16} color="#a6e3a1" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>뷰(View) 속성 및 SQL 편집</span>
          </div>
          <button onClick={closeViewModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>물리명 *</label>
              <input className="input-field" value={physicalName} onChange={(e) => setPhysicalName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>논리명</label>
              <input className="input-field" value={logicalName} onChange={(e) => setLogicalName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>스키마</label>
              <input className="input-field" value={schema} onChange={(e) => setSchema(e.target.value)} placeholder="public" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>설명</label>
            <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>SQL 정의</label>
            <textarea
              className="input-field"
              rows={5}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
              placeholder="SELECT id, name FROM users"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>뷰 컬럼 ({columns.length})</span>
              <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddColumn}>
                <Plus size={12} />
                <span>컬럼 추가</span>
              </button>
            </div>
            {columns.map((col, idx) => (
              <div key={col.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 60px 30px', gap: '6px', marginBottom: '6px' }}>
                <input
                  className="input-field"
                  value={col.physicalName}
                  onChange={(e) => {
                    const next = [...columns];
                    next[idx] = { ...next[idx], physicalName: e.target.value };
                    setColumns(next);
                  }}
                  placeholder="물리명"
                />
                <input
                  className="input-field"
                  value={col.logicalName}
                  onChange={(e) => {
                    const next = [...columns];
                    next[idx] = { ...next[idx], logicalName: e.target.value };
                    setColumns(next);
                  }}
                  placeholder="논리명"
                />
                <input
                  className="input-field"
                  value={col.type}
                  onChange={(e) => {
                    const next = [...columns];
                    next[idx] = { ...next[idx], type: e.target.value };
                    setColumns(next);
                  }}
                  placeholder="varchar"
                />
                <input
                  type="number"
                  className="input-field"
                  value={col.length ?? ''}
                  onChange={(e) => {
                    const next = [...columns];
                    next[idx] = { ...next[idx], length: e.target.value ? Number(e.target.value) : undefined };
                    setColumns(next);
                  }}
                  placeholder="길이"
                />
                <button
                  onClick={() => setColumns(columns.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {columnGroups.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>적용된 컬럼 그룹</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {columnGroups.map((g) => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={columnGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                    <span>{g.groupName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn"
            style={{ backgroundColor: 'rgba(243, 139, 168, 0.15)', color: '#f38ba8', border: '1px solid rgba(243, 139, 168, 0.3)' }}
            onClick={() => deleteView(editingView.id)}
          >
            <Trash2 size={14} />
            <span>뷰 삭제</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={closeViewModal}>취소</button>
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
