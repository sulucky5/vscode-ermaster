import React, { useState, useEffect } from 'react';
import { useERDStore, vscode } from '../store/useERDStore.js';
import { X, Database, FolderOpen, ArrowRight, Check } from 'lucide-react';

interface DBPreset {
  label: string;
  driverClass: string;
  defaultPort: string;
  buildUrl: (host: string, port: string, db: string) => string;
}

const DB_PRESETS: DBPreset[] = [
  { label: 'PostgreSQL', driverClass: 'org.postgresql.Driver', defaultPort: '5432', buildUrl: (h, p, d) => `jdbc:postgresql://${h}:${p}/${d}` },
  { label: 'MySQL', driverClass: 'com.mysql.cj.jdbc.Driver', defaultPort: '3306', buildUrl: (h, p, d) => `jdbc:mysql://${h}:${p}/${d}` },
  { label: 'Oracle', driverClass: 'oracle.jdbc.OracleDriver', defaultPort: '1521', buildUrl: (h, p, d) => `jdbc:oracle:thin:@${h}:${p}:${d}` },
  { label: 'Tibero', driverClass: 'com.tmax.tibero.jdbc.TbDriver', defaultPort: '8629', buildUrl: (h, p, d) => `jdbc:tibero:thin:@${h}:${p}:${d}` },
  { label: 'CUBRID', driverClass: 'cubrid.jdbc.driver.CUBRIDDriver', defaultPort: '33000', buildUrl: (h, p, d) => `jdbc:cubrid:${h}:${p}:${d}:::` },
  { label: 'SQLServer', driverClass: 'com.microsoft.sqlserver.jdbc.SQLServerDriver', defaultPort: '1433', buildUrl: (h, p, d) => `jdbc:sqlserver://${h}:${p};databaseName=${d}` },
  { label: 'DB2', driverClass: 'com.ibm.db2.jcc.DB2Driver', defaultPort: '50000', buildUrl: (h, p, d) => `jdbc:db2://${h}:${p}/${d}` },
  { label: 'H2', driverClass: 'org.h2.Driver', defaultPort: '9092', buildUrl: (h, _p, d) => `jdbc:h2:tcp://${h}/${d}` },
  { label: 'SQLite', driverClass: 'org.sqlite.JDBC', defaultPort: '', buildUrl: (_h, _p, d) => `jdbc:sqlite:${d}` }
];

