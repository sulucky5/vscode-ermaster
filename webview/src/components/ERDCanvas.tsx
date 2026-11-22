import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  Plus,
  StickyNote,
  FileUp,
  Server,
  Layers,
  Table,
  Search,
  Code,
  Download,
  Printer
} from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  NodeChange,
  Edge,
  Connection,
  BackgroundVariant,
  ConnectionMode,
  SelectionMode,
  useReactFlow,
  useViewport,
  useNodesState,
  ReactFlowProvider
} from '@xyflow/react';
import { useERDStore } from '../store/useERDStore.js';
import { TableNode } from './TableNode.js';
import { ViewNode } from './ViewNode.js';
import { NoteNode } from './NoteNode.js';
import { CategoryNode } from './CategoryNode.js';
import { ImageNode } from './ImageNode.js';
import { ModelPropertiesNode } from './ModelPropertiesNode.js';
import { RelationEdge } from './RelationEdge.js';
import { FloatingConnectionLine } from './FloatingConnectionLine.js';
import { CrowsFootMarkers } from './CrowsFootMarkers.js';
import {
  ERRelation,
  ERTable,
  ERView,
  ERNote,
  ERCategory,
  ERImage
} from '../types/erm.types.js';

const nodeTypes = {
  tableNode: TableNode,
  viewNode: ViewNode,
  noteNode: NoteNode,
  categoryNode: CategoryNode,
  imageNode: ImageNode,
  modelPropertiesNode: ModelPropertiesNode
};

const edgeTypes = {
  relationEdge: RelationEdge
};

