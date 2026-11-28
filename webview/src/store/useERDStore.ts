import { create } from 'zustand';
import {
  ERDiagram,
  ERTable,
  ERRelation,
  ERNote,
  ERNoteConnection,
  ERView,
  ERCategory,
  ERImage,
  ERModelProperties,
  Word,
  ColumnGroup,
  ERSequence,
  ERTrigger,
  ERTablespace,
  ERTestData,
  ERChangeTracking,
  ERTranslationEntry,
  ERCategorySettings,
  Bendpoint,
  DatabaseType,
  NotationType,
  TableStyle,
  NotationLevel
} from '../types/erm.types.js';

let vscodeApi: any = null;
try {
  vscodeApi = acquireVsCodeApi();
} catch (e) {
  console.log('Running outside VS Code webview');
}

export const vscode = vscodeApi;

export type ActiveTool =
  | 'select'
  | 'pan'
  | 'table'
  | 'view'
  | 'note'
  | 'category'
  | 'image'
  | 'comment_connection'
  | 'relation_1_n'
  | 'relation_1_1'
  | 'relation_n_m'
  | 'relation_self';

export type ModelManagerTab =
  | 'dictionary'
  | 'columnGroups'
  | 'sequences'
  | 'triggers'
  | 'tablespaces'
  | 'modelProperties'
  | 'testData'
  | 'changeTracking'
  | 'translations';

export type AlignMode =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'matchWidth'
  | 'matchHeight';

interface ERDState {
  diagram: ERDiagram;
  fileName: string;
  isDiagramLoaded: boolean;
  selectedTableId: string | null;
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  focusNodeId: string | null;
  selectAllTrigger: number;
  isOutlineOpen: boolean;
  isSearchModalOpen: boolean;
  isEditAllModalOpen: boolean;
  clipboard: { tables: ERTable[]; views: ERView[]; notes: ERNote[] } | null;
  editingTable: ERTable | null;
  isTableModalOpen: boolean;
  editingView: ERView | null;
  isViewModalOpen: boolean;
  editingCategory: ERCategory | null;
  isCategoryModalOpen: boolean;
  isDDLModalOpen: boolean;
  isImportFileModalOpen: boolean;
  isImportDBModalOpen: boolean;
  isExportModalOpen: boolean;
  isPrintPreviewOpen: boolean;
  isModelManagerOpen: boolean;
  modelManagerTab: ModelManagerTab;
  editingRelation: ERRelation | null;
  isRelationModalOpen: boolean;
  edgeRoutingType: 'smoothstep' | 'step' | 'bezier' | 'straight';
  activeTool: ActiveTool;
  relationSourceId: string | null;

  // Actions
  setActiveTool: (tool: ActiveTool) => void;
  setRelationSourceId: (id: string | null) => void;
  setEdgeRoutingType: (type: 'smoothstep' | 'step' | 'bezier' | 'straight') => void;
  initDiagram: (diagram: ERDiagram, fileName: string) => void;
  setViewMode: (mode: 'logical' | 'physical' | 'both') => void;
  setDatabase: (db: DatabaseType) => void;
  setNotation: (notation: NotationType) => void;
  setTableStyle: (style: TableStyle) => void;
  setNotationLevel: (level: NotationLevel) => void;
  setCapital: (capital: boolean) => void;
  setTableHeightSetting: (mode: 'auto' | 'fixed', fixedHeight?: number) => void;
  setTableWidthSetting: (mode: 'auto' | 'fixed', fixedWidth?: number) => void;
  toggleLockEdit: () => void;

  // Tables
  updateTablePosition: (id: string, x: number, y: number) => void;
  updateTableBounds: (id: string, x: number, y: number, width?: number, height?: number) => void;
  addTable: (table?: Partial<ERTable>) => void;
  updateTable: (table: ERTable) => void;
  deleteTable: (id: string) => void;

  // Views
  updateViewPosition: (id: string, x: number, y: number) => void;
  addView: (view?: Partial<ERView>) => void;
  updateView: (view: ERView) => void;
  deleteView: (id: string) => void;

  // Notes & Comment Connections
  updateNotePosition: (id: string, x: number, y: number) => void;
  addNote: (note?: Partial<ERNote>) => void;
  updateNote: (id: string, text: string) => void;
  deleteNote: (id: string) => void;
  addNoteConnection: (sourceId: string, targetId: string) => void;
  deleteNoteConnection: (id: string) => void;

  // Categories
  updateCategoryPosition: (id: string, x: number, y: number) => void;
  updateCategoryBounds: (id: string, x: number, y: number, width: number, height: number) => void;
  addCategory: (category?: Partial<ERCategory>) => void;
  updateCategory: (category: ERCategory) => void;
  deleteCategory: (id: string) => void;

  // Images
  updateImagePosition: (id: string, x: number, y: number) => void;
  addImage: (image: Partial<ERImage> & { data: string }) => void;
  deleteImage: (id: string) => void;

  // Model Properties
  updateModelPropertiesPosition: (x: number, y: number) => void;
  updateModelProperties: (mp: ERModelProperties) => void;

