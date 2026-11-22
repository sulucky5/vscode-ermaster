import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { ERCategory } from '../types/erm.types.js';
import { useERDStore } from '../store/useERDStore.js';
import { Folder } from 'lucide-react';

export const CategoryNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const category = data.category as ERCategory;
  const openCategoryModal = useERDStore((state) => state.openCategoryModal);
  const updateCategoryBounds = useERDStore((state) => state.updateCategoryBounds);
  const lockEdit = useERDStore((state) => Boolean(state.diagram.lockEdit));

  const c = category.color || { r: 137, g: 180, b: 250 };
  const rgb = `${c.r}, ${c.g}, ${c.b}`;

  return (
    <div
      onDoubleClick={() => openCategoryModal(category)}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 160,
        minHeight: 100,
        backgroundColor: `rgba(${rgb}, 0.08)`,
        border: `2px ${selected ? 'solid' : 'dashed'} rgba(${rgb}, ${selected ? 0.9 : 0.45})`,
        borderRadius: '12px',
        pointerEvents: 'all',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <NodeResizer
        isVisible={Boolean(selected) && !lockEdit}
        minWidth={160}
        minHeight={100}
        color={`rgb(${rgb})`}
        handleStyle={{
          width: 9,
          height: 9,
          borderRadius: 2
        }}
        lineStyle={{
          borderWidth: 1
        }}
        onResizeEnd={(_event, params) => {
          updateCategoryBounds(
            category.id,
            Math.round(params.x),
            Math.round(params.y),
            Math.round(params.width),
            Math.round(params.height)
          );
        }}
      />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          backgroundColor: `rgba(${rgb}, 0.22)`,
          borderBottomRightRadius: '8px',
          borderTopLeftRadius: '10px',
          fontSize: '12px',
          fontWeight: 700,
          color: `rgb(${rgb})`,
          cursor: 'pointer'
        }}
      >
        <Folder size={13} />
        <span>{category.name}</span>
        {category.nodeElementIds.length > 0 && (
          <span style={{ fontSize: '10px', opacity: 0.75 }}>({category.nodeElementIds.length})</span>
        )}
      </div>
    </div>
  );
});
