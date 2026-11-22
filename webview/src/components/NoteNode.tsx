import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ERNote } from '../types/erm.types.js';
import { useERDStore } from '../store/useERDStore.js';
import { StickyNote, Trash2 } from 'lucide-react';

export const NoteNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const note = data.note as ERNote;
  const updateNote = useERDStore((state) => state.updateNote);
  const deleteNote = useERDStore((state) => state.deleteNote);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note.text);

  const handleBlur = () => {
    setIsEditing(false);
    updateNote(note.id, text);
  };

  return (
    <div
      className={`note-node ${selected ? 'selected' : ''}`}
      style={{
        width: note.width || 180,
        minHeight: note.height || 80
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
          <StickyNote size={12} />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>NOTE</span>
        </div>
        {selected && (
          <button
            onClick={() => deleteNote(note.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              padding: '0 2px'
            }}
            title="Delete note"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {isEditing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          style={{
            width: '100%',
            height: '60px',
            background: 'transparent',
            border: '1px solid #ca8a04',
            borderRadius: '4px',
            resize: 'none',
            fontSize: '12px',
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />
      ) : (
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>{note.text}</div>
      )}
    </div>
  );
});