interface CanvasScrollbarsProps {
  nodes: Node[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const CanvasScrollbars: React.FC<CanvasScrollbarsProps> = ({ nodes, containerRef }) => {
  const { x: vx, y: vy, zoom } = useViewport();
  const { setViewport } = useReactFlow();
  const [size, setSize] = React.useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      setSize({ width: el.clientWidth || 800, height: el.clientHeight || 600 });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const viewW = size.width / zoom;
  const viewH = size.height / zoom;
  const viewLeft = -vx / zoom;
  const viewTop = -vy / zoom;
  const viewRight = viewLeft + viewW;
  const viewBottom = viewTop + viewH;

  let minX = 0;
  let minY = 0;
  let maxX = 1200;
  let maxY = 900;

  if (nodes.length > 0) {
    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;
    for (const n of nodes) {
      const w = n.measured?.width ?? (n.style?.width as number) ?? 240;
      const h = n.measured?.height ?? (n.style?.height as number) ?? 140;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
      maxY = Math.max(maxY, n.position.y + h);
    }
  }

  const margin = 400;
  const worldLeft = Math.min(minX - margin, viewLeft);
  const worldTop = Math.min(minY - margin, viewTop);
  const worldRight = Math.max(maxX + margin, viewRight);
  const worldBottom = Math.max(maxY + margin, viewBottom);

  const worldW = Math.max(worldRight - worldLeft, viewW);
  const worldH = Math.max(worldBottom - worldTop, viewH);

  const barThickness = 12;
  const trackW = Math.max(60, size.width - barThickness);
  const trackH = Math.max(60, size.height - barThickness);

  const thumbW = Math.max(28, Math.min(trackW, (viewW / worldW) * trackW));
  const thumbH = Math.max(28, Math.min(trackH, (viewH / worldH) * trackH));

  const maxScrollX = Math.max(1, worldW - viewW);
  const maxScrollY = Math.max(1, worldH - viewH);

  const thumbLeft =
    ((viewLeft - worldLeft) / maxScrollX) * Math.max(0, trackW - thumbW);
  const thumbTop =
    ((viewTop - worldTop) / maxScrollY) * Math.max(0, trackH - thumbH);

  const handleThumbDrag = (axis: 'x' | 'y', e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startClient = axis === 'x' ? e.clientX : e.clientY;
    const startViewPos = axis === 'x' ? viewLeft : viewTop;
    const availTrack = axis === 'x' ? Math.max(1, trackW - thumbW) : Math.max(1, trackH - thumbH);
    const maxWorldScroll = axis === 'x' ? maxScrollX : maxScrollY;

    const onMove = (me: PointerEvent) => {
      const deltaPx = (axis === 'x' ? me.clientX : me.clientY) - startClient;
      const deltaWorld = (deltaPx / availTrack) * maxWorldScroll;
      const nextPos = startViewPos + deltaWorld;
      if (axis === 'x') {
        const clamped = Math.max(worldLeft, Math.min(worldRight - viewW, nextPos));
        setViewport({ x: -clamped * zoom, y: vy, zoom });
      } else {
        const clamped = Math.max(worldTop, Math.min(worldBottom - viewH, nextPos));
        setViewport({ x: vx, y: -clamped * zoom, zoom });
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleTrackClick = (axis: 'x' | 'y', e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (axis === 'x') {
      const clickX = e.clientX - rect.left - thumbW / 2;
      const avail = Math.max(1, trackW - thumbW);
      const ratio = Math.max(0, Math.min(1, clickX / avail));
      const nextLeft = worldLeft + ratio * maxScrollX;
      setViewport({ x: -nextLeft * zoom, y: vy, zoom });
    } else {
      const clickY = e.clientY - rect.top - thumbH / 2;
      const avail = Math.max(1, trackH - thumbH);
      const ratio = Math.max(0, Math.min(1, clickY / avail));
      const nextTop = worldTop + ratio * maxScrollY;
      setViewport({ x: vx, y: -nextTop * zoom, zoom });
    }
  };

  return (
    <>
      {/* Vertical Scrollbar (Right) */}
      <div
        className="no-print erd-scrollbar-track"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handleTrackClick('y', e)}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: barThickness,
          width: barThickness,
          zIndex: 50,
          backgroundColor: 'rgba(24, 24, 37, 0.75)',
          borderLeft: '1px solid rgba(69, 71, 90, 0.6)'
        }}
      >
        <div
          className="erd-scrollbar-thumb"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => handleThumbDrag('y', e)}
          style={{
            position: 'absolute',
            left: 2,
            right: 2,
            top: Math.max(2, Math.min(trackH - thumbH - 2, thumbTop)),
            height: Math.max(24, thumbH - 4),
            borderRadius: 999,
            backgroundColor: 'rgba(166, 173, 200, 0.45)',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Horizontal Scrollbar (Bottom) */}
      <div
        className="no-print erd-scrollbar-track"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handleTrackClick('x', e)}
        style={{
          position: 'absolute',
          left: 0,
          right: barThickness,
          bottom: 0,
          height: barThickness,
          zIndex: 50,
          backgroundColor: 'rgba(24, 24, 37, 0.75)',
          borderTop: '1px solid rgba(69, 71, 90, 0.6)'
        }}
      >
        <div
          className="erd-scrollbar-thumb"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => handleThumbDrag('x', e)}
          style={{
            position: 'absolute',
            top: 2,
            bottom: 2,
            left: Math.max(2, Math.min(trackW - thumbW - 2, thumbLeft)),
            width: Math.max(24, thumbW - 4),
            borderRadius: 999,
            backgroundColor: 'rgba(166, 173, 200, 0.45)',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Bottom-Right Corner */}
      <div
        className="no-print"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: barThickness,
          height: barThickness,
          zIndex: 50,
          backgroundColor: 'rgba(24, 24, 37, 0.85)',
          borderLeft: '1px solid rgba(69, 71, 90, 0.6)',
          borderTop: '1px solid rgba(69, 71, 90, 0.6)'
        }}
      />
    </>
  );
};

