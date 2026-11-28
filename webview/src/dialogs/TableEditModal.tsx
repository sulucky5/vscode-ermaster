import React, { useState, useEffect } from 'react';
import { useERDStore } from '../store/useERDStore.js';
import {
  ERTable,
  ERColumn,
  ERIndex,
  ERComplexUniqueKey,
  RGBColor
} from '../types/erm.types.js';
import { Plus, Trash2, X, Check, ArrowUp, ArrowDown } from 'lucide-react';

const TABLE_PRESET_COLORS: Array<{ label: string; r: number; g: number; b: number }> = [
  { label: '블루', r: 137, g: 180, b: 250 },
  { label: '퍼플', r: 203, g: 166, b: 247 },
  { label: '그린', r: 166, g: 227, b: 161 },
  { label: '틸', r: 148, g: 226, b: 213 },
  { label: '옐로우', r: 249, g: 226, b: 175 },
  { label: '오렌지', r: 250, g: 179, b: 135 },
  { label: '레드', r: 243, g: 139, b: 168 },
  { label: '인디고', r: 128, g: 128, b: 192 }
];

function rgbToHex(c: RGBColor): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

function hexToRgb(hex: string): RGBColor {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 128, g: 128, b: 192 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

const COMMON_SQL_TYPES = [
  'BIGINT',
  'INTEGER',
  'SMALLINT',
  'VARCHAR',
  'CHAR',
  'TEXT',
  'DECIMAL',
  'NUMERIC',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'BOOLEAN',
  'BLOB',
  'JSON',
  'UUID'
];

type TableTab = 'columns' | 'indexes' | 'uniqueKeys' | 'properties';

export const TableEditModal: React.FC = () => {
  const isTableModalOpen = useERDStore((state) => state.isTableModalOpen);
  const editingTable = useERDStore((state) => state.editingTable);
  const updateTable = useERDStore((state) => state.updateTable);
  const deleteTable = useERDStore((state) => state.deleteTable);
  const closeTableModal = useERDStore((state) => state.closeTableModal);
  const diagram = useERDStore((state) => state.diagram);

  const [activeTab, setActiveTab] = useState<TableTab>('columns');
  const [physicalName, setPhysicalName] = useState('');
  const [logicalName, setLogicalName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<ERColumn[]>([]);
  const [columnGroupIds, setColumnGroupIds] = useState<string[]>([]);
  const [indexes, setIndexes] = useState<ERIndex[]>([]);
  const [complexUniqueKeys, setComplexUniqueKeys] = useState<ERComplexUniqueKey[]>([]);
  const [schema, setSchema] = useState('');
  const [tablespaceId, setTablespaceId] = useState('');
  const [primaryKeyName, setPrimaryKeyName] = useState('');
  const [constraint, setConstraint] = useState('');
  const [storageEngine, setStorageEngine] = useState('');
  const [option, setOption] = useState('');
  const [color, setColor] = useState<RGBColor | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTable) {
      setConfirmDelete(false);
      setNameError(null);
      setActiveTab('columns');
      setPhysicalName(editingTable.physicalName);
      setLogicalName(editingTable.logicalName);
      setDescription(editingTable.description || '');
      setColor(editingTable.color);
      setColumns([...editingTable.columns]);
      setColumnGroupIds([...(editingTable.columnGroupIds || [])]);
      setIndexes([...(editingTable.indexes || [])]);
      setComplexUniqueKeys([...(editingTable.complexUniqueKeys || [])]);
      setSchema(editingTable.tableProperties?.schema || '');
      setTablespaceId(editingTable.tableProperties?.tablespaceId || '');
      setPrimaryKeyName(editingTable.primaryKeyName || '');
      setConstraint(editingTable.constraint || '');
      setStorageEngine(editingTable.tableProperties?.storageEngine || '');
      setOption(editingTable.option || '');
    }
  }, [editingTable]);

  if (!isTableModalOpen || !editingTable) return null;

  const handleAddColumn = () => {
    const newCol: ERColumn = {
      id: `${editingTable.id}_col_${Date.now()}`,
      physicalName: `col_${columns.length + 1}`,
      logicalName: `컬럼_${columns.length + 1}`,
      type: 'varchar',
      length: 255,
      primaryKey: false,
      notNull: false,
      uniqueKey: false,
      autoIncrement: false
    };
    setColumns([...columns, newCol]);
  };

  const handleAddFromWord = (wordId: string) => {
    const w = (diagram.dictionary || []).find((d) => d.id === wordId);
    if (!w) return;
    setColumns([
      ...columns,
      {
        id: `${editingTable.id}_col_${Date.now()}`,
        wordId: w.id,
        physicalName: w.physicalName,
        logicalName: w.logicalName,
        type: w.type || 'varchar',
        length: w.length,
        decimal: w.decimal,
        primaryKey: false,
        notNull: false,
        uniqueKey: false,
        autoIncrement: false,
        description: w.description
      }
    ]);
  };

  const handleUpdateColumn = (index: number, field: keyof ERColumn, value: any) => {
    const next = [...columns];
    next[index] = { ...next[index], [field]: value };
    setColumns(next);
  };

  const handleDeleteColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === columns.length - 1)) {
      return;
    }
    const next = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setColumns(next);
  };

  const toggleGroup = (id: string) => {
    setColumnGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleAddIndex = () => {
    setIndexes([
      ...indexes,
      {
        id: `idx_${Date.now()}`,
        name: `IDX_${physicalName}_${indexes.length + 1}`,
        type: 'BTREE',
        nonUnique: true,
        fullText: false,
        columns: columns[0] ? [{ columnId: columns[0].id, order: 'ASC' }] : []
      }
    ]);
  };

  const handleAddUniqueKey = () => {
    setComplexUniqueKeys([
      ...complexUniqueKeys,
      {
        id: `uk_${Date.now()}`,
        name: `UK_${physicalName}_${complexUniqueKeys.length + 1}`,
        columns: []
      }
    ]);
  };

  const handleSave = () => {
    const trimmedPhysical = physicalName.trim();
    if (!trimmedPhysical) {
      setNameError('테이블 영문명(물리명)을 입력해 주세요.');
      return;
    }
    const isDuplicate = diagram.tables.some(
      (t) =>
        t.id !== editingTable.id &&
        t.physicalName.trim().toLowerCase() === trimmedPhysical.toLowerCase()
    );
    if (isDuplicate) {
      setNameError(`이미 존재하는 테이블 영문명입니다: ${trimmedPhysical}`);
      return;
    }

    const updated: ERTable = {
      ...editingTable,
      physicalName: trimmedPhysical,
      logicalName: logicalName.trim() || trimmedPhysical,
      description,
      color,
      constraint: constraint.trim() || undefined,
      primaryKeyName: primaryKeyName.trim() || undefined,
      option: option.trim() || undefined,
      columns,
      columnGroupIds: columnGroupIds.length > 0 ? columnGroupIds : undefined,
      indexes,
      complexUniqueKeys,
      tableProperties: {
        ...(editingTable.tableProperties || {}),
        schema: schema.trim() || undefined,
        tablespaceId: tablespaceId || undefined,
        storageEngine: storageEngine.trim() || undefined
      }
    };
    updateTable(updated);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '940px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ fontSize: '15px', fontWeight: 600 }}>테이블 속성 및 컬럼 편집</div>
          <button
            onClick={closeTableModal}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Table Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                물리명 (Physical Name) *
              </label>
              <input
                className="input-field"
                value={physicalName}
                onChange={(e) => {
                  setPhysicalName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                style={nameError ? { borderColor: '#f38ba8' } : undefined}
                placeholder="예: users, order_items"
              />
              {nameError && (
                <div style={{ fontSize: '11px', color: '#f38ba8', marginTop: '4px' }}>
                  {nameError}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                논리명 (Logical Name)
              </label>
              <input
                className="input-field"
                value={logicalName}
                onChange={(e) => setLogicalName(e.target.value)}
                placeholder="예: 사용자, 주문항목"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                설명 (Description)
              </label>
              <input
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="테이블 설명"
              />
            </div>
          </div>

          {/* Table Color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>
              테이블 색상:
            </span>
            {TABLE_PRESET_COLORS.map((preset) => {
              const isSelected =
                color && color.r === preset.r && color.g === preset.g && color.b === preset.b;
              return (
                <button
                  key={preset.label}
                  type="button"
                  title={preset.label}
                  onClick={() => setColor({ r: preset.r, g: preset.g, b: preset.b })}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
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
                padding: '2px 8px',
                borderRadius: '5px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                fontSize: '11px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <input
                type="color"
                value={rgbToHex(color || { r: 128, g: 128, b: 192 })}
                onChange={(e) => setColor(hexToRgb(e.target.value))}
                style={{ width: '18px', height: '18px', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
              />
              <span>직접 선택</span>
            </label>
            {color && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '11px' }}
                onClick={() => setColor(undefined)}
              >
                기본 색상
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px' }}>
            {([
              { id: 'columns', label: `컬럼 (${columns.length})` },
              { id: 'indexes', label: `인덱스 (${indexes.length})` },
              { id: 'uniqueKeys', label: `복합 유니크 키 (${complexUniqueKeys.length})` },
              { id: 'properties', label: '테이블 속성' }
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Columns */}
          {activeTab === 'columns' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(diagram.dictionary || []).length > 0 && (
                    <select
                      className="input-field"
                      style={{ width: '210px', fontSize: '12px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddFromWord(e.target.value);
                      }}
                    >
                      <option value="">+ 단어 사전에서 컬럼 추가...</option>
                      {diagram.dictionary.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.physicalName} ({w.logicalName}) - {w.type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddColumn}>
                  <Plus size={13} />
                  <span>컬럼 추가</span>
                </button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '6px', width: '28px' }}>순서</th>
                      <th style={{ padding: '6px', width: '32px', textAlign: 'center' }}>PK</th>
                      <th style={{ padding: '6px', width: '32px', textAlign: 'center' }}>NN</th>
                      <th style={{ padding: '6px', width: '32px', textAlign: 'center' }}>UK</th>
                      <th style={{ padding: '6px', width: '32px', textAlign: 'center' }}>AI</th>
                      <th style={{ padding: '6px' }}>물리명</th>
                      <th style={{ padding: '6px' }}>논리명</th>
                      <th style={{ padding: '6px', width: '115px' }}>데이터타입</th>
                      <th style={{ padding: '6px', width: '60px' }}>길이</th>
                      <th style={{ padding: '6px', width: '90px' }}>기본값</th>
                      <th style={{ padding: '6px', width: '32px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col, idx) => (
                      <tr key={col.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button onClick={() => handleMoveColumn(idx, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                              <ArrowUp size={10} />
                            </button>
                            <button onClick={() => handleMoveColumn(idx, 'down')} disabled={idx === columns.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                              <ArrowDown size={10} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={col.primaryKey}
                            onChange={(e) => {
                              const isPk = e.target.checked;
                              handleUpdateColumn(idx, 'primaryKey', isPk);
                              if (isPk) handleUpdateColumn(idx, 'notNull', true);
                            }}
                          />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={col.notNull || col.primaryKey}
                            disabled={col.primaryKey}
                            onChange={(e) => handleUpdateColumn(idx, 'notNull', e.target.checked)}
                          />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={col.uniqueKey}
                            onChange={(e) => handleUpdateColumn(idx, 'uniqueKey', e.target.checked)}
                          />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={col.autoIncrement}
                            onChange={(e) => handleUpdateColumn(idx, 'autoIncrement', e.target.checked)}
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input className="input-field" value={col.physicalName} onChange={(e) => handleUpdateColumn(idx, 'physicalName', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input className="input-field" value={col.logicalName} onChange={(e) => handleUpdateColumn(idx, 'logicalName', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <select
                            className="input-field"
                            value={(col.type || 'varchar').toUpperCase()}
                            onChange={(e) => handleUpdateColumn(idx, 'type', e.target.value.toLowerCase())}
                          >
                            {COMMON_SQL_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            type="number"
                            className="input-field"
                            value={col.length ?? ''}
                            onChange={(e) => handleUpdateColumn(idx, 'length', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="255"
                          />
                        </td>
                        <td style={{ padding: '4px' }}>
                          <input
                            className="input-field"
                            value={col.defaultValue ?? ''}
                            onChange={(e) => handleUpdateColumn(idx, 'defaultValue', e.target.value || undefined)}
                            placeholder="NULL"
                          />
                        </td>
                        <td style={{ padding: '4px', textAlign: 'center' }}>
                          <button onClick={() => handleDeleteColumn(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f38ba8' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(diagram.columnGroups || []).length > 0 && (
                <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>컬럼 그룹 연결</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {diagram.columnGroups.map((g) => (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={columnGroupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                        <span>{g.groupName} ({g.columns.length})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab 2: Indexes */}
          {activeTab === 'indexes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddIndex}>
                  <Plus size={13} />
                  <span>인덱스 추가</span>
                </button>
              </div>
              {indexes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  정의된 인덱스가 없습니다.
                </div>
              )}
              {indexes.map((idx, i) => (
                <div key={idx.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      className="input-field"
                      value={idx.name}
                      onChange={(e) => {
                        const next = [...indexes];
                        next[i] = { ...next[i], name: e.target.value };
                        setIndexes(next);
                      }}
                      placeholder="인덱스명"
                    />
                    <input
                      className="input-field"
                      value={idx.type || ''}
                      onChange={(e) => {
                        const next = [...indexes];
                        next[i] = { ...next[i], type: e.target.value };
                        setIndexes(next);
                      }}
                      placeholder="BTREE"
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={!idx.nonUnique}
                        onChange={(e) => {
                          const next = [...indexes];
                          next[i] = { ...next[i], nonUnique: !e.target.checked };
                          setIndexes(next);
                        }}
                      />
                      UNIQUE
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(idx.fullText)}
                        onChange={(e) => {
                          const next = [...indexes];
                          next[i] = { ...next[i], fullText: e.target.checked };
                          setIndexes(next);
                        }}
                      />
                      FULLTEXT
                    </label>
                    <button
                      onClick={() => setIndexes(indexes.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {columns.map((col) => {
                      const found = idx.columns.find((c) => c.columnId === col.id);
                      return (
                        <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '4px' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(found)}
                            onChange={(e) => {
                              const next = [...indexes];
                              const cols = e.target.checked
                                ? [...next[i].columns, { columnId: col.id, order: 'ASC' as const }]
                                : next[i].columns.filter((c) => c.columnId !== col.id);
                              next[i] = { ...next[i], columns: cols };
                              setIndexes(next);
                            }}
                          />
                          <span>{col.physicalName}</span>
                          {found && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...indexes];
                                next[i] = {
                                  ...next[i],
                                  columns: next[i].columns.map((c) =>
                                    c.columnId === col.id
                                      ? { ...c, order: c.order === 'ASC' ? 'DESC' : 'ASC' }
                                      : c
                                  )
                                };
                                setIndexes(next);
                              }}
                              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px', color: '#89b4fa', fontSize: '10px', padding: '0 4px', cursor: 'pointer' }}
                            >
                              {found.order}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Complex Unique Keys */}
          {activeTab === 'uniqueKeys' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddUniqueKey}>
                  <Plus size={13} />
                  <span>복합 유니크 키 추가</span>
                </button>
              </div>
              {complexUniqueKeys.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  정의된 복합 유니크 키가 없습니다.
                </div>
              )}
              {complexUniqueKeys.map((cuk, i) => (
                <div key={cuk.id} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      className="input-field"
                      value={cuk.name}
                      onChange={(e) => {
                        const next = [...complexUniqueKeys];
                        next[i] = { ...next[i], name: e.target.value };
                        setComplexUniqueKeys(next);
                      }}
                      placeholder="제약조건명"
                    />
                    <button
                      onClick={() => setComplexUniqueKeys(complexUniqueKeys.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {columns.map((col) => (
                      <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', backgroundColor: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={cuk.columns.includes(col.id)}
                          onChange={(e) => {
                            const next = [...complexUniqueKeys];
                            const cols = e.target.checked
                              ? [...next[i].columns, col.id]
                              : next[i].columns.filter((id) => id !== col.id);
                            next[i] = { ...next[i], columns: cols };
                            setComplexUniqueKeys(next);
                          }}
                        />
                        <span>{col.physicalName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Table Properties */}
          {activeTab === 'properties' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>스키마 (Schema)</label>
                <input className="input-field" value={schema} onChange={(e) => setSchema(e.target.value)} placeholder="public" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>테이블스페이스 (Tablespace)</label>
                <select className="input-field" value={tablespaceId} onChange={(e) => setTablespaceId(e.target.value)}>
                  <option value="">(없음)</option>
                  {(diagram.tablespaces || []).map((ts) => (
                    <option key={ts.id} value={ts.id}>{ts.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>PK 제약조건명</label>
                <input className="input-field" value={primaryKeyName} onChange={(e) => setPrimaryKeyName(e.target.value)} placeholder={`PK_${physicalName}`} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>스토리지 엔진 (MySQL)</label>
                <input className="input-field" value={storageEngine} onChange={(e) => setStorageEngine(e.target.value)} placeholder="InnoDB" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>테이블 제약조건 (Constraint)</label>
                <input className="input-field" value={constraint} onChange={(e) => setConstraint(e.target.value)} placeholder="CHECK (...)" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>기타 옵션 (Option)</label>
                <input className="input-field" value={option} onChange={(e) => setOption(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {confirmDelete ? (
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#f38ba8', fontWeight: 600 }}>
                '{editingTable.physicalName}' 테이블을 삭제할까요?
              </span>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => deleteTable(editingTable.id)}
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
              <span>테이블 삭제</span>
            </button>
          )}
          <button className="btn btn-secondary" onClick={closeTableModal}>취소</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={14} />
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
