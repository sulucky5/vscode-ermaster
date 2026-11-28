import React, { useState, useMemo } from 'react';
import { useERDStore } from '../store/useERDStore.js';
import { X, Search } from 'lucide-react';

interface SearchResult {
  kind: 'Table' | 'Column' | 'View' | 'Note' | 'Sequence' | 'Trigger' | 'Word';
  label: string;
  subLabel: string;
  nodeId?: string;
}

export const SearchModal: React.FC = () => {
  const isOpen = useERDStore((state) => state.isSearchModalOpen);
  const closeModal = useERDStore((state) => state.closeSearchModal);
  const diagram = useERDStore((state) => state.diagram);
  const requestFocusNode = useERDStore((state) => state.requestFocusNode);
  const openModelManager = useERDStore((state) => state.openModelManager);

  const [query, setQuery] = useState('');

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const list: SearchResult[] = [];

    for (const t of diagram.tables) {
      if (
        t.physicalName.toLowerCase().includes(q) ||
        t.logicalName.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      ) {
        list.push({ kind: 'Table', label: t.physicalName, subLabel: t.logicalName, nodeId: t.id });
      }
      for (const c of t.columns) {
        if (
          c.physicalName.toLowerCase().includes(q) ||
          c.logicalName.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        ) {
          list.push({
            kind: 'Column',
            label: `${t.physicalName}.${c.physicalName}`,
            subLabel: `${c.logicalName} (${c.type})`,
            nodeId: t.id
          });
        }
      }
    }

    for (const v of diagram.views || []) {
      if (v.physicalName.toLowerCase().includes(q) || v.logicalName.toLowerCase().includes(q)) {
        list.push({ kind: 'View', label: v.physicalName, subLabel: v.logicalName, nodeId: v.id });
      }
    }

    for (const n of diagram.notes) {
      if (n.text.toLowerCase().includes(q)) {
        list.push({ kind: 'Note', label: n.text.slice(0, 40), subLabel: '메모', nodeId: n.id });
      }
    }

    for (const s of diagram.sequences || []) {
      if (s.name.toLowerCase().includes(q)) {
        list.push({ kind: 'Sequence', label: s.name, subLabel: s.schema || 'Sequence' });
      }
    }

    for (const tr of diagram.triggers || []) {
      if (tr.name.toLowerCase().includes(q)) {
        list.push({ kind: 'Trigger', label: tr.name, subLabel: tr.schema || 'Trigger' });
      }
    }

    for (const w of diagram.dictionary || []) {
      if (w.physicalName.toLowerCase().includes(q) || w.logicalName.toLowerCase().includes(q)) {
        list.push({ kind: 'Word', label: w.physicalName, subLabel: `${w.logicalName} (${w.type})` });
      }
    }

    return list.slice(0, 50);
  }, [query, diagram]);

  if (!isOpen) return null;

  const handleSelect = (r: SearchResult) => {
    if (r.nodeId) {
      requestFocusNode(r.nodeId);
      closeModal();
    } else if (r.kind === 'Sequence') {
      closeModal();
      openModelManager('sequences');
    } else if (r.kind === 'Trigger') {
      closeModal();
      openModelManager('triggers');
    } else if (r.kind === 'Word') {
      closeModal();
      openModelManager('dictionary');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>모델 검색 (테이블 / 컬럼 / 뷰 / 사전 등)</span>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            autoFocus
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="물리명, 논리명, 설명 검색..."
          />

          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {query.trim() && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                검색 결과가 없습니다.
              </div>
            )}
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => handleSelect(r)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#89b4fa', marginRight: '8px' }}>
                    [{r.kind}]
                  </span>
                  <span style={{ fontWeight: 600 }}>{r.label}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.subLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
