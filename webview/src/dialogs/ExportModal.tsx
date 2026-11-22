import React, { useState, useEffect } from 'react';
import { useERDStore, vscode } from '../store/useERDStore.js';
import { renderDiagramToSvg } from '../utils/diagramToSvg.js';
import { X, Download, FileSpreadsheet, Globe, Coffee, Image as ImageIcon, Database, BookOpen, Languages, TestTube, FolderOpen, Plus, Trash2 } from 'lucide-react';

interface ExcelTemplateItem {
  id: string;
  label: string;
  filePath: string;
  isBuiltin: boolean;
}

export const ExportModal: React.FC = () => {
  const isOpen = useERDStore((state) => state.isExportModalOpen);
  const closeModal = useERDStore((state) => state.closeExportModal);
  const diagram = useERDStore((state) => state.diagram);

  const [templates, setTemplates] = useState<ExcelTemplateItem[]>([
    { id: 'template_ko.xls', label: '한국어 기본 템플릿 (template_ko.xls)', filePath: '', isBuiltin: true }
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('template_ko.xls');
  const [useLogicalSheetName, setUseLogicalSheetName] = useState(true);
  const [includeDiagramImage, setIncludeDiagramImage] = useState(false);

  const [javaPackage, setJavaPackage] = useState('com.example.entity');
  const [useJpa, setUseJpa] = useState(true);
  const [useLombok, setUseLombok] = useState(true);

  const [dbSystem, setDbSystem] = useState(diagram.db || 'PostgreSQL');
  const [driverClass, setDriverClass] = useState('org.postgresql.Driver');
  const [url, setUrl] = useState('jdbc:postgresql://localhost:5432/postgres');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [jarPaths, setJarPaths] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState('');
  const [dbError, setDbError] = useState('');
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      vscode?.postMessage({ type: 'export:getTemplates' });
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'export:templatesLoaded') {
        const list: ExcelTemplateItem[] = msg.templates || [];
        if (list.length > 0) {
          setTemplates(list);
          setSelectedTemplateId((prev) =>
            list.some((t) => t.id === prev) ? prev : msg.defaultTemplateId || list[0].id
          );
        }
      } else if (msg.type === 'export:templateAdded' && msg.templateId) {
        setSelectedTemplateId(msg.templateId);
      } else if (msg.type === 'importDB:jarSelected') {
        setJarPaths(msg.jarPaths || []);
      } else if (msg.type === 'exportDB:done') {
        setDbLoading(false);
        setDbError('');
        setDbStatus(`성공: ${msg.executedCount}개 SQL 문이 DB에 반영되었습니다.`);
      } else if (msg.type === 'exportDB:error') {
        setDbLoading(false);
        setDbStatus('');
        setDbError(msg.error || 'DB 실행 중 오류가 발생했습니다.');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!isOpen) return null;

  const captureDiagramSvg = (): string => {
    return renderDiagramToSvg(diagram).svg;
  };

  const captureDiagramDataUrl = (): Promise<string> =>
    new Promise((resolve) => {
      const { svg, width, height } = renderDiagramToSvg(diagram);
      const img = new window.Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const urlObj = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const scale = Math.min(2, Math.max(1, 1600 / Math.max(1, width)));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
        URL.revokeObjectURL(urlObj);
      };
      img.onerror = () => {
        URL.revokeObjectURL(urlObj);
        resolve('');
      };
      img.src = urlObj;
    });

  const handleExportPng = async () => {
    const dataUrl = await captureDiagramDataUrl();
    if (dataUrl) {
      vscode?.postMessage({ type: 'exportImage', dataUrl });
    }
  };

  const handleExportExcel = async () => {
    const imageDataUrl = includeDiagramImage ? await captureDiagramDataUrl() : undefined;
    vscode?.postMessage({
      type: 'export:excel',
      diagram,
      templateId: selectedTemplateId,
      useLogicalNameAsSheetName: useLogicalSheetName,
      imageDataUrl
    });
  };

  const handleExportDb = () => {
    if (!vscode) return;
    setDbError('');
    setDbStatus('');
    setDbLoading(true);
    vscode.postMessage({
      type: 'export:db',
      diagram,
      config: { dbSystem, driverClass, url, user, password, jarPaths }
    });
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>모델 내보내기 (Export)</span>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Excel Export with Template Selection */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                <FileSpreadsheet size={15} color="#a6e3a1" />
                <span>Excel 명세서 내보내기 (.xls)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  title="선택한 템플릿 파일을 내려받아 수정할 수 있습니다"
                  onClick={() => vscode?.postMessage({ type: 'export:downloadTemplate', templateId: selectedTemplateId })}
                >
                  <Download size={12} />
                  <span>템플릿 다운로드</span>
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => vscode?.postMessage({ type: 'export:addTemplate' })}
                >
                  <Plus size={12} />
                  <span>템플릿 추가 (.xls)</span>
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className="input-field"
                style={{ flex: 1, minWidth: '240px' }}
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              {!templates.find((t) => t.id === selectedTemplateId)?.isBuiltin && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px', color: '#f38ba8' }}
                  title="사용자 템플릿 제거"
                  onClick={() => vscode?.postMessage({ type: 'export:removeTemplate', templateId: selectedTemplateId })}
                >
                  <Trash2 size={13} />
                </button>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={useLogicalSheetName} onChange={(e) => setUseLogicalSheetName(e.target.checked)} />
                <span>시트명에 논리명 사용</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeDiagramImage} onChange={(e) => setIncludeDiagramImage(e.target.checked)} />
                <span>다이어그램 이미지 포함</span>
              </label>
              <button
                className="btn btn-primary"
                onClick={handleExportExcel}
              >
                Excel 내보내기
              </button>
            </div>
          </div>

          {/* Quick Export Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => vscode?.postMessage({ type: 'export:html', diagram })}>
              <Globe size={14} color="#89b4fa" />
              <span>HTML 문서 (.html)</span>
            </button>
            <button className="btn btn-secondary" onClick={handleExportPng}>
              <ImageIcon size={14} color="#f9e2af" />
              <span>이미지 (.png)</span>
            </button>
            <button className="btn btn-secondary" onClick={() => vscode?.postMessage({ type: 'export:svg', svgContent: captureDiagramSvg() })}>
              <ImageIcon size={14} color="#fab387" />
              <span>벡터 이미지 (.svg)</span>
            </button>
            <button className="btn btn-secondary" onClick={() => vscode?.postMessage({ type: 'export:dictionary', diagram })}>
              <BookOpen size={14} color="#cba6f7" />
              <span>단어 사전 (.csv)</span>
            </button>
            <button className="btn btn-secondary" onClick={() => vscode?.postMessage({ type: 'export:translations', diagram })}>
              <Languages size={14} color="#94e2d5" />
              <span>번역 사전 (.csv)</span>
            </button>
            <button className="btn btn-secondary" onClick={() => vscode?.postMessage({ type: 'export:testData', diagram })}>
              <TestTube size={14} color="#f38ba8" />
              <span>테스트 데이터 (.sql)</span>
            </button>
          </div>

          {/* Java Entity Export */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
              <Coffee size={14} color="#fab387" />
              <span>Java 엔티티 소스 생성 (.java)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input
                className="input-field"
                style={{ width: '210px' }}
                value={javaPackage}
                onChange={(e) => setJavaPackage(e.target.value)}
                placeholder="패키지명 (com.example.entity)"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={useJpa} onChange={(e) => setUseJpa(e.target.checked)} />
                <span>JPA (@Entity)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={useLombok} onChange={(e) => setUseLombok(e.target.checked)} />
                <span>Lombok (@Data)</span>
              </label>
              <button
                className="btn btn-primary"
                style={{ marginLeft: 'auto' }}
                onClick={() =>
                  vscode?.postMessage({
                    type: 'export:java',
                    diagram,
                    options: { packageName: javaPackage, useJpa, useLombok }
                  })
                }
              >
                폴더 선택 및 생성
              </button>
            </div>
          </div>

          {/* Export to DB (JDBC) */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
              <Database size={14} color="#89b4fa" />
              <span>DB 직접 반영 (Export to DB via JDBC)</span>
            </div>
            {dbError && <div style={{ fontSize: '12px', color: '#f38ba8' }}>{dbError}</div>}
            {dbStatus && <div style={{ fontSize: '12px', color: '#a6e3a1' }}>{dbStatus}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input className="input-field" value={dbSystem} onChange={(e) => setDbSystem(e.target.value)} placeholder="DBMS (PostgreSQL, MySQL...)" />
              <input className="input-field" value={driverClass} onChange={(e) => setDriverClass(e.target.value)} placeholder="JDBC Driver Class" />
            </div>
            <input className="input-field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="JDBC URL" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input className="input-field" value={user} onChange={(e) => setUser(e.target.value)} placeholder="사용자" />
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => vscode?.postMessage({ type: 'importDB:browseJar' })}>
                  <FolderOpen size={13} />
                  <span>JAR 선택</span>
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {jarPaths.length > 0 ? jarPaths.join(', ') : '드라이버 .jar'}
                </span>
              </div>
              <button className="btn btn-primary" disabled={dbLoading} onClick={handleExportDb}>
                {dbLoading ? '실행 중...' : 'DDL DB 직접 실행'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeModal}>닫기</button>
        </div>
      </div>
    </div>
  );
};
