import { Position, InternalNode, Node, getSmoothStepPath, getBezierPath, getStraightPath } from '@xyflow/react';

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloatingEdgeParams {
  sx: number;
  sy: number;
  sourcePos: Position;
  tx: number;
  ty: number;
  targetPos: Position;
  isSelfLoop?: boolean;
  loopOffset?: number;
}

/**
 * Node 객체로부터 캔버스 상의 절대 위치 및 크기를 추출합니다.
 */
export function getNodeRect(node: InternalNode | Node | null | undefined): RectBounds {
  if (!node) {
    return { x: 0, y: 0, width: 240, height: 140 };
  }
  const pos = (node as InternalNode).internals?.positionAbsolute || node.position || { x: 0, y: 0 };
  const width =
    (node as InternalNode).measured?.width ??
    (node as any).width ??
    (node.data as any)?.table?.width ??
    240;
  const height =
    (node as InternalNode).measured?.height ??
    (node as any).height ??
    140;

  return {
    x: pos.x,
    y: pos.y,
    width: Math.max(width, 60),
    height: Math.max(height, 50)
  };
}

/**
 * 테이블의 4변 중 타겟 방향에 가장 알맞은 변과 그 변 위의 교차 좌표를 계산합니다.
 * 지정된 핸들(top/bottom/left/right)이 있을 경우 해당 변을 따르되, 변 위의 좌표는 타겟 방향에 맞추어 유동적으로 결정됩니다.
 */
export function getFloatingEdgeParams(
  sourceNode: InternalNode | Node | null | undefined,
  targetNode: InternalNode | Node | null | undefined,
  sourceHandle?: string | null,
  targetHandle?: string | null,
  edgeIndex = 0,
  totalEdges = 1
): FloatingEdgeParams {
  const s = getNodeRect(sourceNode);
  const t = getNodeRect(targetNode);

  // 자기 참조(Self-referencing) 관계선 처리: 우측 상단 모서리를 감싸는 루프
  if (sourceNode && targetNode && sourceNode.id === targetNode.id) {
    const loopOffset = 38 + edgeIndex * 20;
    const sx = s.x + s.width;
    const sy = Math.min(s.y + s.height - 14, s.y + 36 + edgeIndex * 16);
    const tx = Math.max(s.x + 14, s.x + s.width - 48 - edgeIndex * 16);
    const ty = s.y;
    return {
      sx,
      sy,
      sourcePos: Position.Right,
      tx,
      ty,
      targetPos: Position.Top,
      isSelfLoop: true,
      loopOffset
    };
  }

  const sCx = s.x + s.width / 2;
  const sCy = s.y + s.height / 2;
  const tCx = t.x + t.width / 2;
  const tCy = t.y + t.height / 2;

  const dx = tCx - sCx;
  const dy = tCy - sCy;

  // 1. Source 연결점 및 방향 결정
  let sourcePos: Position;
  let sx: number;
  let sy: number;

  const pad = 14; // 테이블 모서리 여백

  if (sourceHandle === 'top') {
    sourcePos = Position.Top;
    sx = Math.max(s.x + pad, Math.min(s.x + s.width - pad, tCx));
    sy = s.y;
  } else if (sourceHandle === 'bottom') {
    sourcePos = Position.Bottom;
    sx = Math.max(s.x + pad, Math.min(s.x + s.width - pad, tCx));
    sy = s.y + s.height;
  } else if (sourceHandle === 'left') {
    sourcePos = Position.Left;
    sx = s.x;
    sy = Math.max(s.y + pad, Math.min(s.y + s.height - pad, tCy));
  } else if (sourceHandle === 'right') {
    sourcePos = Position.Right;
    sx = s.x + s.width;
    sy = Math.max(s.y + pad, Math.min(s.y + s.height - pad, tCy));
  } else {
    // 자동 4변 탐색 (Ray-Box 교차)
    const sHw = s.width / 2;
    const sHh = s.height / 2;
    const scaleX = Math.abs(dx) > 1e-4 ? sHw / Math.abs(dx) : Infinity;
    const scaleY = Math.abs(dy) > 1e-4 ? sHh / Math.abs(dy) : Infinity;

    if (scaleX < scaleY) {
      if (dx > 0) {
        sourcePos = Position.Right;
        sx = s.x + s.width;
        sy = Math.max(s.y + pad, Math.min(s.y + s.height - pad, sCy + dy * scaleX));
      } else {
        sourcePos = Position.Left;
        sx = s.x;
        sy = Math.max(s.y + pad, Math.min(s.y + s.height - pad, sCy + dy * scaleX));
      }
    } else {
      if (dy > 0) {
        sourcePos = Position.Bottom;
        sy = s.y + s.height;
        sx = Math.max(s.x + pad, Math.min(s.x + s.width - pad, sCx + dx * scaleY));
      } else {
        sourcePos = Position.Top;
        sy = s.y;
        sx = Math.max(s.x + pad, Math.min(s.x + s.width - pad, sCx + dx * scaleY));
      }
    }
  }

  // 2. Target 연결점 및 방향 결정
  let targetPos: Position;
  let tx: number;
  let ty: number;

  if (targetHandle === 'top') {
    targetPos = Position.Top;
    tx = Math.max(t.x + pad, Math.min(t.x + t.width - pad, sCx));
    ty = t.y;
  } else if (targetHandle === 'bottom') {
    targetPos = Position.Bottom;
    tx = Math.max(t.x + pad, Math.min(t.x + t.width - pad, sCx));
    ty = t.y + t.height;
  } else if (targetHandle === 'left') {
    targetPos = Position.Left;
    tx = t.x;
    ty = Math.max(t.y + pad, Math.min(t.y + t.height - pad, sCy));
  } else if (targetHandle === 'right') {
    targetPos = Position.Right;
    tx = t.x + t.width;
    ty = Math.max(t.y + pad, Math.min(t.y + t.height - pad, sCy));
  } else {
    // 자동 4변 탐색 (Ray-Box 교차 역방향)
    const tHw = t.width / 2;
    const tHh = t.height / 2;
    const scaleXt = Math.abs(dx) > 1e-4 ? tHw / Math.abs(dx) : Infinity;
    const scaleYt = Math.abs(dy) > 1e-4 ? tHh / Math.abs(dy) : Infinity;

    if (scaleXt < scaleYt) {
      if (dx < 0) {
        targetPos = Position.Right;
        tx = t.x + t.width;
        ty = Math.max(t.y + pad, Math.min(t.y + t.height - pad, tCy - dy * scaleXt));
      } else {
        targetPos = Position.Left;
        tx = t.x;
        ty = Math.max(t.y + pad, Math.min(t.y + t.height - pad, tCy - dy * scaleXt));
      }
    } else {
      if (dy < 0) {
        targetPos = Position.Bottom;
        ty = t.y + t.height;
        tx = Math.max(t.x + pad, Math.min(t.x + t.width - pad, tCx - dx * scaleYt));
      } else {
        targetPos = Position.Top;
        ty = t.y;
        tx = Math.max(t.x + pad, Math.min(t.x + t.width - pad, tCx - dx * scaleYt));
      }
    }
  }

  // 3. 복수 관계선(Multi-Edge) 겹침 방지 오프셋 적용
  if (totalEdges > 1) {
    const offset = (edgeIndex - (totalEdges - 1) / 2) * 16;

    if (sourcePos === Position.Left || sourcePos === Position.Right) {
      sy = Math.max(s.y + pad, Math.min(s.y + s.height - pad, sy + offset));
    } else {
      sx = Math.max(s.x + pad, Math.min(s.x + s.width - pad, sx + offset));
    }

    if (targetPos === Position.Left || targetPos === Position.Right) {
      ty = Math.max(t.y + pad, Math.min(t.y + t.height - pad, ty + offset));
    } else {
      tx = Math.max(t.x + pad, Math.min(t.x + t.width - pad, tx + offset));
    }
  }

  return { sx, sy, sourcePos, tx, ty, targetPos };
}

