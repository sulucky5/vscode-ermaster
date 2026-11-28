import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ERView } from '../types/erm.types.js';
import { useERDStore } from '../store/useERDStore.js';
import { Eye } from 'lucide-react';

export const ViewNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const view = data.view as ERView;
  const diagram = useERDStore((state) => state.diagram);
  const viewMode = diagram.viewMode;
  const capital = Boolean(diagram.capital);
  const notationLevel = diagram.notationLevel || 'detail';
  const columnGroups = diagram.columnGroups || [];
  const openViewModal = useERDStore((state) => state.openViewModal);

  const fmt = (s: string) => (capital ? s.toUpperCase() : s);
  const displayName =
    viewMode === 'logical'
      ? view.logicalName || fmt(view.physicalName)
      : fmt(view.physicalName);
  const subName =
    viewMode === 'both' && view.logicalName && view.logicalName !== view.physicalName
      ? view.logicalName
      : null;

  const attachedGroups = (view.columnGroupIds || [])
    .map((id) => columnGroups.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <div
      className={`table-node ${selected ? 'selected' : ''}`}
      onDoubleClick={() => openViewModal(view)}
      style={{
        width: view.width || 220,
        position: 'relative',
        borderColor: selected ? '#a6e3a1' : 'rgba(166, 227, 161, 0.5)'
      }}
    >
      <Handle type="source" position={Position.Top} id="top" className="table-border-handle table-border-handle-top" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="table-border-handle table-border-handle-bottom" />
      <Handle type="source" position={Position.Left} id="left" className="table-border-handle table-border-handle-left" />
      <Handle type="source" position={Position.Right} id="right" className="table-border-handle table-border-handle-right" />

      <div
        className="table-node-header"
        style={{ background: 'linear-gradient(135deg, rgba(166, 227, 161, 0.2), rgba(148, 226, 213, 0.15))' }}
      >
        <div className="table-node-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <Eye size={14} color="#a6e3a1" style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0
              }}
              title={displayName}
            >
              {displayName}
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(166, 227, 161, 0.2)',
                color: '#a6e3a1',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              VIEW
            </span>
          </div>
          {subName && (
            <span className="table-node-logical" title={subName}>
              {subName}
            </span>
          )}
        </div>
      </div>

      <div className="table-node-columns">
        {view.columns.map((col) => (
          <div key={col.id} className="table-node-col">
            <div className="col-name">
              <span>{viewMode === 'logical' ? col.logicalName || col.physicalName : col.physicalName}</span>
            </div>
            <div className="col-type">
              {col.type}
              {col.length ? `(${col.length})` : ''}
            </div>
          </div>
        ))}
        {attachedGroups.map((g) =>
          g.columns.map((col) => (
            <div key={`${g.id}_${col.id}`} className="table-node-col" style={{ opacity: 0.85 }}>
              <div className="col-name">
                <span className="badge" style={{ backgroundColor: 'rgba(203,166,247,0.2)', color: '#cba6f7' }}>
                  G
                </span>
                <span>{viewMode === 'logical' ? col.logicalName || col.physicalName : col.physicalName}</span>
              </div>
              <div className="col-type">{col.type}</div>
            </div>
          ))
        )}
        {view.columns.length === 0 && attachedGroups.length === 0 && (
          <div
            style={{
              padding: '8px 10px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {view.sql || 'SELECT ...'}
          </div>
        )}
      </div>
    </div>
  );
});
