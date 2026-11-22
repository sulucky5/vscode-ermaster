import React, { useState, useEffect } from 'react';
import { useERDStore } from '../store/useERDStore.js';
import { ERTable, ERColumn } from '../types/erm.types.js';
import { X, Check, TableProperties } from 'lucide-react';

export const EditAllAttributesModal: React.FC = () => {
  const isOpen = useERDStore((state) => state.isEditAllModalOpen);
  const closeModal = useERDStore((state) => state.closeEditAllModal);
  const diagram = useERDStore((state) => state.diagram);
  const updateAllTables = useERDStore((state) => state.updateAllTables);

  const [tables, setTables] = useState<ERTable[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTables(diagram.tables.map((t) => ({ ...t, columns: t.columns.map((c) => ({ ...c })) })));
      setFilter('');
    }
  }, [isOpen, diagram.tables]);

  if (!isOpen) return null;

  const updateCol = (tIdx: number, cIdx: number, field: keyof ERColumn, val: any) => {
    setTables((prev) => {
      const next = [...prev];
      const cols = [...next[tIdx].columns];
      cols[cIdx] = { ...cols[cIdx], [field]: val };
      next[tIdx] = { ...next[tIdx], columns: cols };
      return next;
    });
  };

  const q = filter.trim().toLowerCase();

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" style={{ maxWidth: '1050px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TableProperties size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>전체 속성 일괄 편집 (Edit All Attributes)</span>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            className="input-field"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="테이블명 또는 컬럼명 필터..."
          />
          <div style={{ maxHeight: '420px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 2 }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>테이블</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>컬럼 물리명</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>컬럼 논리명</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', width: '100px' }}>타입</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', width: '60px' }}>길이</th>
                  <th style={{ padding: '6px', textAlign: 'center', width: '34px' }}>PK</th>
                  <th style={{ padding: '6px', textAlign: 'center', width: '34px' }}>NN</th>
                  <th style={{ padding: '6px', textAlign: 'center', width: '34px' }}>UK</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', width: '90px' }}>기본값</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>설명</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t, tIdx) =>
                  t.columns.map((c, cIdx) => {
                    if (
                      q &&
                      !t.physicalName.toLowerCase().includes(q) &&
                      !c.physicalName.toLowerCase().includes(q) &&
                      !c.logicalName.toLowerCase().includes(q)
                    ) {
                      return null;
                    }
                    return (
                      <tr key={`${t.id}_${c.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '4px 8px', color: '#89b4fa', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {t.physicalName}
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input className="input-field" value={c.physicalName} onChange={(e) => updateCol(tIdx, cIdx, 'physicalName', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input className="input-field" value={c.logicalName} onChange={(e) => updateCol(tIdx, cIdx, 'logicalName', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input className="input-field" value={c.type} onChange={(e) => updateCol(tIdx, cIdx, 'type', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="number"
                            className="input-field"
                            value={c.length ?? ''}
                            onChange={(e) => updateCol(tIdx, cIdx, 'length', e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <input type="checkbox" checked={c.primaryKey} onChange={(e) => updateCol(tIdx, cIdx, 'primaryKey', e.target.checked)} />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <input type="checkbox" checked={c.notNull} onChange={(e) => updateCol(tIdx, cIdx, 'notNull', e.target.checked)} />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <input type="checkbox" checked={c.uniqueKey} onChange={(e) => updateCol(tIdx, cIdx, 'uniqueKey', e.target.checked)} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input className="input-field" value={c.defaultValue || ''} onChange={(e) => updateCol(tIdx, cIdx, 'defaultValue', e.target.value || undefined)} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input className="input-field" value={c.description || ''} onChange={(e) => updateCol(tIdx, cIdx, 'description', e.target.value || undefined)} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>취소</button>
          <button className="btn btn-primary" onClick={() => updateAllTables(tables)}>
            <Check size={14} />
            <span>전체 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