/**
 * 설정된 라우팅 모드에 따라 SVG Path 및 라벨 좌표를 생성합니다.
 */
export function computeEdgePath(
  params: FloatingEdgeParams,
  routingType: 'smoothstep' | 'step' | 'bezier' | 'straight' = 'smoothstep'
): [string, number, number] {
  const { sx, sy, sourcePos, tx, ty, targetPos, isSelfLoop, loopOffset = 38 } = params;

  if (isSelfLoop) {
    const ox = sx + loopOffset;
    const oy = ty - loopOffset;
    if (routingType === 'bezier') {
      const c1x = sx + loopOffset * 1.45;
      const c1y = sy;
      const c2x = tx;
      const c2y = ty - loopOffset * 1.45;
      const path = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
      return [path, (sx + tx) / 2 + loopOffset * 0.55, (sy + ty) / 2 - loopOffset * 0.55];
    }
    if (routingType === 'step' || routingType === 'straight') {
      const path = `M ${sx} ${sy} L ${ox} ${sy} L ${ox} ${oy} L ${tx} ${oy} L ${tx} ${ty}`;
      return [path, ox, oy];
    }
    // smoothstep: 둥근 모서리 직교 루프
    const r = 8;
    const path = [
      `M ${sx} ${sy}`,
      `L ${ox - r} ${sy}`,
      `Q ${ox} ${sy} ${ox} ${sy - r}`,
      `L ${ox} ${oy + r}`,
      `Q ${ox} ${oy} ${ox - r} ${oy}`,
      `L ${tx + r} ${oy}`,
      `Q ${tx} ${oy} ${tx} ${oy + r}`,
      `L ${tx} ${ty}`
    ].join(' ');
    return [path, ox, oy];
  }

  if (routingType === 'step') {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetX: tx,
      targetY: ty,
      targetPosition: targetPos,
      borderRadius: 0
    });
    return [path, lx, ly];
  }

  if (routingType === 'bezier') {
    const [path, lx, ly] = getBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetX: tx,
      targetY: ty,
      targetPosition: targetPos
    });
    return [path, lx, ly];
  }

  if (routingType === 'straight') {
    const [path, lx, ly] = getStraightPath({
      sourceX: sx,
      sourceY: sy,
      targetX: tx,
      targetY: ty
    });
    return [path, lx, ly];
  }

  // 기본값: smoothstep
  const [path, lx, ly] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
    borderRadius: 8
  });
  return [path, lx, ly];
}