  // Relations
  addRelation: (relation: ERRelation) => void;
  updateRelation: (relation: ERRelation) => void;
  reconnectRelation: (
    oldId: string,
    connection: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }
  ) => void;
  deleteRelation: (id: string) => void;

  // Dictionary, ColumnGroups, Sequences, Triggers, Tablespaces, TestData
  setDictionary: (dictionary: Word[]) => void;
  setColumnGroups: (columnGroups: ColumnGroup[]) => void;
  setSequences: (sequences: ERSequence[]) => void;
  setTriggers: (triggers: ERTrigger[]) => void;
  setTablespaces: (tablespaces: ERTablespace[]) => void;
  setTestDataList: (testDataList: ERTestData[]) => void;
  setChangeTrackingList: (list: ERChangeTracking[]) => void;
  setTranslations: (list: ERTranslationEntry[]) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  requestFocusNode: (id: string | null) => void;
  requestSelectAll: () => void;
  alignNodes: (mode: AlignMode) => void;
  toggleOutline: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  openEditAllModal: () => void;
  closeEditAllModal: () => void;
  updateAllTables: (tables: ERTable[]) => void;
  copySelectedNodes: () => void;
  pasteClipboard: () => void;
  deleteNodesByIds: (ids: string[]) => void;
  updateRelationBendpoints: (id: string, bendpoints: Bendpoint[]) => void;
  setCategorySettings: (partial: Partial<ERCategorySettings>) => void;

  // Modals
  openTableModal: (table: ERTable) => void;
  closeTableModal: () => void;
  openViewModal: (view: ERView) => void;
  closeViewModal: () => void;
  openCategoryModal: (category: ERCategory) => void;
  closeCategoryModal: () => void;
  openRelationModal: (relation: ERRelation) => void;
  closeRelationModal: () => void;
  openDDLModal: () => void;
  closeDDLModal: () => void;
  openImportFileModal: () => void;
  closeImportFileModal: () => void;
  openImportDBModal: () => void;
  closeImportDBModal: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  openPrintPreview: () => void;
  closePrintPreview: () => void;
  openModelManager: (tab?: ModelManagerTab) => void;
  closeModelManager: () => void;
  notifyUpdate: () => void;
}

const initialDiagram: ERDiagram = {
  db: 'PostgreSQL',
  viewMode: 'both',
  zoom: 100,
  x: 0,
  y: 0,
  dictionary: [],
  tables: vscode ? [] : [
    {
      id: '0',
      physicalName: 'users',
      logicalName: '사용자',
      description: '쇼핑몰 고객 계정 정보',
      x: 80,
      y: 120,
      width: 240,
      height: 140,
      columns: [
        {
          id: '0_col_1',
          physicalName: 'id',
          logicalName: '사용자ID',
          type: 'bigint',
          primaryKey: true,
          notNull: true,
          uniqueKey: false,
          autoIncrement: true
        },
        {
          id: '0_col_2',
          physicalName: 'email',
          logicalName: '이메일',
          type: 'varchar',
          length: 255,
          primaryKey: false,
          notNull: true,
          uniqueKey: true,
          autoIncrement: false
        },
        {
          id: '0_col_3',
          physicalName: 'name',
          logicalName: '이름',
          type: 'varchar',
          length: 100,
          primaryKey: false,
          notNull: false,
          uniqueKey: false,
          autoIncrement: false
        }
      ],
      indexes: [],
      complexUniqueKeys: []
    },
    {
      id: '1',
      physicalName: 'orders',
      logicalName: '주문',
      description: '고객 주문 정보',
      x: 420,
      y: 120,
      width: 240,
      height: 140,
      columns: [
        {
          id: '1_col_1',
          physicalName: 'id',
          logicalName: '주문ID',
          type: 'bigint',
          primaryKey: true,
          notNull: true,
          uniqueKey: false,
          autoIncrement: true
        },
        {
          id: '1_col_2',
          physicalName: 'user_id',
          logicalName: '사용자ID',
          type: 'bigint',
          primaryKey: false,
          notNull: true,
          uniqueKey: false,
          autoIncrement: false
        },
        {
          id: '1_col_3',
          physicalName: 'total_price',
          logicalName: '총금액',
          type: 'integer',
          primaryKey: false,
          notNull: true,
          uniqueKey: false,
          autoIncrement: false
        }
      ],
      indexes: [],
      complexUniqueKeys: []
    }
  ],
  views: [],
  notes: vscode ? [] : [
    {
      id: '2',
      text: '쇼핑몰 주문 관리 ERD입니다.\n- 테이블 모서리의 동그란 점을 드래그하여 다른 테이블로 연결해보세요!',
      x: 220,
      y: 320,
      width: 220,
      height: 80,
      connections: []
    }
  ],
  noteConnections: [],
  images: [],
  relations: [],
  categories: [],
  columnGroups: [],
  sequences: [],
  triggers: [],
  tablespaces: [],
  testDataList: []
};

