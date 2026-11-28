import React, { useState, useEffect } from 'react';
import { useERDStore, vscode } from '../store/useERDStore.js';
import { ERDiagram } from '../types/erm.types.js';
import { X, FileUp, Check } from 'lucide-react';

export const ImportFileModal: React.FC = () => {
  const isOpen = useERDStore((state) => state.isImportFileModalOpen);
  const closeModal = useERDStore((state) => state.closeImportFileModal);
  const currentDiagram = useERDStore((state) => state.diagram);

  const [fileName, setFileName] = useState<string>('');
  const [sourceDiagram, setSourceDiagram] = useState<ERDiagram | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [selectedSequences, setSelectedSequences] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedTablespaces, setSelectedTablespaces] = useState<string[]>([]);
  const [selectedColumnGroups, setSelectedColumnGroups] = useState<string[]>([]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'importFile:loaded') {
        const src = msg.sourceDiagram as ERDiagram;
        setFileName(msg.fileName || '');
        setSourceDiagram(src);
        setError('');
        setSelectedTables(src.tables.map((t) => t.id));
        setSelectedViews((src.views || []).map((v) => v.id));
        setSelectedNotes((src.notes || []).map((n) => n.id));
        setSelectedSequences((src.sequences || []).map((s) => s.id));
        setSelectedTriggers((src.triggers || []).map((t) => t.id));
        setSelectedTablespaces((src.tablespaces || []).map((t) => t.id));
        setSelectedColumnGroups((src.columnGroups || []).map((g) => g.id));
      } else if (msg.type === 'importFile:error') {
        setError(msg.error || '파일을 불러오지 못했습니다.');
        setLoading(false);
      } else if (msg.type === 'importFile:done') {
        setLoading(false);
        setSourceDiagram(null);
        closeModal();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [closeModal]);

  if (!isOpen) return null;

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleBrowse = () => {
    setError('');
    if (vscode) {
      vscode.postMessage({ type: 'importFile:browse' });
    }
  };

  const handleImport = () => {
    if (!sourceDiagram || !vscode) return;
    setLoading(true);
    vscode.postMessage({
      type: 'importFile:execute',
      currentDiagram,
      sourceDiagram,
      selection: {
        tableIds: selectedTables,
        viewIds: selectedViews,
        noteIds: selectedNotes,
        sequenceIds: selectedSequences,
        triggerIds: selectedTriggers,
        tablespaceIds: selectedTablespaces,
        columnGroupIds: selectedColumnGroups
      }
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileUp size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>파일 / 외부 모델 가져오기 (.erm / .sql)</span>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleBrowse}>
              <FileUp size={14} />
              <span>파일 선택 (.erm, .sql)</span>
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {fileName ? `선택된 파일: ${fileName}` : '가져올 ERMaster(.erm) 또는 SQL DDL(.sql) 파일을 선택하세요.'}
            </span>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(243, 139, 168, 0.15)', color: '#f38ba8', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {sourceDiagram && (
            <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  테이블 ({selectedTables.length}/{sourceDiagram.tables.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {sourceDiagram.tables.map((t) => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedTables.includes(t.id)} onChange={() => toggle(selectedTables, setSelectedTables, t.id)} />
                      <span>{t.physicalName} {t.logicalName && t.logicalName !== t.physicalName ? `(${t.logicalName})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(sourceDiagram.views || []).length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    뷰 ({selectedViews.length}/{sourceDiagram.views.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {sourceDiagram.views.map((v) => (
                      <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedViews.includes(v.id)} onChange={() => toggle(selectedViews, setSelectedViews, v.id)} />
                        <span>{v.physicalName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(sourceDiagram.sequences || []).length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    시퀀스 ({selectedSequences.length}/{sourceDiagram.sequences.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {sourceDiagram.sequences.map((s) => (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedSequences.includes(s.id)} onChange={() => toggle(selectedSequences, setSelectedSequences, s.id)} />
                        <span>{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(sourceDiagram.triggers || []).length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    트리거 ({selectedTriggers.length}/{sourceDiagram.triggers.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {sourceDiagram.triggers.map((t) => (
                      <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedTriggers.includes(t.id)} onChange={() => toggle(selectedTriggers, setSelectedTriggers, t.id)} />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(sourceDiagram.columnGroups || []).length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    컬럼 그룹 ({selectedColumnGroups.length}/{sourceDiagram.columnGroups.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {sourceDiagram.columnGroups.map((g) => (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedColumnGroups.includes(g.id)} onChange={() => toggle(selectedColumnGroups, setSelectedColumnGroups, g.id)} />
                        <span>{g.groupName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>취소</button>
          <button className="btn btn-primary" disabled={!sourceDiagram || loading} onClick={handleImport}>
            <Check size={14} />
            <span>{loading ? '가져오는 중...' : '선택한 요소 가져오기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
