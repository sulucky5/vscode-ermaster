import React, { useState, useMemo } from 'react';
import { useERDStore, vscode } from '../store/useERDStore.js';
import { generateDDL, DDLOptions } from '../../../src/ddl/ddlGenerator.js';
import { validateDiagram } from '../../../src/ddl/diagramValidator.js';
import { X, Copy, Check, ExternalLink, Database, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DatabaseType } from '../types/erm.types.js';

export const DDLModal: React.FC = () => {
  const isDDLModalOpen = useERDStore((state) => state.isDDLModalOpen);
  const closeDDLModal = useERDStore((state) => state.closeDDLModal);
  const diagram = useERDStore((state) => state.diagram);

  const [selectedDb, setSelectedDb] = useState<DatabaseType>(diagram.db || 'PostgreSQL');
  const [copied, setCopied] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [options, setOptions] = useState<Required<DDLOptions>>({
    dropTables: true,
    createTablespaces: true,
    createSequences: true,
    createTables: true,
    createIndexes: true,
    createViews: true,
    createForeignKeys: true,
    createTriggers: true,
    createComments: true
  });

  const issues = useMemo(
    () => (isDDLModalOpen ? validateDiagram(diagram, selectedDb) : []),
    [isDDLModalOpen, diagram, selectedDb]
  );

  if (!isDDLModalOpen) return null;

  const ddlSql = generateDDL(diagram, selectedDb, options);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(ddlSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInEditor = () => {
    if (vscode) {
      vscode.postMessage({
        type: 'requestDDL',
        diagram,
        targetDb: selectedDb,
        options
      });
    }
  };

  const toggleOpt = (key: keyof DDLOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>DDL SQL 생성 및 모델 검증</span>
          </div>
          <button
            onClick={closeDDLModal}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Target DBMS & Validation Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>타깃 DBMS:</label>
              <select
                value={selectedDb}
                onChange={(e) => setSelectedDb(e.target.value as DatabaseType)}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                {[
                  'PostgreSQL',
                  'MySQL',
                  'Oracle',
                  'SQLServer',
                  'SQLServer2008',
                  'DB2',
                  'SQLite',
                  'H2',
                  'HSQLDB',
                  'MS Access',
                  'StandardSQL',
                  'Tibero',
                  'CUBRID'
                ].map((db) => (
                  <option key={db} value={db}>{db}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '12px' }}
              onClick={() => setShowValidation(!showValidation)}
            >
              {issues.length === 0 ? (
                <CheckCircle2 size={14} color="#a6e3a1" />
              ) : errorCount > 0 ? (
                <AlertCircle size={14} color="#f38ba8" />
              ) : (
                <AlertTriangle size={14} color="#f9e2af" />
              )}
              <span>
                검증: 오류 {errorCount} / 경고 {warningCount}
              </span>
            </button>
          </div>

          {/* DDL Options */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '8px 10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '11px' }}>
            {([
              ['dropTables', 'DROP 문'],
              ['createTablespaces', '테이블스페이스'],
              ['createSequences', '시퀀스'],
              ['createTables', '테이블/복합키'],
              ['createIndexes', '인덱스'],
              ['createViews', '뷰'],
              ['createForeignKeys', '외래키(FK)'],
              ['createTriggers', '트리거'],
              ['createComments', '코멘트']
            ] as [keyof DDLOptions, string][]).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="checkbox" checked={options[key]} onChange={() => toggleOpt(key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* Validation Issues Panel */}
          {showValidation && issues.length > 0 && (
            <div style={{ maxHeight: '130px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', backgroundColor: 'rgba(17, 17, 27, 0.5)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {issues.map((issue, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: issue.severity === 'error' ? '#f38ba8' : '#f9e2af' }}>
                  {issue.severity === 'error' ? <AlertCircle size={12} /> : <AlertTriangle size={12} />}
                  <span style={{ fontWeight: 700 }}>[{issue.category}] {issue.targetName}:</span>
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* DDL Code Viewer */}
          <pre
            style={{
              backgroundColor: '#11111b',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '12px',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              color: '#a6e3a1',
              maxHeight: '320px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}
          >
            {ddlSql}
          </pre>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={14} color="#a6e3a1" /> : <Copy size={14} />}
            <span>{copied ? '복사됨!' : '클립보드 복사'}</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenInEditor}>
            <ExternalLink size={14} />
            <span>VS Code 새 파일로 열기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