const ERDCanvasInner: React.FC = () => {
  const diagram = useERDStore((state) => state.diagram);
  const activeTool = useERDStore((state) => state.activeTool);
  const setActiveTool = useERDStore((state) => state.setActiveTool);
  const relationSourceId = useERDStore((state) => state.relationSourceId);
  const setRelationSourceId = useERDStore((state) => state.setRelationSourceId);

  const updateTablePosition = useERDStore((state) => state.updateTablePosition);
  const updateViewPosition = useERDStore((state) => state.updateViewPosition);
  const updateNotePosition = useERDStore((state) => state.updateNotePosition);
  const updateCategoryPosition = useERDStore((state) => state.updateCategoryPosition);
  const updateImagePosition = useERDStore((state) => state.updateImagePosition);
  const updateModelPropertiesPosition = useERDStore((state) => state.updateModelPropertiesPosition);

  const addTable = useERDStore((state) => state.addTable);
  const addView = useERDStore((state) => state.addView);
  const addNote = useERDStore((state) => state.addNote);
  const addCategory = useERDStore((state) => state.addCategory);
  const addImage = useERDStore((state) => state.addImage);
  const addRelation = useERDStore((state) => state.addRelation);
  const deleteRelation = useERDStore((state) => state.deleteRelation);
  const deleteNodesByIds = useERDStore((state) => state.deleteNodesByIds);
  const addNoteConnection = useERDStore((state) => state.addNoteConnection);
  const deleteNoteConnection = useERDStore((state) => state.deleteNoteConnection);
  const openImportFileModal = useERDStore((state) => state.openImportFileModal);
  const openImportDBModal = useERDStore((state) => state.openImportDBModal);
  const openModelManager = useERDStore((state) => state.openModelManager);
  const openEditAllModal = useERDStore((state) => state.openEditAllModal);
  const openSearchModal = useERDStore((state) => state.openSearchModal);
  const openDDLModal = useERDStore((state) => state.openDDLModal);
  const openExportModal = useERDStore((state) => state.openExportModal);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  const { screenToFlowPosition, setCenter } = useReactFlow();
  const focusNodeId = useERDStore((state) => state.focusNodeId);
  const requestFocusNode = useERDStore((state) => state.requestFocusNode);
  const selectAllTrigger = useERDStore((state) => state.selectAllTrigger);
  const setSelectedNodeIds = useERDStore((state) => state.setSelectedNodeIds);
  const pendingImagePos = useRef<{ x: number; y: number } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const categoryDragRef = useRef<{
    categoryId: string;
    originCatPos: { x: number; y: number };
    childOrigins: Map<string, { x: number; y: number }>;
  } | null>(null);

  useEffect(() => {
    if (!focusNodeId) return;
    const target =
      diagram.tables.find((t) => t.id === focusNodeId) ||
      (diagram.views || []).find((v) => v.id === focusNodeId) ||
      diagram.notes.find((n) => n.id === focusNodeId) ||
      (diagram.categories || []).find((c) => c.id === focusNodeId);
    if (target) {
      setCenter(target.x + 110, target.y + 60, { zoom: 1.1, duration: 300 });
    }
    requestFocusNode(null);
  }, [focusNodeId, diagram, setCenter, requestFocusNode]);

  // Convert Diagram Elements to React Flow Nodes (respecting Category filter & showReferredTables)
  const computedNodes: Node[] = useMemo(() => {
    const selCatId = diagram.categorySettings?.selectedCategoryId;
    const selCat = selCatId ? (diagram.categories || []).find((c) => c.id === selCatId) : undefined;
    let visibleIds: Set<string> | null = null;
    if (selCat) {
      visibleIds = new Set(selCat.nodeElementIds || []);
      if (diagram.categorySettings?.showReferredTables) {
        for (const r of diagram.relations) {
          if (visibleIds.has(r.sourceTableId) || visibleIds.has(r.targetTableId)) {
            visibleIds.add(r.sourceTableId);
            visibleIds.add(r.targetTableId);
          }
        }
      }
    }

    const categoryNodes: Node[] = (diagram.categories || [])
      .filter((c) => !selCat || c.id === selCat.id)
      .map((category: ERCategory) => ({
        id: category.id,
        type: 'categoryNode',
        position: { x: category.x, y: category.y },
        style: {
          width: category.width || 400,
          height: category.height || 300
        },
        data: { category },
        zIndex: -1
      }));

    const tableNodes: Node[] = diagram.tables
      .filter((t) => !visibleIds || visibleIds.has(t.id))
      .map((table: ERTable) => ({
        id: table.id,
        type: 'tableNode',
        position: { x: table.x, y: table.y },
        data: { table }
      }));

    const viewNodes: Node[] = (diagram.views || [])
      .filter((v) => !visibleIds || visibleIds.has(v.id))
      .map((view: ERView) => ({
        id: view.id,
        type: 'viewNode',
        position: { x: view.x, y: view.y },
        data: { view }
      }));

    const noteNodes: Node[] = diagram.notes
      .filter((n) => !visibleIds || visibleIds.has(n.id))
      .map((note: ERNote) => ({
        id: note.id,
        type: 'noteNode',
        position: { x: note.x, y: note.y },
        data: { note }
      }));

    const imageNodes: Node[] = (diagram.images || []).map((image: ERImage) => ({
      id: image.id,
      type: 'imageNode',
      position: { x: image.x, y: image.y },
      data: { image }
    }));

    const mpNodes: Node[] =
      diagram.modelProperties && diagram.modelProperties.display
        ? [
            {
              id: diagram.modelProperties.id || '__model_properties__',
              type: 'modelPropertiesNode',
              position: { x: diagram.modelProperties.x, y: diagram.modelProperties.y },
              data: { modelProperties: diagram.modelProperties }
            }
          ]
        : [];

    return [
      ...categoryNodes,
      ...imageNodes,
      ...tableNodes,
      ...viewNodes,
      ...noteNodes,
      ...mpNodes
    ];
  }, [
    diagram.categories,
    diagram.categorySettings,
    diagram.relations,
    diagram.images,
    diagram.tables,
    diagram.views,
    diagram.notes,
    diagram.modelProperties
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(computedNodes);
  const computedNodesRef = useRef<Node[]>(computedNodes);
  computedNodesRef.current = computedNodes;
  const nodesRef = useRef<Node[]>(nodes);
  nodesRef.current = nodes;
  const activeDragCategoryIdRef = useRef<string | null>(null);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const draggingCatChange = changes.find((c) => {
        if (c.type !== 'position') return false;
        const n = nodesRef.current.find((item) => item.id === c.id);
        return n?.type === 'categoryNode' && (c.dragging || activeDragCategoryIdRef.current === c.id);
      });
      if (draggingCatChange && draggingCatChange.type === 'position') {
        activeDragCategoryIdRef.current = draggingCatChange.dragging ? draggingCatChange.id : null;
        const cat = (diagram.categories || []).find((c) => c.id === draggingCatChange.id);
        const contained = new Set(cat?.nodeElementIds || []);
        const filteredChanges = changes.filter((c) => {
          if (c.type === 'position' && c.id !== draggingCatChange.id && !contained.has(c.id)) {
            return false;
          }
          return true;
        });
        onNodesChange(filteredChanges);
        return;
      }
      onNodesChange(changes);
    },
    [diagram.categories, onNodesChange]
  );

  useEffect(() => {
    setNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return computedNodes.map((n) => {
        const old = prevMap.get(n.id);
        return old
          ? {
              ...n,
              selected: Boolean(old.selected),
              measured: old.measured
            }
          : n;
      });
    });
  }, [computedNodes, setNodes]);

  useEffect(() => {
    if (selectAllTrigger === 0) return;
    setNodes((prev) => prev.map((n) => ({ ...n, selected: true })));
    setSelectedNodeIds(computedNodesRef.current.map((n) => n.id));
  }, [selectAllTrigger, setNodes, setSelectedNodeIds]);

  const openRelationModal = useERDStore((state) => state.openRelationModal);
  const reconnectRelation = useERDStore((state) => state.reconnectRelation);

  // Convert Relations & CommentConnections to React Flow Edges
  const edges: Edge[] = useMemo(() => {
    const pairGroups: Record<string, string[]> = {};
    for (const r of diagram.relations) {
      const key = [r.sourceTableId, r.targetTableId].sort().join(':::');
      if (!pairGroups[key]) pairGroups[key] = [];
      pairGroups[key].push(r.id);
    }

    const relEdges: Edge[] = diagram.relations.map((rel: ERRelation) => {
      const isIdentifying = rel.referenceForPK;
      const childCard = rel.childCardinality || '0..n';
      const parentCard = rel.parentCardinality || '1';
      const isIdef1x = diagram.notation === 'IDEF1X';

      let markerEndId: string | undefined = 'crows-foot-zero-many';
      let markerStartId: string | undefined = parentCard === '0..1' ? 'crows-foot-zero-one' : 'crows-foot-one';

      if (isIdef1x) {
        markerEndId = 'idef1x-dot';
        markerStartId = parentCard === '0..1' ? 'idef1x-diamond' : undefined;
      } else {
        if (childCard === '1') markerEndId = 'crows-foot-one';
        else if (childCard === '0..1') markerEndId = 'crows-foot-zero-one';
        else if (childCard === '1..n') markerEndId = 'crows-foot-one-many';
      }

      const key = [rel.sourceTableId, rel.targetTableId].sort().join(':::');
      const edgeIds = pairGroups[key] || [];
      const edgeIndex = edgeIds.indexOf(rel.id);
      const totalEdges = edgeIds.length;

      return {
        id: rel.id,
        source: rel.sourceTableId,
        target: rel.targetTableId,
        sourceHandle: rel.sourceHandle || undefined,
        targetHandle: rel.targetHandle || undefined,
        reconnectable: true,
        label: rel.name || '',
        type: 'relationEdge',
        markerStart: markerStartId,
        markerEnd: markerEndId,
        data: {
          edgeIndex: edgeIndex >= 0 ? edgeIndex : 0,
          totalEdges
        },
        style: {
          stroke: isIdentifying ? '#f38ba8' : '#89b4fa',
          strokeWidth: isIdentifying ? 2.5 : 2,
          strokeDasharray: isIdentifying ? undefined : '5,5'
        }
      };
    });

    const commentEdges: Edge[] = (diagram.noteConnections || []).map((cc) => ({
      id: cc.id,
      source: cc.sourceId,
      target: cc.targetId,
      type: 'straight',
      style: {
        stroke: '#f9e2af',
        strokeWidth: 1.5,
        strokeDasharray: '4,4'
      }
    }));

    return [...relEdges, ...commentEdges];
  }, [diagram.relations, diagram.noteConnections, diagram.notation]);

  const handleNodeDragStart = useCallback(
    (_event: any, node: Node) => {
      if (node.type !== 'categoryNode') {
        categoryDragRef.current = null;
        return;
      }
      const cat = (diagram.categories || []).find((c) => c.id === node.id);
      const contained = new Set(cat?.nodeElementIds || []);

      // 카테고리 이동 시 카테고리에서 제외된 객체가 함께 선택되어 이동되지 않도록 선택 해제
      setNodes((prev) =>
        prev.map((n) =>
          n.id !== node.id && !contained.has(n.id) && n.selected
            ? { ...n, selected: false }
            : n
        )
      );

      if (contained.size === 0) {
        categoryDragRef.current = null;
        return;
      }
      const childOrigins = new Map<string, { x: number; y: number }>();
      for (const n of nodes) {
        if (contained.has(n.id)) {
          childOrigins.set(n.id, { x: n.position.x, y: n.position.y });
        }
      }
      categoryDragRef.current = {
        categoryId: node.id,
        originCatPos: { x: node.position.x, y: node.position.y },
        childOrigins
      };
    },
    [diagram.categories, nodes, setNodes]
  );

  const handleNodeDrag = useCallback(
    (_event: any, node: Node) => {
      const drag = categoryDragRef.current;
      if (!drag || node.id !== drag.categoryId || drag.childOrigins.size === 0) {
        return;
      }
      const dx = node.position.x - drag.originCatPos.x;
      const dy = node.position.y - drag.originCatPos.y;
      setNodes((prev) =>
        prev.map((n) => {
          const orig = drag.childOrigins.get(n.id);
          return orig ? { ...n, position: { x: orig.x + dx, y: orig.y + dy } } : n;
        })
      );
    },
    [setNodes]
  );

  const handleNodeDragStop = useCallback(
    (_event: any, node: Node, draggedNodes?: Node[]) => {
      categoryDragRef.current = null;
      let targets = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];
      if (node.type === 'categoryNode') {
        const cat = (diagram.categories || []).find((c) => c.id === node.id);
        const contained = new Set(cat?.nodeElementIds || []);
        targets = targets.filter((n) => n.id === node.id || contained.has(n.id));
      }
      const ordered = [
        ...targets.filter((n) => n.type === 'categoryNode'),
        ...targets.filter((n) => n.type !== 'categoryNode')
      ];
      for (const n of ordered) {
        const x = Math.round(n.position.x);
        const y = Math.round(n.position.y);
        if (n.type === 'tableNode') updateTablePosition(n.id, x, y);
        else if (n.type === 'viewNode') updateViewPosition(n.id, x, y);
        else if (n.type === 'noteNode') updateNotePosition(n.id, x, y);
        else if (n.type === 'categoryNode') updateCategoryPosition(n.id, x, y);
        else if (n.type === 'imageNode') updateImagePosition(n.id, x, y);
        else if (n.type === 'modelPropertiesNode') updateModelPropertiesPosition(x, y);
      }
    },
    [
      diagram.categories,
      updateTablePosition,
      updateViewPosition,
      updateNotePosition,
      updateCategoryPosition,
      updateImagePosition,
      updateModelPropertiesPosition
    ]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const newRelation: ERRelation = {
        id: `rel_${Date.now()}`,
        name: '',
        sourceTableId: connection.source,
        targetTableId: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        parentCardinality: '1',
        childCardinality: '0..n',
        referenceForPK: false,
        onDeleteAction: 'RESTRICT',
        onUpdateAction: 'RESTRICT'
      };
      addRelation(newRelation);
    },
    [addRelation]
  );

  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!newConnection.source || !newConnection.target) return;
      if (newConnection.source === newConnection.target) return;

      reconnectRelation(oldEdge.id, {
        source: newConnection.source,
        target: newConnection.target,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle
      });
    },
    [reconnectRelation]
  );

  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (diagram.lockEdit || deletedNodes.length === 0) return;
      deleteNodesByIds(deletedNodes.map((n) => n.id));
    },
    [diagram.lockEdit, deleteNodesByIds]
  );

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      if (diagram.lockEdit) return;
      for (const edge of deletedEdges) {
        if (diagram.relations.some((r) => r.id === edge.id)) {
          deleteRelation(edge.id);
        } else if ((diagram.noteConnections || []).some((c) => c.id === edge.id)) {
          deleteNoteConnection(edge.id);
        }
      }
    },
    [diagram.lockEdit, diagram.relations, diagram.noteConnections, deleteRelation, deleteNoteConnection]
  );

  const handleEdgeClick = useCallback(
    (_event: any, edge: Edge) => {
      const rel = diagram.relations.find((r) => r.id === edge.id);
      if (rel) {
        openRelationModal(rel);
        return;
      }
      const cc = (diagram.noteConnections || []).find((c) => c.id === edge.id);
      if (cc) {
        deleteNoteConnection(cc.id);
      }
    },
    [diagram.relations, diagram.noteConnections, openRelationModal, deleteNoteConnection]
  );

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        addImage({
          x: pendingImagePos.current?.x ?? 200,
          y: pendingImagePos.current?.y ?? 200,
          data: result
        });
      }
      pendingImagePos.current = null;
      setActiveTool('select');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (diagram.lockEdit) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      const x = Math.round(position.x);
      const y = Math.round(position.y);

      if (activeTool === 'table') {
        addTable({ x, y });
        setActiveTool('select');
      } else if (activeTool === 'view') {
        addView({ x, y });
        setActiveTool('select');
      } else if (activeTool === 'note') {
        addNote({ x, y });
        setActiveTool('select');
      } else if (activeTool === 'category') {
        addCategory({ x, y });
        setActiveTool('select');
      } else if (activeTool === 'image') {
        pendingImagePos.current = { x, y };
        imageInputRef.current?.click();
      } else if (activeTool.startsWith('relation') || activeTool === 'comment_connection') {
        setRelationSourceId(null);
      }
    },
    [
      activeTool,
      screenToFlowPosition,
      addTable,
      addView,
      addNote,
      addCategory,
      setActiveTool,
      setRelationSourceId
    ]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (diagram.lockEdit) return;
      if (activeTool === 'comment_connection') {
        if (!relationSourceId) {
          setRelationSourceId(node.id);
        } else {
          if (relationSourceId !== node.id) {
            addNoteConnection(relationSourceId, node.id);
          }
          setRelationSourceId(null);
          setActiveTool('select');
        }
        return;
      }

      if (node.type !== 'tableNode') return;

      if (activeTool.startsWith('relation')) {
        if (!relationSourceId) {
          setRelationSourceId(node.id);
        } else {
          const sourceId = relationSourceId;
          const targetId = node.id;

          let parentCard = '1';
          let childCard = '0..n';

          if (activeTool === 'relation_1_1') {
            childCard = '1';
          } else if (activeTool === 'relation_n_m') {
            parentCard = '0..n';
            childCard = '0..n';
          }

          const newRelation: ERRelation = {
            id: `rel_${Date.now()}`,
            name: '',
            sourceTableId: sourceId,
            targetTableId: targetId,
            parentCardinality: parentCard,
            childCardinality: childCard,
            referenceForPK: false,
            onDeleteAction: 'RESTRICT',
            onUpdateAction: 'RESTRICT'
          };

          addRelation(newRelation);
          setRelationSourceId(null);
          setActiveTool('select');
        }
      }
    },
    [
      activeTool,
      relationSourceId,
      addRelation,
      addNoteConnection,
      setRelationSourceId,
      setActiveTool
    ]
  );

  const isCreationTool =
    activeTool === 'table' ||
    activeTool === 'view' ||
    activeTool === 'note' ||
    activeTool === 'category' ||
    activeTool === 'image';

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const menuW = 220;
      const menuH = 340;
      const x = Math.min(e.clientX, Math.max(8, window.innerWidth - menuW - 8));
      const y = Math.min(e.clientY, Math.max(8, window.innerHeight - menuH - 8));
      setContextMenu({
        x,
        y,
        flowX: Math.round(pos.x),
        flowY: Math.round(pos.y)
      });
    },
    [screenToFlowPosition]
  );

  return (
    <div
      ref={canvasContainerRef}
      onContextMenu={handleContextMenu}
      className={activeTool === 'pan' ? 'erd-pan-mode' : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: activeTool === 'pan' ? 'grab' : isCreationTool ? 'crosshair' : 'default'
      }}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
      <CrowsFootMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={FloatingConnectionLine}
        nodesDraggable={!diagram.lockEdit && activeTool !== 'pan'}
        nodesConnectable={!diagram.lockEdit && activeTool !== 'pan'}
        edgesReconnectable={!diagram.lockEdit && activeTool !== 'pan'}
        panOnDrag={activeTool === 'pan' ? true : [1]}
        selectionOnDrag={activeTool === 'select'}
        selectionMode={SelectionMode.Partial}
        onNodesChange={handleNodesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onReconnect={handleReconnect}
        onEdgeClick={handleEdgeClick}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        deleteKeyCode={['Delete', 'Backspace']}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onSelectionChange={({ nodes: sel }) => setSelectedNodeIds(sel.map((n) => n.id))}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#313244" />
        <Controls position="bottom-right" style={{ marginRight: 20, marginBottom: 20 }} />
        <MiniMap
          position="bottom-left"
          style={{ marginBottom: 20 }}
          nodeColor={(n) => {
            if (n.type === 'tableNode') return '#89b4fa';
            if (n.type === 'viewNode') return '#a6e3a1';
            if (n.type === 'categoryNode') return '#cba6f7';
            return '#fde047';
          }}
          maskColor="rgba(30, 30, 46, 0.7)"
        />
      </ReactFlow>
      <CanvasScrollbars nodes={nodes} containerRef={canvasContainerRef} />

      {contextMenu && (
        <div
          className="no-print"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            width: 220,
            zIndex: 1200,
            backgroundColor: 'var(--vscode-menu-background, #252538)',
            color: 'var(--vscode-menu-foreground, #cdd6f4)',
            border: '1px solid var(--vscode-menu-border, var(--border-color))',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            fontSize: '12px'
          }}
        >
          {[
            {
              label: '새 테이블 추가',
              icon: Plus,
              disabled: Boolean(diagram.lockEdit),
              onClick: () => addTable({ x: contextMenu.flowX, y: contextMenu.flowY })
            },
            {
              label: '새 메모 추가',
              icon: StickyNote,
              disabled: Boolean(diagram.lockEdit),
              onClick: () => addNote({ x: contextMenu.flowX, y: contextMenu.flowY })
            },
            { divider: true as const },
            {
              label: '파일 가져오기 (.erm/.sql)',
              icon: FileUp,
              onClick: () => openImportFileModal()
            },
            {
              label: 'DB 가져오기 (JDBC)',
              icon: Server,
              onClick: () => openImportDBModal()
            },
            { divider: true as const },
            {
              label: '모델 관리',
              icon: Layers,
              onClick: () => openModelManager('dictionary')
            },
            {
              label: '모든 속성 일괄 편집',
              icon: Table,
              disabled: Boolean(diagram.lockEdit),
              onClick: () => openEditAllModal()
            },
            {
              label: '검색 (Ctrl+F)',
              icon: Search,
              onClick: () => openSearchModal()
            },
            { divider: true as const },
            {
              label: 'DDL 미리보기 / 생성',
              icon: Code,
              onClick: () => openDDLModal()
            },
            {
              label: '내보내기 (Export)',
              icon: Download,
              onClick: () => openExportModal()
            },
            {
              label: '인쇄',
              icon: Printer,
              onClick: () => window.print()
            }
          ].map((item, idx) => {
            if ('divider' in item) {
              return (
                <div
                  key={`div-${idx}`}
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--vscode-menu-separatorBackground, var(--border-color))',
                    margin: '4px 2px'
                  }}
                />
              );
            }
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  setContextMenu(null);
                  item.onClick();
                }}
                className="erd-context-menu-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: '5px',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  fontSize: '12px',
                  textAlign: 'left',
                  opacity: item.disabled ? 0.45 : 1,
                  cursor: item.disabled ? 'not-allowed' : 'pointer'
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ERDCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ERDCanvasInner />
    </ReactFlowProvider>
  );
};
