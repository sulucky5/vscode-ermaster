import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ERModelProperties } from '../types/erm.types.js';
import { useERDStore } from '../store/useERDStore.js';
import { FileText } from 'lucide-react';

export const ModelPropertiesNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const mp = data.modelProperties as ERModelProperties;
  const openModelManager = useERDStore((state) => state.openModelManager);

  return (
    <div
      onDoubleClick={() => openModelManager('modelProperties')}
      style={{
        minWidth: mp.width || 220,
        backgroundColor: 'rgba(30, 30, 46, 0.92)',
        border: selected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '11px',
        color: 'var(--text-primary)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          color: '#fab387',
          marginBottom: '6px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '4px'
        }}
      >
        <FileText size={13} />
        <span>모델 속성 (Model Properties)</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {mp.creationDate && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>생성일:</span>
            <span>{mp.creationDate}</span>
          </div>
        )}
        {mp.updatedDate && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>수정일:</span>
            <span>{mp.updatedDate}</span>
          </div>
        )}
        {mp.properties.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
            <span>{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
