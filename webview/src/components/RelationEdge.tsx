import React, { memo, useState } from 'react';
import { EdgeProps, BaseEdge, EdgeLabelRenderer, useInternalNode, useReactFlow } from '@xyflow/react';
import { getFloatingEdgeParams, computeEdgePath } from '../utils/floatingEdge.js';
import { useERDStore } from '../store/useERDStore.js';
import { Bendpoint, ERRelation } from '../types/erm.types.js';

export const RelationEdge: React.FC<EdgeProps> = memo(({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  markerStart,
  markerEnd,
  style,
  label,
  selected,
  data
}) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const edgeRoutingType = useERDStore((state) => state.edgeRoutingType);
  const openRelationModal = useERDStore((state) => state.openRelationModal);
  const updateRelationBendpoints = useERDStore((state) => state.updateRelationBendpoints);
  const lockEdit = useERDStore((state) => Boolean(state.diagram.lockEdit));
  const { screenToFlowPosition } = useReactFlow();

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const edgeIndex = (data?.edgeIndex as number) || 0;
  const totalEdges = (data?.totalEdges as number) || 1;

  const params = getFloatingEdgeParams(
    sourceNode,
    targetNode,
    sourceHandleId,
    targetHandleId,
    edgeIndex,
    totalEdges
  );

  const rel = data?.relation as ERRelation | undefined;
  const bendpoints = (data?.bendpoints as Bendpoint[] | undefined) || rel?.bendpoints || [];

  let [edgePath, labelX, labelY] = computeEdgePath(params, edgeRoutingType);

  if (bendpoints.length > 0) {
    const pts = [
      { x: params.sx, y: params.sy },
      ...bendpoints.map((b) => ({ x: b.x, y: b.y })),
      { x: params.tx, y: params.ty }
    ];
    edgePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const mid = pts[Math.floor(pts.length / 2)];
    labelX = mid.x;
    labelY = mid.y;
  }

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rel) openRelationModal(rel);
  };

  const handleAddBendpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lockEdit) return;
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    updateRelationBendpoints(id, [...bendpoints, { x: Math.round(pos.x), y: Math.round(pos.y) }]);
  };

  const handleBpPointerDown = (idx: number, e: React.PointerEvent) => {
    e.stopPropagation();
    if (lockEdit) return;
    setDraggingIdx(idx);

    const onMove = (me: PointerEvent) => {
      const pos = screenToFlowPosition({ x: me.clientX, y: me.clientY });
      const next = bendpoints.map((bp, i) =>
        i === idx ? { ...bp, x: Math.round(pos.x), y: Math.round(pos.y) } : bp
      );
      updateRelationBendpoints(id, next);
    };
    const onUp = () => {
      setDraggingIdx(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        {label && (
          <div
            onClick={handleLabelClick}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              backgroundColor: '#1e1e2e',
              border: '1px solid #45475a',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              color: '#cdd6f4',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
              zIndex: 10
            }}
            className="nodrag nopan relation-edge-label"
          >
            {label}
          </div>
        )}

        {selected && !lockEdit && (
          <>
            <button
              onClick={handleAddBendpoint}
              title="꺾임점(Bendpoint) 추가"
              className="nodrag nopan"
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + (label ? 22 : 0)}px)`,
                pointerEvents: 'all',
                backgroundColor: '#313244',
                border: '1px solid #89b4fa',
                color: '#89b4fa',
                borderRadius: '999px',
                fontSize: 10,
                padding: '1px 6px',
                cursor: 'pointer',
                zIndex: 11
              }}
            >
              + Bendpoint
            </button>

            {bendpoints.map((bp, idx) => (
              <div
                key={idx}
                onPointerDown={(e) => handleBpPointerDown(idx, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateRelationBendpoints(
                    id,
                    bendpoints.filter((_, i) => i !== idx)
                  );
                }}
                title="드래그: 이동 / 우클릭: 삭제"
                className="nodrag nopan"
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${bp.x}px,${bp.y}px)`,
                  width: draggingIdx === idx ? 14 : 11,
                  height: draggingIdx === idx ? 14 : 11,
                  borderRadius: '50%',
                  backgroundColor: '#f9e2af',
                  border: '2px solid #1e1e2e',
                  pointerEvents: 'all',
                  cursor: 'grab',
                  zIndex: 12
                }}
              />
            ))}
          </>
        )}
      </EdgeLabelRenderer>
    </>
  );
});