export const ImportDBModal: React.FC = () => {
  const isOpen = useERDStore((state) => state.isImportDBModalOpen);
  const closeModal = useERDStore((state) => state.closeImportDBModal);
  const currentDiagram = useERDStore((state) => state.diagram);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dbSystem, setDbSystem] = useState('PostgreSQL');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('postgres');
  const [driverClass, setDriverClass] = useState('org.postgresql.Driver');
  const [url, setUrl] = useState('jdbc:postgresql://localhost:5432/postgres');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [jarPaths, setJarPaths] = useState<string[]>([]);

  const [schemas, setSchemas] = useState<string[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [views, setViews] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'importDB:jarSelected') {
        setJarPaths(msg.jarPaths || []);
      } else if (msg.type === 'importDB:schemasLoaded') {
        setLoading(false);
        setError('');
        const list: string[] = msg.schemas || [];
        setSchemas(list);
        setSelectedSchemas(list.length > 0 ? [list[0]] : []);
        setStep(2);
      } else if (msg.type === 'importDB:objectsLoaded') {
        setLoading(false);
        setError('');
        setTables(msg.tables || []);
        setViews(msg.views || []);
        setSelectedTables(msg.tables || []);
        setSelectedViews(msg.views || []);
        setStep(3);
      } else if (msg.type === 'importDB:done') {
        setLoading(false);
        setError('');
        setStep(1);
        closeModal();
      } else if (msg.type === 'importDB:error') {
        setLoading(false);
        setError(msg.error || 'JDBC 오류가 발생했습니다.');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [closeModal]);

  if (!isOpen) return null;

  const handlePresetChange = (nextDb: string) => {
    setDbSystem(nextDb);
    const preset = DB_PRESETS.find((p) => p.label === nextDb);
    if (preset) {
      setDriverClass(preset.driverClass);
      setPort(preset.defaultPort);
      setUrl(preset.buildUrl(host, preset.defaultPort, database));
    }
  };

  const configPayload = { dbSystem, driverClass, url, user, password, jarPaths };

  const handleConnectAndFetchSchemas = () => {
    if (!vscode) return;
    setError('');
    setLoading(true);
    vscode.postMessage({ type: 'importDB:listSchemas', config: configPayload });
  };

  const handleFetchObjects = () => {
    if (!vscode) return;
    setError('');
    setLoading(true);
    vscode.postMessage({ type: 'importDB:listObjects', config: configPayload, schemas: selectedSchemas });
  };

  const handleExecuteImport = () => {
    if (!vscode) return;
    setError('');
    setLoading(true);
    vscode.postMessage({
      type: 'importDB:execute',
      config: configPayload,
      schemas: selectedSchemas,
      selectedTables,
      selectedViews,
      currentDiagram
    });
  };

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>
              DB 리버스 엔지니어링 (JDBC) — Step {step}/3
            </span>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(243, 139, 168, 0.15)', color: '#f38ba8', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>DBMS</label>
                  <select className="input-field" value={dbSystem} onChange={(e) => handlePresetChange(e.target.value)}>
                    {DB_PRESETS.map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>JDBC Driver Class</label>
                  <input className="input-field" value={driverClass} onChange={(e) => setDriverClass(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Host</label>
                  <input
                    className="input-field"
                    value={host}
                    onChange={(e) => {
                      const h = e.target.value;
                      setHost(h);
                      const preset = DB_PRESETS.find((p) => p.label === dbSystem);
                      if (preset) setUrl(preset.buildUrl(h, port, database));
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Port</label>
                  <input
                    className="input-field"
                    value={port}
                    onChange={(e) => {
                      const p = e.target.value;
                      setPort(p);
                      const preset = DB_PRESETS.find((x) => x.label === dbSystem);
                      if (preset) setUrl(preset.buildUrl(host, p, database));
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>Database / SID</label>
                  <input
                    className="input-field"
                    value={database}
                    onChange={(e) => {
                      const d = e.target.value;
                      setDatabase(d);
                      const preset = DB_PRESETS.find((x) => x.label === dbSystem);
                      if (preset) setUrl(preset.buildUrl(host, port, d));
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>JDBC URL</label>
                <input className="input-field" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>사용자 (User)</label>
                  <input className="input-field" value={user} onChange={(e) => setUser(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>비밀번호 (Password)</label>
                  <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  JDBC 드라이버 JAR 파일
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => vscode?.postMessage({ type: 'importDB:browseJar' })}
                  >
                    <FolderOpen size={14} />
                    <span>JAR 찾아보기</span>
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {jarPaths.length > 0 ? jarPaths.join(', ') : '드라이버 .jar 파일을 선택하세요'}
                  </span>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                가져올 스키마 선택 ({selectedSchemas.length}/{schemas.length})
              </div>
              {schemas.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  조회된 스키마가 없습니다. 다음 단계로 진행하면 기본 스키마에서 테이블을 조회합니다.
                </div>
              ) : (
                <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {schemas.map((s) => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedSchemas.includes(s)} onChange={() => toggle(selectedSchemas, setSelectedSchemas, s)} />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>테이블 ({selectedTables.length}/{tables.length})</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => setSelectedTables(selectedTables.length === tables.length ? [] : [...tables])}
                  >
                    전체 선택/해제
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {tables.map((t) => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedTables.includes(t)} onChange={() => toggle(selectedTables, setSelectedTables, t)} />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {views.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>뷰 ({selectedViews.length}/{views.length})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {views.map((v) => (
                      <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selectedViews.includes(v)} onChange={() => toggle(selectedViews, setSelectedViews, v)} />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep((step - 1) as 1 | 2)}>이전</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={closeModal}>취소</button>
            {step === 1 && (
              <button className="btn btn-primary" disabled={loading} onClick={handleConnectAndFetchSchemas}>
                <span>{loading ? '연결 중...' : '연결 및 다음'}</span>
                <ArrowRight size={14} />
              </button>
            )}
            {step === 2 && (
              <button className="btn btn-primary" disabled={loading} onClick={handleFetchObjects}>
                <span>{loading ? '조회 중...' : '객체 조회'}</span>
                <ArrowRight size={14} />
              </button>
            )}
            {step === 3 && (
              <button className="btn btn-primary" disabled={loading || (selectedTables.length === 0 && selectedViews.length === 0)} onClick={handleExecuteImport}>
                <Check size={14} />
                <span>{loading ? '가져오는 중...' : '가져오기'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
