import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ERImage } from '../types/erm.types.js';
import { useERDStore } from '../store/useERDStore.js';
import { Image as ImageIcon, Trash2 } from 'lucide-react';

export const ImageNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const image = data.image as ERImage;
  const deleteImage = useERDStore((state) => state.deleteImage);

  const src = image.data.startsWith('data:')
    ? image.data
    : `data:image/png;base64,${image.data}`;

  return (
    <div
      style={{
        width: image.width || 200,
        height: image.height || 150,
        border: selected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'rgba(30, 30, 46, 0.6)',
        opacity: image.alpha !== undefined ? image.alpha / 255 : 1
      }}
    >
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      {selected && (
        <button
          onClick={() => deleteImage(image.id)}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 10,
            background: 'rgba(17, 17, 27, 0.8)',
            border: '1px solid #f38ba8',
            borderRadius: '4px',
            color: '#f38ba8',
            cursor: 'pointer',
            padding: '3px'
          }}
          title="이미지 삭제"
        >
          <Trash2 size={12} />
        </button>
      )}

      {image.data ? (
        <img
          src={src}
          alt="ERDiagram Image"
          style={{
            width: '100%',
            height: '100%',
            objectFit: image.fixAspectRatio !== false ? 'contain' : 'fill',
            display: 'block'
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '11px',
            gap: '6px'
          }}
        >
          <ImageIcon size={24} />
          <span>No Image Data</span>
        </div>
      )}
    </div>
  );
});
