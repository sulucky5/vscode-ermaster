import React from 'react';
import { ConnectionLineComponentProps } from '@xyflow/react';
import { getFloatingEdgeParams, computeEdgePath } from '../utils/floatingEdge.js';
import { useERDStore } from '../store/useERDStore.js';

export const FloatingConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromNode,
  fromHandle,
  toX,
  toY,
  toNode,
  toHandle
}) => {
  const edgeRoutingType = useERDStore((state) => state.edgeRoutingType);

  const targetDummyNode = toNode || {
    id: '__cursor__',
    position: { x: toX, y: toY },
    data: {},
    width: 2,
    height: 2
  };

  const params = getFloatingEdgeParams(
    fromNode,
    targetDummyNode as any,
    fromHandle?.id,
    toHandle?.id
  );

  const [edgePath] = computeEdgePath(params, edgeRoutingType);

  return (
    <g>
      <path
        fill="none"
        stroke="#cba6f7"
        strokeWidth={2}
        strokeDasharray="5,5"
        d={edgePath}
      />
      <circle
        cx={params.tx}
        cy={params.ty}
        fill="#cba6f7"
        r={4}
        stroke="#1e1e2e"
        strokeWidth={1.5}
      />
    </g>
  );
};
