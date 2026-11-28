import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { ERTable, ERColumn, ColumnGroup } from '../types/erm.types.js';
import { useERDStore } from '../store/useERDStore.js';
import { Key, Database } from 'lucide-react';

const EMPTY_COLUMN_GROUPS: ColumnGroup[] = [];

export const TableNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const table = data.table as ERTable;
  const viewMode = useERDStore((state) => state.diagram.viewMode);
  const notation = useERDStore((state) => state.diagram.notation || 'IE');
  const tableStyle = useERDStore((state) => state.diagram.tableStyle || 'frame');
  const notationLevel = useERDStore((state) => state.diagram.notationLevel || 'detail');
  const capital = useERDStore((state) => Boolean(state.diagram.capital));
  const columnGroups = useERDStore((state) => state.diagram.columnGroups) || EMPTY_COLUMN_GROUPS;
  const tableHeightMode = useERDStore((state) => state.diagram.tableHeightMode || 'auto');
  const tableFixedHeight = useERDStore((state) => state.diagram.tableFixedHeight ?? 220);
  const tableWidthMode = useERDStore((state) => state.diagram.tableWidthMode || 'auto');
  const lockEdit = useERDStore((state) => Boolean(state.diagram.lockEdit));
  const openTableModal = useERDStore((state) => state.openTableModal);
  const updateTableBounds = useERDStore((state) => state.updateTableBounds);

  const attachedGroups = (table.columnGroupIds || [])
    .map((id) => columnGroups.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const formatPhysical = (name: string) => (capital ? name.toUpperCase() : name);

  const getDisplayName = () => {
    if (viewMode === 'logical') return table.logicalName || formatPhysical(table.physicalName);
    return formatPhysical(table.physicalName);
  };

  const getSubName = () => {
    if (viewMode === 'both' && table.logicalName && table.logicalName !== table.physicalName) {
      return table.logicalName;
    }
    return null;
  };

  const getColDisplayName = (col: ERColumn) => {
    if (viewMode === 'logical') return col.logicalName || formatPhysical(col.physicalName);
    return formatPhysical(col.physicalName);
  };

  const getColSubName = (col: ERColumn) => {
    if (viewMode === 'both' && col.logicalName && col.logicalName !== col.physicalName) {
      return `(${col.logicalName})`;
    }
    return '';
  };

  const formatType = (col: ERColumn) => {
    let t = col.type || 'varchar';
    if (capital) t = t.toUpperCase();
    if (col.length) {
      t += `(${col.length}${col.decimal ? `,${col.decimal}` : ''})`;
    }
    return t;
  };

  const isRelationSource = useERDStore((state) => state.relationSourceId === table.id);

  const isIdentifyingChild =
    notation === 'IDEF1X' && Boolean(data.isIdentifyingChild);

  // Filter columns according to notationLevel
  const filterCols = (cols: ERColumn[]) => {
    if (notationLevel === 'key' || notationLevel === 'name_and_key') {
      return cols.filter((c) => c.primaryKey || c.foreignKey);
    }
    return cols;
  };

  const showBadges = notationLevel !== 'column' && notationLevel !== 'name_and_key';
  const showTypes = notationLevel === 'detail' || notationLevel === 'key';
  const showBody = notationLevel !== 'title';

  const visibleCols = filterCols(table.columns);
  const pkCols = notation === 'IDEF1X' ? visibleCols.filter((c) => c.primaryKey) : visibleCols;
  const nonPkCols = notation === 'IDEF1X' ? visibleCols.filter((c) => !c.primaryKey) : [];

  const customRgb = table.color ? `${table.color.r}, ${table.color.g}, ${table.color.b}` : null;

  // Theme styles
  const themeStyle: React.CSSProperties =
    tableStyle === 'funny'
      ? {
          borderRadius: isIdentifyingChild ? '16px' : '12px',
          borderWidth: '2px',
          boxShadow: customRgb
            ? `0 8px 24px rgba(${customRgb}, 0.25)`
            : '0 8px 24px rgba(203, 166, 247, 0.22)'
        }
      : tableStyle === 'simple'
      ? {
          borderRadius: isIdentifyingChild ? '12px' : '4px',
          boxShadow: 'none'
        }
      : {
          borderRadius: isIdentifyingChild ? '14px' : '8px'
        };

  const headerStyle: React.CSSProperties = customRgb
    ? tableStyle === 'simple'
      ? {
          background: `rgba(${customRgb}, 0.14)`,
          borderBottom: `1px solid rgba(${customRgb}, 0.45)`
        }
      : {
          background: `linear-gradient(135deg, rgba(${customRgb}, 0.36), rgba(${customRgb}, 0.18))`,
          borderBottom: `1px solid rgba(${customRgb}, 0.45)`
        }
    : tableStyle === 'funny'
    ? {
        background: 'linear-gradient(135deg, rgba(137, 180, 250, 0.28), rgba(203, 166, 247, 0.28))'
      }
    : tableStyle === 'simple'
    ? {
        background: 'transparent',
        borderBottom: '1px solid var(--border-color)'
      }
    : {};

  const renderColumnRow = (col: ERColumn, keyPrefix = '') => (
    <div key={`${keyPrefix}${col.id}`} className={`table-node-col ${col.primaryKey ? 'pk' : ''}`}>
      <div className="col-name">
        {showBadges && col.primaryKey && (
          <span className="badge badge-pk" title="Primary Key">
            <Key size={10} style={{ display: 'inline', marginRight: 2 }} />
            PK
          </span>
        )}
        {showBadges && col.notNull && !col.primaryKey && (
          <span className="badge badge-nn" title="Not Null">
            NN
          </span>
        )}
        <span>{getColDisplayName(col)}</span>
        {getColSubName(col) && (
          <span
            style={{
              fontSize: '10px',
              color: '#a6adc8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0
            }}
          >
            {getColSubName(col)}
          </span>
        )}
      </div>
      {showTypes && <span className="col-type">{formatType(col)}</span>}
    </div>
  );

  const hasFixedWidth = tableWidthMode === 'fixed';
  const effectiveFixedHeight =
    tableHeightMode === 'fixed'
      ? Math.max(80, table.height && table.height > 0 ? table.height : tableFixedHeight)
      : undefined;
  const hasFixedHeight = effectiveFixedHeight !== undefined;

  return (
    <div
      className={`table-node ${selected ? 'selected' : ''} ${isRelationSource ? 'relation-source' : ''}`}
      onDoubleClick={() => openTableModal(table)}
      style={{
        width: hasFixedWidth ? '100%' : 'max-content',
        minWidth: hasFixedWidth ? 160 : 220,
        ...(hasFixedHeight
          ? {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          : {}),
        position: 'relative',
        ...themeStyle,
        ...(customRgb && !selected && !isRelationSource
          ? { borderColor: `rgba(${customRgb}, 0.65)` }
          : {}),
        ...(isRelationSource
          ? {
              borderColor: '#cba6f7',
              boxShadow: '0 0 0 3px rgba(203, 166, 247, 0.8), var(--card-shadow)'
            }
          : {})
      }}
    >
      <NodeResizer
        isVisible={Boolean(selected) && !lockEdit}
        minWidth={160}
        minHeight={80}
        color={customRgb ? `rgb(${customRgb})` : '#89b4fa'}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderWidth: 1 }}
        onResizeEnd={(_event, params) => {
          updateTableBounds(
            table.id,
            Math.round(params.x),
            Math.round(params.y),
            hasFixedWidth ? Math.round(params.width) : undefined,
            hasFixedHeight ? Math.round(params.height) : undefined
          );
        }}
      />
      <Handle type="source" position={Position.Top} id="top" className="table-border-handle table-border-handle-top" title="상단 변 연결" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="table-border-handle table-border-handle-bottom" title="하단 변 연결" />
      <Handle type="source" position={Position.Left} id="left" className="table-border-handle table-border-handle-left" title="좌측 변 연결" />
      <Handle type="source" position={Position.Right} id="right" className="table-border-handle table-border-handle-right" title="우측 변 연결" />

      <div className="table-node-header" style={headerStyle}>
        <div className="table-node-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <Database
              size={14}
              style={{ flexShrink: 0 }}
              color={customRgb ? `rgb(${customRgb})` : tableStyle === 'funny' ? '#cba6f7' : '#89b4fa'}
            />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0
              }}
              title={getDisplayName()}
            >
              {getDisplayName()}
            </span>
          </div>
          {getSubName() && (
            <span className="table-node-logical" title={getSubName() || undefined}>
              {getSubName()}
            </span>
          )}
        </div>
      </div>

      {showBody && (
        <div
          className={hasFixedHeight ? 'table-node-columns nowheel' : 'table-node-columns'}
          style={
            hasFixedHeight
              ? { flex: 1, minHeight: 0, overflowY: 'auto' }
              : { overflowY: 'visible' }
          }
        >
          {pkCols.map((col) => renderColumnRow(col))}
          {notation === 'IDEF1X' && pkCols.length > 0 && nonPkCols.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '2px 0' }} />
          )}
          {nonPkCols.map((col) => renderColumnRow(col))}

          {notationLevel === 'detail' &&
            attachedGroups.map((g) =>
              g.columns.map((col) => (
                <div key={`${g.id}_${col.id}`} className="table-node-col" style={{ opacity: 0.85 }}>
                  <div className="col-name">
                    <span
                      className="badge"
                      style={{ backgroundColor: 'rgba(203,166,247,0.2)', color: '#cba6f7' }}
                      title={`컬럼 그룹: ${g.groupName}`}
                    >
                      G
                    </span>
                    <span>{getColDisplayName(col)}</span>
                    {getColSubName(col) && (
                      <span style={{ fontSize: '10px', color: '#a6adc8' }}>{getColSubName(col)}</span>
                    )}
                  </div>
                  {showTypes && <span className="col-type">{formatType(col)}</span>}
                </div>
              ))
            )}
        </div>
      )}

      {showBody && ((table.indexes?.length || 0) > 0 || (table.complexUniqueKeys?.length || 0) > 0) && (
        <div
          style={{
            padding: '4px 10px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '8px',
            fontSize: '10px',
            color: 'var(--text-muted)'
          }}
        >
          {(table.indexes?.length || 0) > 0 && <span>IDX: {table.indexes.length}</span>}
          {(table.complexUniqueKeys?.length || 0) > 0 && (
            <span>UK: {table.complexUniqueKeys.length}</span>
          )}
        </div>
      )}
    </div>
  );
});