function estimateNodeBounds(node: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  columns?: unknown[];
}) {
  const width = Math.max(node.width || 240, 240);
  const colHeight = Array.isArray(node.columns) ? 56 + node.columns.length * 26 : 120;
  const height = Math.max(node.height || 140, colHeight);
  return { x: node.x, y: node.y, width, height };
}

function fitCategoryToContainedNodes(category: ERCategory, diagram: ERDiagram): ERCategory {
  const ids = category.nodeElementIds || [];
  if (ids.length === 0) return category;

  const idSet = new Set(ids);
  const contained: { x: number; y: number; width: number; height: number }[] = [];
  for (const t of diagram.tables) {
    if (idSet.has(t.id)) contained.push(estimateNodeBounds(t));
  }
  for (const v of diagram.views || []) {
    if (idSet.has(v.id)) contained.push(estimateNodeBounds(v));
  }
  if (contained.length === 0) return category;

  const padX = 24;
  const padTop = 44;
  const padBottom = 24;

  const reqLeft = Math.min(...contained.map((b) => b.x)) - padX;
  const reqTop = Math.min(...contained.map((b) => b.y)) - padTop;
  const reqRight = Math.max(...contained.map((b) => b.x + b.width)) + padX;
  const reqBottom = Math.max(...contained.map((b) => b.y + b.height)) + padBottom;

  const curLeft = category.x;
  const curTop = category.y;
  const curRight = category.x + (category.width || 400);
  const curBottom = category.y + (category.height || 300);

  const nextLeft = Math.min(curLeft, reqLeft);
  const nextTop = Math.min(curTop, reqTop);
  const nextRight = Math.max(curRight, reqRight);
  const nextBottom = Math.max(curBottom, reqBottom);

  return {
    ...category,
    x: Math.round(nextLeft),
    y: Math.round(nextTop),
    width: Math.round(nextRight - nextLeft),
    height: Math.round(nextBottom - nextTop)
  };
}

function fitCategoriesForDiagram(diagram: ERDiagram): ERDiagram {
  const categories = diagram.categories || [];
  if (categories.length === 0) return diagram;
  return {
    ...diagram,
    categories: categories.map((c) => fitCategoryToContainedNodes(c, diagram))
  };
}

function getUniqueTablePhysicalName(tables: ERTable[], preferredName?: string): string {
  const existing = new Set(tables.map((t) => t.physicalName.trim().toLowerCase()));
  if (preferredName && preferredName.trim()) {
    const base = preferredName.trim();
    if (!existing.has(base.toLowerCase())) return base;
    let suffix = 2;
    while (existing.has(`${base}_${suffix}`.toLowerCase())) {
      suffix++;
    }
    return `${base}_${suffix}`;
  }
  let idx = tables.length + 1;
  while (existing.has(`table_${idx}`)) {
    idx++;
  }
  return `table_${idx}`;
}

