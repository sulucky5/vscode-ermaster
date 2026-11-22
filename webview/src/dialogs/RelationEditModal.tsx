import React, { useState, useEffect } from 'react';
import { useERDStore } from '../store/useERDStore.js';
import { ERRelation } from '../types/erm.types.js';
import { X, Check, Trash2, GitFork } from 'lucide-react';

export const RelationEditModal: React.FC = () => {
  const isRelationModalOpen = useERDStore((state) => state.isRelationModalOpen);
  const editingRelation = useERDStore((state) => state.editingRelation);
  const updateRelation = useERDStore((state) => state.updateRelation);
  const deleteRelation = useERDStore((state) => state.deleteRelation);
  const closeRelationModal = useERDStore((state) => state.closeRelationModal);
  const diagram = useERDStore((state) => state.diagram);

  const [name, setName] = useState('');
  const [parentCardinality, setParentCardinality] = useState('1');
  const [childCardinality, setChildCardinality] = useState('0..n');
  const [referenceForPK, setReferenceForPK] = useState(false);
  const [onDeleteAction, setOnDeleteAction] = useState('RESTRICT');
  const [onUpdateAction, setOnUpdateAction] = useState('RESTRICT');
  const [columnPairs, setColumnPairs] = useState<{ sourceId: string; targetId: string }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (editingRelation) {
      setConfirmDelete(false);
      setName(editingRelation.name || '');
      setParentCardinality(editingRelation.parentCardinality || '1');
      setChildCardinality(editingRelation.childCardinality || '0..n');
      setReferenceForPK(editingRelation.referenceForPK || false);
      setOnDeleteAction(editingRelation.onDeleteAction || 'RESTRICT');
      setOnUpdateAction(editingRelation.onUpdateAction || 'RESTRICT');
      const srcIds = editingRelation.sourceColumnIds || [];
      const tgtIds = editingRelation.targetColumnIds || [];
      const pairs: { sourceId: string; targetId: string }[] = [];
      const len = Math.max(srcIds.length, tgtIds.length);
      for (let i = 0; i < len; i++) {
        pairs.push({ sourceId: srcIds[i] || '', targetId: tgtIds[i] || '' });
      }
      setColumnPairs(pairs);
    }
  }, [editingRelation]);

  if (!isRelationModalOpen || !editingRelation) return null;

  const sourceTable = diagram.tables.find((t) => t.id === editingRelation.sourceTableId);
  const targetTable = diagram.tables.find((t) => t.id === editingRelation.targetTableId);

  const handleSave = () => {
    const validPairs = columnPairs.filter((p) => p.sourceId && p.targetId);
    const updated: ERRelation = {
      ...editingRelation,
      name: name.trim(),
      parentCardinality,
      childCardinality,
      referenceForPK,
      onDeleteAction,
      onUpdateAction,
      sourceColumnIds: validPairs.length > 0 ? validPairs.map((p) => p.sourceId) : undefined,
      targetColumnIds: validPairs.length > 0 ? validPairs.map((p) => p.targetId) : undefined
    };
    updateRelation(updated);
  };

  return (
    <div className="modal-overlay" onClick={closeRelationModal}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>관계선(Foreign Key) 속성 및 모양 설정</span>
          </div>
          <button
            onClick={closeRelationModal}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Table summary */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>부모 테이블: </span>
              <strong style={{ color: '#89b4fa' }}>{sourceTable?.physicalName || 'Source'}</strong>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>➔</span>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>자식 테이블: </span>
              <strong style={{ color: '#cba6f7' }}>{targetTable?.physicalName || 'Target'}</strong>
            </div>
          </div>

          {/* Relation Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              제약조건명 (FK Constraint Name)
            </label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`예: FK_${targetTable?.physicalName}_${sourceTable?.physicalName}`}
            />
          </div>

          {/* Relation Line Style (Identifying vs Non-Identifying) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              관계선 모양 (식별 / 비식별)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReferenceForPK(false)}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: !referenceForPK ? 'var(--accent-primary)' : 'var(--border-color)',
                  backgroundColor: !referenceForPK ? 'rgba(137, 180, 250, 0.15)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>비식별 관계 (점선)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>일반적인 외래키 참조</div>
              </button>

              <button
                type="button"
                onClick={() => setReferenceForPK(true)}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: referenceForPK ? 'var(--accent-primary)' : 'var(--border-color)',
                  backgroundColor: referenceForPK ? 'rgba(137, 180, 250, 0.15)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>식별 관계 (실선)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>자식 테이블의 PK로 포함</div>
              </button>
            </div>
          </div>

          {/* Cardinality */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                부모 카디널리티 (Parent)
              </label>
              <select
                className="input-field"
                value={parentCardinality}
                onChange={(e) => setParentCardinality(e.target.value)}
              >
                <option value="1">1 (1개 필수)</option>
                <option value="0..1">0..1 (0 또는 1개)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                자식 카디널리티 (Child)
              </label>
              <select
                className="input-field"
                value={childCardinality}
                onChange={(e) => setChildCardinality(e.target.value)}
              >
                <option value="0..n">0..n (0개 이상 - 1:N)</option>
                <option value="1..n">1..n (1개 이상 - 1:N)</option>
                <option value="1">1 (1개 - 1:1)</option>
                <option value="0..1">0..1 (0 또는 1개)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                ON DELETE
              </label>
              <select
                className="input-field"
                value={onDeleteAction}
                onChange={(e) => setOnDeleteAction(e.target.value)}
              >
                <option value="RESTRICT">RESTRICT</option>
                <option value="CASCADE">CASCADE</option>
                <option value="SET NULL">SET NULL</option>
                <option value="NO ACTION">NO ACTION</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                ON UPDATE
              </label>
              <select
                className="input-field"
                value={onUpdateAction}
                onChange={(e) => setOnUpdateAction(e.target.value)}
              >
                <option value="RESTRICT">RESTRICT</option>
                <option value="CASCADE">CASCADE</option>
                <option value="SET NULL">SET NULL</option>
                <option value="NO ACTION">NO ACTION</option>
              </select>
            </div>
          </div>

          {/* FK Column Mapping */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                외래키 컬럼 매핑 (FK Mapping - 복합키 지원)
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() =>
                  setColumnPairs([
                    ...columnPairs,
                    {
                      sourceId: sourceTable?.columns.find((c) => c.primaryKey)?.id || sourceTable?.columns[0]?.id || '',
                      targetId: targetTable?.columns[0]?.id || ''
                    }
                  ])
                }
              >
                + 컬럼 매핑 추가
              </button>
            </div>
            {columnPairs.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                미지정 시 부모 테이블의 PK와 자식 테이블 컬럼명으로 자동 추론합니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {columnPairs.map((pair, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '6px', alignItems: 'center' }}>
                    <select
                      className="input-field"
                      value={pair.sourceId}
                      onChange={(e) => {
                        const next = [...columnPairs];
                        next[idx] = { ...pair, sourceId: e.target.value };
                        setColumnPairs(next);
                      }}
                    >
                      <option value="">(부모 컬럼 선택)</option>
                      {(sourceTable?.columns || []).map((c) => (
                        <option key={c.id} value={c.id}>{c.physicalName}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>←</span>
                    <select
                      className="input-field"
                      value={pair.targetId}
                      onChange={(e) => {
                        const next = [...columnPairs];
                        next[idx] = { ...pair, targetId: e.target.value };
                        setColumnPairs(next);
                      }}
                    >
                      <option value="">(자식 컬럼 선택)</option>
                      {(targetTable?.columns || []).map((c) => (
                        <option key={c.id} value={c.id}>{c.physicalName}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setColumnPairs(columnPairs.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {confirmDelete ? (
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#f38ba8', fontWeight: 600 }}>
                정말 삭제하시겠습니까?
              </span>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => deleteRelation(editingRelation.id)}
              >
                <Trash2 size={14} />
                <span>삭제 확인</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDelete(false)}
              >
                취소
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginRight: 'auto' }}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} />
              <span>관계선 삭제</span>
            </button>
          )}
          <button className="btn btn-secondary" onClick={closeRelationModal}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={14} />
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
