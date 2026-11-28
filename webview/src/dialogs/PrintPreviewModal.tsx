import React, { useMemo, useState } from 'react';
import { useERDStore, vscode } from '../store/useERDStore.js';
import { renderDiagramToSvg } from '../utils/diagramToSvg.js';
import { Printer, X, ZoomIn, ZoomOut } from 'lucide-react';

export const PrintPreviewModal: React.FC = () => {
  const isOpen = useERDStore((state) => state.isPrintPreviewOpen);
  const closeModal = useERDStore((state) => state.closePrintPreview);
  const diagram = useERDStore((state) => state.diagram);
  const fileName = useERDStore((state) => state.fileName);

  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
  const [previewScale, setPreviewScale] = useState<number>(1);

  const { svg, width, height } = useMemo(() => {
    if (!isOpen) return { svg: '', width: 800, height: 600 };
    return renderDiagramToSvg(diagram);
  }, [isOpen, diagram]);

  if (!isOpen) return null;

  const sheetDims =
    paperSize === 'A4'
      ? orientation === 'landscape'
        ? { w: 842, h: 595 }
        : { w: 595, h: 842 }
      : orientation === 'landscape'
      ? { w: 1191, h: 842 }
      : { w: 842, h: 1191 };

  const handlePrint = () => {
    if (vscode) {
      vscode.postMessage({
        type: 'printDiagram',
        svgContent: svg,
        orientation,
        paperSize
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ maxWidth: '92vw', width: '1040px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>
              인쇄 미리보기 — {fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={closeModal}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Options Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 20px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>용지:</span>
              <select
                className="input-field"
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as 'A4' | 'A3')}
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </select>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>방향:</span>
              <select
                className="input-field"
                style={{ width: '110px', padding: '4px 8px', fontSize: '12px' }}
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')}
              >
                <option value="landscape">가로 (Landscape)</option>
                <option value="portrait">세로 (Portrait)</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px' }}
              onClick={() => setPreviewScale((s) => Math.max(0.4, Number((s - 0.15).toFixed(2))))}
              title="축소"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '12px', minWidth: '48px', textAlign: 'center' }}>
              {Math.round(previewScale * 100)}%
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px' }}
              onClick={() => setPreviewScale((s) => Math.min(2, Number((s + 0.15).toFixed(2))))}
              title="확대"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => setPreviewScale(1)}
            >
              100%
            </button>
          </div>
        </div>

        {/* Paper Preview Area */}
        <div
          className="modal-body"
          style={{
            backgroundColor: '#11111b',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflow: 'auto',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: Math.round(sheetDims.w * previewScale),
              minHeight: Math.round(sheetDims.h * previewScale),
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
              padding: Math.round(24 * previewScale),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              dangerouslySetInnerHTML={{
                __html: svg.replace(
                  /<svg([^>]*)>/,
                  `<svg$1 style="width: 100%; height: auto; max-height: ${Math.round(
                    (sheetDims.h - 48) * previewScale
                  )}px; display: block;">`
                )
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            원본 다이어그램 크기: {width} × {height}px · {diagram.tables.length}개 테이블
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              닫기
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <Printer size={14} />
              <span>인쇄 / PDF 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