export const useERDStore = create<ERDState>((set, get) => ({
  diagram: initialDiagram,
  fileName: 'untitled.erm',
  isDiagramLoaded: !vscode,
  selectedTableId: null,
  selectedNodeId: null,
  selectedNodeIds: [],
  focusNodeId: null,
  selectAllTrigger: 0,
  isOutlineOpen: true,
  isSearchModalOpen: false,
  isEditAllModalOpen: false,
  clipboard: null,
  editingTable: null,
  isTableModalOpen: false,
  editingView: null,
  isViewModalOpen: false,
  editingCategory: null,
  isCategoryModalOpen: false,
  isDDLModalOpen: false,
  isImportFileModalOpen: false,
  isImportDBModalOpen: false,
  isExportModalOpen: false,
  isPrintPreviewOpen: false,
  isModelManagerOpen: false,
  modelManagerTab: 'dictionary',
  editingRelation: null,
  isRelationModalOpen: false,
  edgeRoutingType: 'smoothstep',
  activeTool: 'select',
  relationSourceId: null,

  setActiveTool: (activeTool) => set({ activeTool, relationSourceId: null }),
  setRelationSourceId: (relationSourceId) => set({ relationSourceId }),
  setEdgeRoutingType: (edgeRoutingType) => set({ edgeRoutingType }),

  initDiagram: (diagram, fileName) => {
    set({
      diagram: fitCategoriesForDiagram({
        ...diagram,
        views: diagram.views || [],
        notes: diagram.notes || [],
        noteConnections: diagram.noteConnections || [],
        images: diagram.images || [],
        categories: diagram.categories || [],
        columnGroups: diagram.columnGroups || [],
        sequences: diagram.sequences || [],
        triggers: diagram.triggers || [],
        tablespaces: diagram.tablespaces || [],
        testDataList: diagram.testDataList || []
      }),
      fileName,
      isDiagramLoaded: true
    });
  },

  setViewMode: (mode) => {
    set((state) => ({ diagram: { ...state.diagram, viewMode: mode } }));
    get().notifyUpdate();
  },

  setDatabase: (db) => {
    set((state) => ({ diagram: { ...state.diagram, db } }));
    get().notifyUpdate();
  },

  setNotation: (notation) => {
    set((state) => ({ diagram: { ...state.diagram, notation } }));
    get().notifyUpdate();
  },

  setTableStyle: (tableStyle) => {
    set((state) => ({ diagram: { ...state.diagram, tableStyle } }));
    get().notifyUpdate();
  },

  setNotationLevel: (notationLevel) => {
    set((state) => ({ diagram: { ...state.diagram, notationLevel } }));
    get().notifyUpdate();
  },

  setCapital: (capital) => {
    set((state) => ({ diagram: { ...state.diagram, capital } }));
    get().notifyUpdate();
  },

  setTableHeightSetting: (mode, fixedHeight) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        tableHeightMode: mode,
        tableFixedHeight:
          fixedHeight !== undefined
            ? Math.max(80, Math.round(fixedHeight))
            : state.diagram.tableFixedHeight ?? 220
      }
    }));
    get().notifyUpdate();
  },

  setTableWidthSetting: (mode, fixedWidth) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        tableWidthMode: mode,
        tableFixedWidth:
          fixedWidth !== undefined
            ? Math.max(160, Math.round(fixedWidth))
            : state.diagram.tableFixedWidth ?? 240
      }
    }));
    get().notifyUpdate();
  },

  toggleLockEdit: () => {
    set((state) => ({
      diagram: { ...state.diagram, lockEdit: !state.diagram.lockEdit },
      activeTool: 'select',
      relationSourceId: null
    }));
  },

  updateTablePosition: (id, x, y) => {
    set((state) => ({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        tables: state.diagram.tables.map((t) => (t.id === id ? { ...t, x, y } : t))
      })
    }));
    get().notifyUpdate();
  },

  updateTableBounds: (id, x, y, width, height) => {
    set((state) => ({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        tables: state.diagram.tables.map((t) =>
          t.id === id
            ? {
                ...t,
                x,
                y,
                ...(width !== undefined ? { width } : {}),
                ...(height !== undefined ? { height } : {})
              }
            : t
        )
      })
    }));
    get().notifyUpdate();
  },

  addTable: (customTable) => {
    const state = get();
    const newId = String(Date.now());
    const uniquePhysicalName = getUniqueTablePhysicalName(
      state.diagram.tables,
      customTable?.physicalName
    );
    const numMatch = uniquePhysicalName.match(/^table_(\d+)$/);
    const defaultLogical = numMatch ? `테이블_${numMatch[1]}` : `테이블_${state.diagram.tables.length + 1}`;
    const newTable: ERTable = {
      id: newId,
      physicalName: uniquePhysicalName,
      logicalName: customTable?.logicalName || defaultLogical,
      description: '',
      x: customTable?.x ?? 150 + state.diagram.tables.length * 40,
      y: customTable?.y ?? 150 + state.diagram.tables.length * 40,
      width: customTable?.width ?? 220,
      height: customTable?.height,
      columns: [
        {
          id: `${newId}_col_1`,
          physicalName: 'id',
          logicalName: 'ID',
          type: 'bigint',
          primaryKey: true,
          notNull: true,
          uniqueKey: false,
          autoIncrement: true
        }
      ],
      indexes: [],
      complexUniqueKeys: []
    };
    const selCatId = state.diagram.categorySettings?.selectedCategoryId;
    const nextCategories = selCatId
      ? (state.diagram.categories || []).map((c) =>
          c.id === selCatId
            ? { ...c, nodeElementIds: [...(c.nodeElementIds || []), newId] }
            : c
        )
      : state.diagram.categories;
    const nextDiagram = fitCategoriesForDiagram({
      ...state.diagram,
      tables: [...state.diagram.tables, newTable],
      categories: nextCategories
    });
    set({
      diagram: nextDiagram,
      editingTable: newTable,
      isTableModalOpen: true,
      focusNodeId: customTable?.x === undefined ? newId : state.focusNodeId
    });
    get().notifyUpdate();
  },

  updateTable: (table) => {
    set((state) => ({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        tables: state.diagram.tables.map((t) => (t.id === table.id ? table : t))
      }),
      isTableModalOpen: false,
      editingTable: null
    }));
    get().notifyUpdate();
  },

  deleteTable: (id) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        tables: state.diagram.tables.filter((t) => t.id !== id),
        relations: state.diagram.relations.filter(
          (r) => r.sourceTableId !== id && r.targetTableId !== id
        ),
        noteConnections: (state.diagram.noteConnections || []).filter(
          (c) => c.sourceId !== id && c.targetId !== id
        )
      },
      isTableModalOpen: false,
      editingTable: null
    }));
    get().notifyUpdate();
  },

  updateViewPosition: (id, x, y) => {
    set((state) => ({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        views: (state.diagram.views || []).map((v) => (v.id === id ? { ...v, x, y } : v))
      })
    }));
    get().notifyUpdate();
  },

  addView: (customView) => {
    const state = get();
    const newId = `view_${Date.now()}`;
    const count = (state.diagram.views || []).length + 1;
    const newView: ERView = {
      id: newId,
      physicalName: customView?.physicalName || `v_view_${count}`,
      logicalName: customView?.logicalName || `뷰_${count}`,
      description: '',
      sql: customView?.sql || 'SELECT 1',
      x: customView?.x ?? 200 + count * 30,
      y: customView?.y ?? 200 + count * 30,
      width: 220,
      height: 120,
      columns: []
    };
    const selCatId = state.diagram.categorySettings?.selectedCategoryId;
    const nextCategories = selCatId
      ? (state.diagram.categories || []).map((c) =>
          c.id === selCatId
            ? { ...c, nodeElementIds: [...(c.nodeElementIds || []), newId] }
            : c
        )
      : state.diagram.categories;
    set({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        views: [...(state.diagram.views || []), newView],
        categories: nextCategories
      }),
      editingView: newView,
      isViewModalOpen: true,
      focusNodeId: customView?.x === undefined ? newId : state.focusNodeId
    });
    get().notifyUpdate();
  },

  updateView: (view) => {
    set((state) => ({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        views: (state.diagram.views || []).map((v) => (v.id === view.id ? view : v))
      }),
      isViewModalOpen: false,
      editingView: null
    }));
    get().notifyUpdate();
  },

  deleteView: (id) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        views: (state.diagram.views || []).filter((v) => v.id !== id),
        noteConnections: (state.diagram.noteConnections || []).filter(
          (c) => c.sourceId !== id && c.targetId !== id
        )
      },
      isViewModalOpen: false,
      editingView: null
    }));
    get().notifyUpdate();
  },

  updateNotePosition: (id, x, y) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        notes: state.diagram.notes.map((n) => (n.id === id ? { ...n, x, y } : n))
      }
    }));
    get().notifyUpdate();
  },

  addNote: (customNote) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        notes: [
          ...state.diagram.notes,
          {
            id: `note_${Date.now()}`,
            text: customNote?.text || '새 메모를 입력하세요',
            x: customNote?.x ?? 200,
            y: customNote?.y ?? 200,
            width: 180,
            height: 80,
            connections: []
          }
        ]
      }
    }));
    get().notifyUpdate();
  },

  updateNote: (id, text) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        notes: state.diagram.notes.map((n) => (n.id === id ? { ...n, text } : n))
      }
    }));
    get().notifyUpdate();
  },

  deleteNote: (id) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        notes: state.diagram.notes.filter((n) => n.id !== id),
        noteConnections: (state.diagram.noteConnections || []).filter(
          (c) => c.sourceId !== id && c.targetId !== id
        )
      }
    }));
    get().notifyUpdate();
  },

  addNoteConnection: (sourceId, targetId) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        noteConnections: [
          ...(state.diagram.noteConnections || []),
          { id: `cc_${Date.now()}`, sourceId, targetId }
        ]
      }
    }));
    get().notifyUpdate();
  },

  deleteNoteConnection: (id) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        noteConnections: (state.diagram.noteConnections || []).filter((c) => c.id !== id)
      }
    }));
    get().notifyUpdate();
  },

  updateCategoryPosition: (id, x, y) => {
    set((state) => {
      const targetCat = (state.diagram.categories || []).find((c) => c.id === id);
      if (!targetCat) return state;

      const dx = x - targetCat.x;
      const dy = y - targetCat.y;
      const containedIds = new Set(targetCat.nodeElementIds || []);

      const nextTables =
        containedIds.size > 0 && (dx !== 0 || dy !== 0)
          ? state.diagram.tables.map((t) =>
              containedIds.has(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t
            )
          : state.diagram.tables;

      const nextViews =
        containedIds.size > 0 && (dx !== 0 || dy !== 0)
          ? (state.diagram.views || []).map((v) =>
              containedIds.has(v.id) ? { ...v, x: v.x + dx, y: v.y + dy } : v
            )
          : state.diagram.views || [];

      return {
        diagram: fitCategoriesForDiagram({
          ...state.diagram,
          tables: nextTables,
          views: nextViews,
          categories: (state.diagram.categories || []).map((c) =>
            c.id === id ? { ...c, x, y } : c
          )
        })
      };
    });
    get().notifyUpdate();
  },

  updateCategoryBounds: (id, x, y, width, height) => {
    set((state) => ({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        categories: (state.diagram.categories || []).map((c) =>
          c.id === id ? { ...c, x, y, width, height } : c
        )
      })
    }));
    get().notifyUpdate();
  },

  addCategory: (customCat) => {
    const state = get();
    const count = (state.diagram.categories || []).length + 1;
    const newCat: ERCategory = {
      id: `cat_${Date.now()}`,
      name: customCat?.name || `카테고리_${count}`,
      selected: true,
      x: customCat?.x ?? 80,
      y: customCat?.y ?? 80,
      width: customCat?.width ?? 420,
      height: customCat?.height ?? 300,
      color: customCat?.color ?? { r: 137, g: 180, b: 250 },
      nodeElementIds: []
    };
    set({
      diagram: { ...state.diagram, categories: [...(state.diagram.categories || []), newCat] },
      editingCategory: newCat,
      isCategoryModalOpen: true
    });
    get().notifyUpdate();
  },

  updateCategory: (category) => {
    set((state) => ({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        categories: (state.diagram.categories || []).map((c) =>
          c.id === category.id ? category : c
        )
      }),
      isCategoryModalOpen: false,
      editingCategory: null
    }));
    get().notifyUpdate();
  },

  deleteCategory: (id) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        categories: (state.diagram.categories || []).filter((c) => c.id !== id)
      },
      isCategoryModalOpen: false,
      editingCategory: null
    }));
    get().notifyUpdate();
  },

  updateImagePosition: (id, x, y) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        images: (state.diagram.images || []).map((img) =>
          img.id === id ? { ...img, x, y } : img
        )
      }
    }));
    get().notifyUpdate();
  },

  addImage: (img) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        images: [
          ...(state.diagram.images || []),
          {
            id: `img_${Date.now()}`,
            x: img.x ?? 200,
            y: img.y ?? 200,
            width: img.width ?? 200,
            height: img.height ?? 150,
            data: img.data,
            alpha: 255,
            fixAspectRatio: true
          }
        ]
      }
    }));
    get().notifyUpdate();
  },

  deleteImage: (id) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        images: (state.diagram.images || []).filter((img) => img.id !== id),
        noteConnections: (state.diagram.noteConnections || []).filter(
          (c) => c.sourceId !== id && c.targetId !== id
        )
      }
    }));
    get().notifyUpdate();
  },

  updateModelPropertiesPosition: (x, y) => {
    set((state) => {
      if (!state.diagram.modelProperties) return state;
      return {
        diagram: {
          ...state.diagram,
          modelProperties: { ...state.diagram.modelProperties, x, y }
        }
      };
    });
    get().notifyUpdate();
  },

  updateModelProperties: (mp) => {
    set((state) => ({
      diagram: { ...state.diagram, modelProperties: mp }
    }));
    get().notifyUpdate();
  },

  addRelation: (relation) => {
    set((state) => ({
      diagram: { ...state.diagram, relations: [...state.diagram.relations, relation] }
    }));
    get().notifyUpdate();
  },

  updateRelation: (relation) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        relations: state.diagram.relations.map((r) => (r.id === relation.id ? relation : r))
      },
      isRelationModalOpen: false,
      editingRelation: null
    }));
    get().notifyUpdate();
  },

  reconnectRelation: (oldId, connection) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        relations: state.diagram.relations.map((r) =>
          r.id === oldId
            ? {
                ...r,
                sourceTableId: connection.source,
                targetTableId: connection.target,
                sourceHandle: connection.sourceHandle || undefined,
                targetHandle: connection.targetHandle || undefined
              }
            : r
        )
      }
    }));
    get().notifyUpdate();
  },

  deleteRelation: (id) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        relations: state.diagram.relations.filter((r) => r.id !== id)
      },
      isRelationModalOpen: false,
      editingRelation: null
    }));
    get().notifyUpdate();
  },

  setDictionary: (dictionary) => {
    set((state) => ({ diagram: { ...state.diagram, dictionary } }));
    get().notifyUpdate();
  },

  setColumnGroups: (columnGroups) => {
    set((state) => ({ diagram: { ...state.diagram, columnGroups } }));
    get().notifyUpdate();
  },

  setSequences: (sequences) => {
    set((state) => ({ diagram: { ...state.diagram, sequences } }));
    get().notifyUpdate();
  },

  setTriggers: (triggers) => {
    set((state) => ({ diagram: { ...state.diagram, triggers } }));
    get().notifyUpdate();
  },

  setTablespaces: (tablespaces) => {
    set((state) => ({ diagram: { ...state.diagram, tablespaces } }));
    get().notifyUpdate();
  },

  setTestDataList: (testDataList) => {
    set((state) => ({ diagram: { ...state.diagram, testDataList } }));
    get().notifyUpdate();
  },

  setChangeTrackingList: (changeTrackingList) => {
    set((state) => ({ diagram: { ...state.diagram, changeTrackingList } }));
    get().notifyUpdate();
  },

  setTranslations: (translations) => {
    set((state) => ({ diagram: { ...state.diagram, translations } }));
    get().notifyUpdate();
  },

  setSelectedNodeIds: (selectedNodeIds) => set({ selectedNodeIds }),
  requestFocusNode: (focusNodeId) => set({ focusNodeId }),
  requestSelectAll: () => set((state) => ({ selectAllTrigger: state.selectAllTrigger + 1 })),
  toggleOutline: () => set((state) => ({ isOutlineOpen: !state.isOutlineOpen })),
  openSearchModal: () => set({ isSearchModalOpen: true }),
  closeSearchModal: () => set({ isSearchModalOpen: false }),
  openEditAllModal: () => {
    if (get().diagram.lockEdit) return;
    set({ isEditAllModalOpen: true });
  },
  closeEditAllModal: () => set({ isEditAllModalOpen: false }),

  updateAllTables: (tables) => {
    set((state) => ({
      diagram: { ...state.diagram, tables },
      isEditAllModalOpen: false
    }));
    get().notifyUpdate();
  },

  copySelectedNodes: () => {
    const state = get();
    const ids = new Set(state.selectedNodeIds);
    if (ids.size === 0) return;
    const tables = state.diagram.tables.filter((t) => ids.has(t.id));
    const views = (state.diagram.views || []).filter((v) => ids.has(v.id));
    const notes = state.diagram.notes.filter((n) => ids.has(n.id));
    if (tables.length + views.length + notes.length === 0) return;
    set({ clipboard: { tables, views, notes } });
  },

  pasteClipboard: () => {
    const state = get();
    if (state.diagram.lockEdit || !state.clipboard) return;
    const ts = Date.now();
    const accumulatedTables = [...state.diagram.tables];
    const newTables: ERTable[] = state.clipboard.tables.map((t, i) => {
      const newId = `copy_tbl_${ts}_${i}`;
      const uniquePhysicalName = getUniqueTablePhysicalName(accumulatedTables, t.physicalName);
      const copiedTable: ERTable = {
        ...t,
        id: newId,
        physicalName: uniquePhysicalName,
        x: t.x + 40,
        y: t.y + 40,
        columns: t.columns.map((c, ci) => ({ ...c, id: `${newId}_col_${ci}` }))
      };
      accumulatedTables.push(copiedTable);
      return copiedTable;
    });
    const newViews: ERView[] = state.clipboard.views.map((v, i) => ({
      ...v,
      id: `copy_view_${ts}_${i}`,
      physicalName: `${v.physicalName}_copy`,
      x: v.x + 40,
      y: v.y + 40
    }));
    const newNotes: ERNote[] = state.clipboard.notes.map((n, i) => ({
      ...n,
      id: `copy_note_${ts}_${i}`,
      x: n.x + 40,
      y: n.y + 40
    }));
    const selCatId = state.diagram.categorySettings?.selectedCategoryId;
    const pastedNodeIds = [...newTables.map((t) => t.id), ...newViews.map((v) => v.id)];
    const nextCategories = selCatId && pastedNodeIds.length > 0
      ? (state.diagram.categories || []).map((c) =>
          c.id === selCatId
            ? { ...c, nodeElementIds: [...(c.nodeElementIds || []), ...pastedNodeIds] }
            : c
        )
      : state.diagram.categories;
    set({
      diagram: fitCategoriesForDiagram({
        ...state.diagram,
        tables: [...state.diagram.tables, ...newTables],
        views: [...(state.diagram.views || []), ...newViews],
        notes: [...state.diagram.notes, ...newNotes],
        categories: nextCategories
      })
    });
    get().notifyUpdate();
  },

  deleteNodesByIds: (ids) => {
    const state = get();
    if (state.diagram.lockEdit || ids.length === 0) return;
    const idSet = new Set(ids);
    const nextCategories = (state.diagram.categories || [])
      .filter((c) => !idSet.has(c.id))
      .map((c) => ({
        ...c,
        nodeElementIds: (c.nodeElementIds || []).filter((nid) => !idSet.has(nid))
      }));
    set({
      diagram: {
        ...state.diagram,
        tables: state.diagram.tables.filter((t) => !idSet.has(t.id)),
        views: (state.diagram.views || []).filter((v) => !idSet.has(v.id)),
        notes: state.diagram.notes.filter((n) => !idSet.has(n.id)),
        categories: nextCategories,
        images: (state.diagram.images || []).filter((img) => !idSet.has(img.id)),
        relations: state.diagram.relations.filter(
          (r) => !idSet.has(r.sourceTableId) && !idSet.has(r.targetTableId)
        ),
        noteConnections: (state.diagram.noteConnections || []).filter(
          (c) => !idSet.has(c.sourceId) && !idSet.has(c.targetId)
        )
      },
      selectedNodeIds: state.selectedNodeIds.filter((id) => !idSet.has(id))
    });
    get().notifyUpdate();
  },

  updateRelationBendpoints: (id, bendpoints) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        relations: state.diagram.relations.map((r) =>
          r.id === id ? { ...r, bendpoints: bendpoints.length > 0 ? bendpoints : undefined } : r
        )
      }
    }));
    get().notifyUpdate();
  },

  setCategorySettings: (partial) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        categorySettings: {
          freeLayout: state.diagram.categorySettings?.freeLayout ?? false,
          showReferredTables: state.diagram.categorySettings?.showReferredTables ?? false,
          selectedCategoryId: state.diagram.categorySettings?.selectedCategoryId ?? null,
          ...partial
        }
      }
    }));
    get().notifyUpdate();
  },

  alignNodes: (mode) => {
    const state = get();
    if (state.diagram.lockEdit) return;
    const ids = new Set(state.selectedNodeIds);
    if (ids.size < 2) return;

    type Box = { id: string; x: number; y: number; w: number; h: number };
    const boxes: Box[] = [];
    for (const t of state.diagram.tables) {
      if (ids.has(t.id)) boxes.push({ id: t.id, x: t.x, y: t.y, w: t.width || 240, h: t.height || 140 });
    }
    for (const v of state.diagram.views || []) {
      if (ids.has(v.id)) boxes.push({ id: v.id, x: v.x, y: v.y, w: v.width || 220, h: v.height || 120 });
    }
    for (const n of state.diagram.notes) {
      if (ids.has(n.id)) boxes.push({ id: n.id, x: n.x, y: n.y, w: n.width || 180, h: n.height || 80 });
    }
    if (boxes.length < 2) return;

    const minX = Math.min(...boxes.map((b) => b.x));
    const maxRight = Math.max(...boxes.map((b) => b.x + b.w));
    const centerX = (minX + maxRight) / 2;
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxBottom = Math.max(...boxes.map((b) => b.y + b.h));
    const middleY = (minY + maxBottom) / 2;
    const refW = boxes[0].w;
    const refH = boxes[0].h;

    const map = new Map<string, Partial<Box>>();
    for (const b of boxes) {
      if (mode === 'left') map.set(b.id, { x: minX });
      else if (mode === 'center') map.set(b.id, { x: Math.round(centerX - b.w / 2) });
      else if (mode === 'right') map.set(b.id, { x: Math.round(maxRight - b.w) });
      else if (mode === 'top') map.set(b.id, { y: minY });
      else if (mode === 'middle') map.set(b.id, { y: Math.round(middleY - b.h / 2) });
      else if (mode === 'bottom') map.set(b.id, { y: Math.round(maxBottom - b.h) });
      else if (mode === 'matchWidth') map.set(b.id, { w: refW });
      else if (mode === 'matchHeight') map.set(b.id, { h: refH });
    }

    set((s) => ({
      diagram: fitCategoriesForDiagram({
        ...s.diagram,
        tables: s.diagram.tables.map((t) => {
          const u = map.get(t.id);
          return u ? { ...t, x: u.x ?? t.x, y: u.y ?? t.y, width: u.w ?? t.width, height: u.h ?? t.height } : t;
        }),
        views: (s.diagram.views || []).map((v) => {
          const u = map.get(v.id);
          return u ? { ...v, x: u.x ?? v.x, y: u.y ?? v.y, width: u.w ?? v.width, height: u.h ?? v.height } : v;
        }),
        notes: s.diagram.notes.map((n) => {
          const u = map.get(n.id);
          return u ? { ...n, x: u.x ?? n.x, y: u.y ?? n.y, width: u.w ?? n.width, height: u.h ?? n.height } : n;
        })
      })
    }));
    get().notifyUpdate();
  },

  openTableModal: (table) => {
    if (get().diagram.lockEdit) return;
    set({ editingTable: table, isTableModalOpen: true });
  },
  closeTableModal: () => set({ editingTable: null, isTableModalOpen: false }),
  openViewModal: (view) => {
    if (get().diagram.lockEdit) return;
    set({ editingView: view, isViewModalOpen: true });
  },
  closeViewModal: () => set({ editingView: null, isViewModalOpen: false }),
  openCategoryModal: (category) => {
    if (get().diagram.lockEdit) return;
    set({ editingCategory: category, isCategoryModalOpen: true });
  },
  closeCategoryModal: () => set({ editingCategory: null, isCategoryModalOpen: false }),
  openRelationModal: (relation) => {
    if (get().diagram.lockEdit) return;
    set({ editingRelation: relation, isRelationModalOpen: true });
  },
  closeRelationModal: () => set({ editingRelation: null, isRelationModalOpen: false }),
  openDDLModal: () => set({ isDDLModalOpen: true }),
  closeDDLModal: () => set({ isDDLModalOpen: false }),
  openImportFileModal: () => set({ isImportFileModalOpen: true }),
  closeImportFileModal: () => set({ isImportFileModalOpen: false }),
  openImportDBModal: () => set({ isImportDBModalOpen: true }),
  closeImportDBModal: () => set({ isImportDBModalOpen: false }),
  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
  openPrintPreview: () => set({ isPrintPreviewOpen: true }),
  closePrintPreview: () => set({ isPrintPreviewOpen: false }),
  openModelManager: (tab) =>
    set((state) => ({
      isModelManagerOpen: true,
      modelManagerTab: tab || state.modelManagerTab
    })),
  closeModelManager: () => set({ isModelManagerOpen: false }),

  notifyUpdate: () => {
    if (!vscode) return;
    if (notifyUpdateTimer !== null) {
      window.clearTimeout(notifyUpdateTimer);
    }
    pendingDiagramUpdate = true;
    notifyUpdateTimer = window.setTimeout(() => {
      notifyUpdateTimer = null;
      pendingDiagramUpdate = false;
      vscode?.postMessage({
        type: 'update',
        diagram: useERDStore.getState().diagram
      });
    }, 300);
  }
}));

let notifyUpdateTimer: number | null = null;
let pendingDiagramUpdate = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingDiagramUpdate && vscode) {
      if (notifyUpdateTimer !== null) {
        window.clearTimeout(notifyUpdateTimer);
        notifyUpdateTimer = null;
      }
      pendingDiagramUpdate = false;
      vscode.postMessage({
        type: 'update',
        diagram: useERDStore.getState().diagram
      });
    }
  });
}
