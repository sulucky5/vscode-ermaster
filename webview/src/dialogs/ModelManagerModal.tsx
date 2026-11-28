import React, { useState } from 'react';
import { useERDStore, ModelManagerTab } from '../store/useERDStore.js';
import {
  Word,
  ColumnGroup,
  ERSequence,
  ERTrigger,
  ERTablespace,
  ERModelProperties,
  ERTestData,
  ERChangeTracking,
  ERTranslationEntry
} from '../types/erm.types.js';
import { X, Plus, Trash2, Layers, Copy, Wand2 } from 'lucide-react';

const TABS: { id: ModelManagerTab; label: string }[] = [
  { id: 'dictionary', label: '단어 사전' },
  { id: 'columnGroups', label: '컬럼 그룹' },
  { id: 'sequences', label: '시퀀스' },
  { id: 'triggers', label: '트리거' },
  { id: 'tablespaces', label: '테이블스페이스' },
  { id: 'modelProperties', label: '모델 속성' },
  { id: 'testData', label: '테스트 데이터' },
  { id: 'changeTracking', label: '변경 이력' },
  { id: 'translations', label: '단어 번역' }
];

export const ModelManagerModal: React.FC = () => {
  const isModelManagerOpen = useERDStore((state) => state.isModelManagerOpen);
  const modelManagerTab = useERDStore((state) => state.modelManagerTab);
  const openModelManager = useERDStore((state) => state.openModelManager);
  const closeModelManager = useERDStore((state) => state.closeModelManager);
  const diagram = useERDStore((state) => state.diagram);

  const setDictionary = useERDStore((state) => state.setDictionary);
  const setColumnGroups = useERDStore((state) => state.setColumnGroups);
  const setSequences = useERDStore((state) => state.setSequences);
  const setTriggers = useERDStore((state) => state.setTriggers);
  const setTablespaces = useERDStore((state) => state.setTablespaces);
  const updateModelProperties = useERDStore((state) => state.updateModelProperties);
  const setTestDataList = useERDStore((state) => state.setTestDataList);
  const setChangeTrackingList = useERDStore((state) => state.setChangeTrackingList);
  const setTranslations = useERDStore((state) => state.setTranslations);
  const initDiagram = useERDStore((state) => state.initDiagram);
  const fileName = useERDStore((state) => state.fileName);
  const notifyUpdate = useERDStore((state) => state.notifyUpdate);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTdIndex, setSelectedTdIndex] = useState<number>(0);
  const [selectedTdTableId, setSelectedTdTableId] = useState<string>('');
  const [trackingComment, setTrackingComment] = useState<string>('');

  if (!isModelManagerOpen) return null;

  const dictionary = diagram.dictionary || [];
  const columnGroups = diagram.columnGroups || [];
  const sequences = diagram.sequences || [];
  const triggers = diagram.triggers || [];
  const tablespaces = diagram.tablespaces || [];
  const testDataList = diagram.testDataList || [];
  const mp: ERModelProperties = diagram.modelProperties || {
    x: 40,
    y: 40,
    width: 240,
    height: 140,
    display: false,
    properties: []
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>데이터 모델 요소 관리</span>
          </div>
          <button onClick={closeModelManager} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => openModelManager(tab.id)}
                className={`btn ${modelManagerTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1. Dictionary */}
          {modelManagerTab === 'dictionary' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>공통 단어 사전 ({dictionary.length}개)</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => {
                    const newWord: Word = {
                      id: String(Date.now()),
                      physicalName: `word_${dictionary.length + 1}`,
                      logicalName: `단어_${dictionary.length + 1}`,
                      description: '',
                      type: 'varchar',
                      length: 255
                    };
                    setDictionary([...dictionary, newWord]);
                  }}
                >
                  <Plus size={12} />
                  <span>단어 추가</span>
                </button>
              </div>
              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dictionary.map((w, idx) => (
                  <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 70px 1fr 28px', gap: '6px', alignItems: 'center' }}>
                    <input
                      className="input-field"
                      value={w.physicalName}
                      onChange={(e) => {
                        const next = [...dictionary];
                        next[idx] = { ...next[idx], physicalName: e.target.value };
                        setDictionary(next);
                      }}
                      placeholder="물리명"
                    />
                    <input
                      className="input-field"
                      value={w.logicalName}
                      onChange={(e) => {
                        const next = [...dictionary];
                        next[idx] = { ...next[idx], logicalName: e.target.value };
                        setDictionary(next);
                      }}
                      placeholder="논리명"
                    />
                    <input
                      className="input-field"
                      value={w.type}
                      onChange={(e) => {
                        const next = [...dictionary];
                        next[idx] = { ...next[idx], type: e.target.value };
                        setDictionary(next);
                      }}
                      placeholder="타입"
                    />
                    <input
                      type="number"
                      className="input-field"
                      value={w.length ?? ''}
                      onChange={(e) => {
                        const next = [...dictionary];
                        next[idx] = { ...next[idx], length: e.target.value ? Number(e.target.value) : undefined };
                        setDictionary(next);
                      }}
                      placeholder="길이"
                    />
                    <input
                      className="input-field"
                      value={w.description}
                      onChange={(e) => {
                        const next = [...dictionary];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setDictionary(next);
                      }}
                      placeholder="설명"
                    />
                    <button onClick={() => setDictionary(dictionary.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Column Groups */}
          {modelManagerTab === 'columnGroups' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>재사용 가능한 공통 컬럼 그룹 ({columnGroups.length}개)</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => {
                    const newGroup: ColumnGroup = {
                      id: `cg_${Date.now()}`,
                      groupName: `공통컬럼_${columnGroups.length + 1}`,
                      columns: [
                        {
                          id: `cg_col_${Date.now()}`,
                          physicalName: 'created_at',
                          logicalName: '생성일시',
                          type: 'timestamp',
                          primaryKey: false,
                          notNull: true,
                          uniqueKey: false,
                          autoIncrement: false
                        }
                      ]
                    };
                    setColumnGroups([...columnGroups, newGroup]);
                    setSelectedGroupId(newGroup.id);
                  }}
                >
                  <Plus size={12} />
                  <span>그룹 추가</span>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                {columnGroups.map((g, gIdx) => (
                  <div key={g.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        className="input-field"
                        value={g.groupName}
                        onChange={(e) => {
                          const next = [...columnGroups];
                          next[gIdx] = { ...next[gIdx], groupName: e.target.value };
                          setColumnGroups(next);
                        }}
                      />
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => setSelectedGroupId(selectedGroupId === g.id ? null : g.id)}
                      >
                        {selectedGroupId === g.id ? '접기' : `컬럼 (${g.columns.length})`}
                      </button>
                      <button onClick={() => setColumnGroups(columnGroups.filter((_, i) => i !== gIdx))} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {selectedGroupId === g.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                        {g.columns.map((c, cIdx) => (
                          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 60px 28px', gap: '6px' }}>
                            <input
                              className="input-field"
                              value={c.physicalName}
                              onChange={(e) => {
                                const next = [...columnGroups];
                                next[gIdx].columns[cIdx] = { ...c, physicalName: e.target.value };
                                setColumnGroups(next);
                              }}
                              placeholder="물리명"
                            />
                            <input
                              className="input-field"
                              value={c.logicalName}
                              onChange={(e) => {
                                const next = [...columnGroups];
                                next[gIdx].columns[cIdx] = { ...c, logicalName: e.target.value };
                                setColumnGroups(next);
                              }}
                              placeholder="논리명"
                            />
                            <input
                              className="input-field"
                              value={c.type}
                              onChange={(e) => {
                                const next = [...columnGroups];
                                next[gIdx].columns[cIdx] = { ...c, type: e.target.value };
                                setColumnGroups(next);
                              }}
                              placeholder="타입"
                            />
                            <input
                              type="number"
                              className="input-field"
                              value={c.length ?? ''}
                              onChange={(e) => {
                                const next = [...columnGroups];
                                next[gIdx].columns[cIdx] = { ...c, length: e.target.value ? Number(e.target.value) : undefined };
                                setColumnGroups(next);
                              }}
                              placeholder="길이"
                            />
                            <button
                              onClick={() => {
                                const next = [...columnGroups];
                                next[gIdx] = { ...g, columns: g.columns.filter((_, i) => i !== cIdx) };
                                setColumnGroups(next);
                              }}
                              style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="btn btn-secondary"
                          style={{ alignSelf: 'flex-start', padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => {
                            const next = [...columnGroups];
                            next[gIdx] = {
                              ...g,
                              columns: [
                                ...g.columns,
                                {
                                  id: `cg_col_${Date.now()}`,
                                  physicalName: `col_${g.columns.length + 1}`,
                                  logicalName: `컬럼_${g.columns.length + 1}`,
                                  type: 'varchar',
                                  length: 100,
                                  primaryKey: false,
                                  notNull: false,
                                  uniqueKey: false,
                                  autoIncrement: false
                                }
                              ]
                            };
                            setColumnGroups(next);
                          }}
                        >
                          + 컬럼 추가
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Sequences */}
          {modelManagerTab === 'sequences' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>시퀀스 ({sequences.length}개)</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => {
                    const newSeq: ERSequence = {
                      id: `seq_${Date.now()}`,
                      name: `SEQ_${sequences.length + 1}`,
                      increment: 1,
                      start: 1,
                      cache: 20,
                      cycle: false
                    };
                    setSequences([...sequences, newSeq]);
                  }}
                >
                  <Plus size={12} />
                  <span>시퀀스 추가</span>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {sequences.map((seq, idx) => (
                  <div key={seq.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 70px auto 28px', gap: '6px', alignItems: 'center' }}>
                    <input
                      className="input-field"
                      value={seq.name}
                      onChange={(e) => {
                        const next = [...sequences];
                        next[idx] = { ...seq, name: e.target.value };
                        setSequences(next);
                      }}
                      placeholder="시퀀스명"
                    />
                    <input
                      className="input-field"
                      value={seq.schema || ''}
                      onChange={(e) => {
                        const next = [...sequences];
                        next[idx] = { ...seq, schema: e.target.value || undefined };
                        setSequences(next);
                      }}
                      placeholder="스키마"
                    />
                    <input
                      type="number"
                      className="input-field"
                      value={seq.start ?? ''}
                      onChange={(e) => {
                        const next = [...sequences];
                        next[idx] = { ...seq, start: e.target.value ? Number(e.target.value) : undefined };
                        setSequences(next);
                      }}
                      placeholder="Start"
                    />
                    <input
                      type="number"
                      className="input-field"
                      value={seq.increment ?? ''}
                      onChange={(e) => {
                        const next = [...sequences];
                        next[idx] = { ...seq, increment: e.target.value ? Number(e.target.value) : undefined };
                        setSequences(next);
                      }}
                      placeholder="Inc"
                    />
                    <input
                      type="number"
                      className="input-field"
                      value={seq.cache ?? ''}
                      onChange={(e) => {
                        const next = [...sequences];
                        next[idx] = { ...seq, cache: e.target.value ? Number(e.target.value) : undefined };
                        setSequences(next);
                      }}
                      placeholder="Cache"
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(seq.cycle)}
                        onChange={(e) => {
                          const next = [...sequences];
                          next[idx] = { ...seq, cycle: e.target.checked };
                          setSequences(next);
                        }}
                      />
                      Cycle
                    </label>
                    <button onClick={() => setSequences(sequences.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Triggers */}
          {modelManagerTab === 'triggers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>트리거 ({triggers.length}개)</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => {
                    const newTrg: ERTrigger = {
                      id: `trg_${Date.now()}`,
                      name: `TRG_${triggers.length + 1}`,
                      sql: 'CREATE TRIGGER ...'
                    };
                    setTriggers([...triggers, newTrg]);
                  }}
                >
                  <Plus size={12} />
                  <span>트리거 추가</span>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                {triggers.map((trg, idx) => (
                  <div key={trg.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px', gap: '8px', marginBottom: '6px' }}>
                      <input
                        className="input-field"
                        value={trg.name}
                        onChange={(e) => {
                          const next = [...triggers];
                          next[idx] = { ...trg, name: e.target.value };
                          setTriggers(next);
                        }}
                        placeholder="트리거명"
                      />
                      <input
                        className="input-field"
                        value={trg.schema || ''}
                        onChange={(e) => {
                          const next = [...triggers];
                          next[idx] = { ...trg, schema: e.target.value || undefined };
                          setTriggers(next);
                        }}
                        placeholder="스키마"
                      />
                      <button onClick={() => setTriggers(triggers.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      className="input-field"
                      rows={3}
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      value={trg.sql}
                      onChange={(e) => {
                        const next = [...triggers];
                        next[idx] = { ...trg, sql: e.target.value };
                        setTriggers(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Tablespaces */}
          {modelManagerTab === 'tablespaces' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>테이블스페이스 ({tablespaces.length}개)</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => {
                    const newTs: ERTablespace = {
                      id: `ts_${Date.now()}`,
                      name: `TS_${tablespaces.length + 1}`,
                      properties: {}
                    };
                    setTablespaces([...tablespaces, newTs]);
                  }}
                >
                  <Plus size={12} />
                  <span>테이블스페이스 추가</span>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {tablespaces.map((ts, idx) => (
                  <div key={ts.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 28px', gap: '8px', alignItems: 'center' }}>
                    <input
                      className="input-field"
                      value={ts.name}
                      onChange={(e) => {
                        const next = [...tablespaces];
                        next[idx] = { ...ts, name: e.target.value };
                        setTablespaces(next);
                      }}
                      placeholder="테이블스페이스명"
                    />
                    <input
                      className="input-field"
                      value={ts.properties?.location || ''}
                      onChange={(e) => {
                        const next = [...tablespaces];
                        next[idx] = { ...ts, properties: { ...(ts.properties || {}), location: e.target.value } };
                        setTablespaces(next);
                      }}
                      placeholder="경로 (Location / Data File)"
                    />
                    <input
                      className="input-field"
                      value={ts.description || ''}
                      onChange={(e) => {
                        const next = [...tablespaces];
                        next[idx] = { ...ts, description: e.target.value };
                        setTablespaces(next);
                      }}
                      placeholder="설명"
                    />
                    <button onClick={() => setTablespaces(tablespaces.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Model Properties */}
          {modelManagerTab === 'modelProperties' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mp.display}
                  onChange={(e) => updateModelProperties({ ...mp, display: e.target.checked })}
                />
                <span>캔버스에 모델 속성(Model Properties) 카드 표시</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>속성 목록</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() =>
                    updateModelProperties({
                      ...mp,
                      properties: [...mp.properties, { name: '작성자', value: '' }]
                    })
                  }
                >
                  <Plus size={12} />
                  <span>속성 추가</span>
                </button>
              </div>
              {mp.properties.map((p, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 28px', gap: '8px', alignItems: 'center' }}>
                  <input
                    className="input-field"
                    value={p.name}
                    onChange={(e) => {
                      const next = [...mp.properties];
                      next[idx] = { ...p, name: e.target.value };
                      updateModelProperties({ ...mp, properties: next });
                    }}
                    placeholder="속성명"
                  />
                  <input
                    className="input-field"
                    value={p.value}
                    onChange={(e) => {
                      const next = [...mp.properties];
                      next[idx] = { ...p, value: e.target.value };
                      updateModelProperties({ ...mp, properties: next });
                    }}
                    placeholder="값"
                  />
                  <button
                    onClick={() =>
                      updateModelProperties({
                        ...mp,
                        properties: mp.properties.filter((_, i) => i !== idx)
                      })
                    }
                    style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 7. Test Data */}
          {modelManagerTab === 'testData' && (() => {
            const activeTd = testDataList[selectedTdIndex];
            const activeTableId = selectedTdTableId || diagram.tables[0]?.id || '';
            const activeTable = diagram.tables.find((t) => t.id === activeTableId);
            const tableTd = activeTd?.tableTestData.find((ttd) => ttd.tableId === activeTableId);
            const rows = tableTd?.directTestData || [];

            const updateRows = (nextRows: { values: Record<string, string> }[]) => {
              if (!activeTd || !activeTable) return;
              const nextList = [...testDataList];
              const exists = activeTd.tableTestData.some((x) => x.tableId === activeTable.id);
              const nextTableData = exists
                ? activeTd.tableTestData.map((x) =>
                    x.tableId === activeTable.id ? { ...x, directTestData: nextRows } : x
                  )
                : [...activeTd.tableTestData, { tableId: activeTable.id, directTestData: nextRows }];
              nextList[selectedTdIndex] = { ...activeTd, tableTestData: nextTableData };
              setTestDataList(nextList);
            };

            const copyInsertSql = () => {
              if (!activeTable || rows.length === 0) return;
              const cols = activeTable.columns.map((c) => c.physicalName);
              const sql = rows
                .map((r) => {
                  const vals = activeTable.columns.map((c) => {
                    const v = r.values[c.id] ?? '';
                    return `'${v.replace(/'/g, "''")}'`;
                  });
                  return `INSERT INTO ${activeTable.physicalName} (${cols.join(', ')}) VALUES (${vals.join(', ')});`;
                })
                .join('\n');
              navigator.clipboard.writeText(sql);
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      className="input-field"
                      style={{ width: '180px' }}
                      value={selectedTdIndex}
                      onChange={(e) => setSelectedTdIndex(Number(e.target.value))}
                    >
                      {testDataList.map((td, idx) => (
                        <option key={td.id} value={idx}>{td.name}</option>
                      ))}
                    </select>
                    {activeTd && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => {
                          setTestDataList(testDataList.filter((_, i) => i !== selectedTdIndex));
                          setSelectedTdIndex(0);
                        }}
                      >
                        세트 삭제
                      </button>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={() => {
                      const newTd: ERTestData = {
                        id: `td_${Date.now()}`,
                        name: `테스트데이터_${testDataList.length + 1}`,
                        tableTestData: []
                      };
                      setTestDataList([...testDataList, newTd]);
                      setSelectedTdIndex(testDataList.length);
                    }}
                  >
                    <Plus size={12} />
                    <span>테스트 데이터 세트 추가</span>
                  </button>
                </div>

                {activeTd && activeTable && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>대상 테이블:</span>
                        <select
                          className="input-field"
                          style={{ width: '200px' }}
                          value={activeTable.id}
                          onChange={(e) => setSelectedTdTableId(e.target.value)}
                        >
                          {diagram.tables.map((t) => (
                            <option key={t.id} value={t.id}>{t.physicalName}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={copyInsertSql}
                        >
                          <Copy size={12} />
                          <span>INSERT SQL 복사</span>
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => updateRows([...rows, { values: {} }])}
                        >
                          <Plus size={12} />
                          <span>행 추가</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto', maxHeight: '240px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            {activeTable.columns.map((c) => (
                              <th key={c.id} style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                {c.physicalName}
                              </th>
                            ))}
                            <th style={{ width: '28px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, rIdx) => (
                            <tr key={rIdx}>
                              {activeTable.columns.map((c) => (
                                <td key={c.id} style={{ padding: '4px' }}>
                                  <input
                                    className="input-field"
                                    value={r.values[c.id] ?? ''}
                                    onChange={(e) => {
                                      const next = [...rows];
                                      next[rIdx] = { values: { ...r.values, [c.id]: e.target.value } };
                                      updateRows(next);
                                    }}
                                  />
                                </td>
                              ))}
                              <td style={{ padding: '4px', textAlign: 'center' }}>
                                <button
                                  onClick={() => updateRows(rows.filter((_, i) => i !== rIdx))}
                                  style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* 8. Change Tracking */}
          {modelManagerTab === 'changeTracking' && (() => {
            const list = diagram.changeTrackingList || [];
            const currentNames = new Set(diagram.tables.map((t) => t.physicalName));
            const totalCols = diagram.tables.reduce((acc, t) => acc + t.columns.length, 0);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="input-field"
                    value={trackingComment}
                    onChange={(e) => setTrackingComment(e.target.value)}
                    placeholder="변경 이력 메모 (예: v1.1 주문 테이블 추가)"
                  />
                  <button
                    className="btn btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => {
                      const entry: ERChangeTracking = {
                        id: `ct_${Date.now()}`,
                        comment: trackingComment.trim() || `체크포인트 #${list.length + 1}`,
                        updatedDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
                        tableNames: diagram.tables.map((t) => t.physicalName),
                        tableCount: diagram.tables.length,
                        columnCount: totalCols
                      };
                      setChangeTrackingList([entry, ...list]);
                      setTrackingComment('');
                    }}
                  >
                    <Plus size={13} />
                    <span>스냅샷 기록</span>
                  </button>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.map((ct, idx) => {
                    const snapSet = new Set(ct.tableNames || []);
                    const added = [...currentNames].filter((n) => !snapSet.has(n));
                    const removed = [...snapSet].filter((n) => !currentNames.has(n));
                    return (
                      <div key={ct.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong>{ct.comment}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ct.updatedDate}</span>
                            <button
                              onClick={() => setChangeTrackingList(list.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          기록 시점: 테이블 {ct.tableCount}개 / 컬럼 {ct.columnCount}개
                          {(added.length > 0 || removed.length > 0) && (
                            <span style={{ marginLeft: '10px', color: '#f9e2af' }}>
                              (현재와 차이: {added.length > 0 ? `+${added.join(', ')}` : ''} {removed.length > 0 ? `-${removed.join(', ')}` : ''})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 9. Translations */}
          {modelManagerTab === 'translations' && (() => {
            const list = diagram.translations || [];
            const applyTranslations = () => {
              const map = new Map(list.map((tr) => [tr.logicalName.trim(), tr.physicalName.trim()]));
              const translateText = (logical: string, fallback: string) => {
                if (!logical) return fallback;
                if (map.has(logical.trim())) return map.get(logical.trim())!;
                let out = logical;
                for (const [k, v] of map.entries()) {
                  if (k && out.includes(k)) out = out.split(k).join(`_${v}_`);
                }
                return out.replace(/^_+|_+$/g, '').replace(/_+/g, '_') || fallback;
              };
              const nextTables = diagram.tables.map((t) => ({
                ...t,
                physicalName: translateText(t.logicalName, t.physicalName),
                columns: t.columns.map((c) => ({
                  ...c,
                  physicalName: translateText(c.logicalName, c.physicalName)
                }))
              }));
              initDiagram({ ...diagram, tables: nextTables }, fileName);
              notifyUpdate();
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>논리명 ↔ 물리명 단어 번역 사전 ({list.length}개)</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={applyTranslations}>
                      <Wand2 size={12} />
                      <span>테이블/컬럼 자동 번역</span>
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => {
                        const entry: ERTranslationEntry = { id: `tr_${Date.now()}`, logicalName: '사용자', physicalName: 'user' };
                        setTranslations([...list, entry]);
                      }}
                    >
                      <Plus size={12} />
                      <span>단어 추가</span>
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {list.map((tr, idx) => (
                    <div key={tr.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="input-field"
                        value={tr.logicalName}
                        onChange={(e) => {
                          const next = [...list];
                          next[idx] = { ...tr, logicalName: e.target.value };
                          setTranslations(next);
                        }}
                        placeholder="논리명 (예: 사용자)"
                      />
                      <input
                        className="input-field"
                        value={tr.physicalName}
                        onChange={(e) => {
                          const next = [...list];
                          next[idx] = { ...tr, physicalName: e.target.value };
                          setTranslations(next);
                        }}
                        placeholder="물리명 (예: user)"
                      />
                      <button
                        onClick={() => setTranslations(list.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={closeModelManager}>닫기</button>
        </div>
      </div>
    </div>
  );
};
