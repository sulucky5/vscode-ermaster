import React, { useEffect } from 'react';
import { useERDStore, vscode, AlignMode } from './store/useERDStore.js';
import { useI18n } from './i18n/translations.js';
import {
  DatabaseType,
  NotationType,
  TableStyle,
  NotationLevel
} from './types/erm.types.js';
import { ERDCanvas } from './components/ERDCanvas.js';
import { CategorySheetBar } from './components/CategorySheetBar.js';
import { TableEditModal } from './dialogs/TableEditModal.js';
import { ViewEditModal } from './dialogs/ViewEditModal.js';
import { CategoryEditModal } from './dialogs/CategoryEditModal.js';
import { RelationEditModal } from './dialogs/RelationEditModal.js';
import { DDLModal } from './dialogs/DDLModal.js';
import { ModelManagerModal } from './dialogs/ModelManagerModal.js';
import { ImportFileModal } from './dialogs/ImportFileModal.js';
import { ImportDBModal } from './dialogs/ImportDBModal.js';
import { ExportModal } from './dialogs/ExportModal.js';
import { SearchModal } from './dialogs/SearchModal.js';
import { EditAllAttributesModal } from './dialogs/EditAllAttributesModal.js';
import { PrintPreviewModal } from './dialogs/PrintPreviewModal.js';

export const App: React.FC = () => {
  const { t } = useI18n();
  const initDiagram = useERDStore((state) => state.initDiagram);
  const isDiagramLoaded = useERDStore((state) => state.isDiagramLoaded);
  const diagram = useERDStore((state) => state.diagram);
  const fileName = useERDStore((state) => state.fileName);
  const activeTool = useERDStore((state) => state.activeTool);
  const relationSourceId = useERDStore((state) => state.relationSourceId);
  const edgeRoutingType = useERDStore((state) => state.edgeRoutingType);
  const isOutlineOpen = useERDStore((state) => state.isOutlineOpen);
  const showMiniMap = useERDStore((state) => state.showMiniMap);
  const selectedCount = useERDStore((state) => state.selectedNodeIds.length);
  const lockEdit = Boolean(diagram.lockEdit);

  const openSearchModal = useERDStore((state) => state.openSearchModal);
  const copySelectedNodes = useERDStore((state) => state.copySelectedNodes);
  const pasteClipboard = useERDStore((state) => state.pasteClipboard);

  useEffect(() => {
    // 1. VS Code Extension 메시지 수신
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'init':
          initDiagram(message.diagram, message.fileName || 'diagram.erm');
          break;
        case 'setActiveTool':
          if (message.tool) {
            useERDStore.getState().setActiveTool(message.tool);
          }
          break;
        case 'sidebarAction': {
          const store = useERDStore.getState();
          switch (message.action) {
            case 'setActiveTool':
              if (message.value) store.setActiveTool(message.value);
              break;
            case 'addTable':
              store.addTable();
              break;
            case 'addNote':
              store.addNote();
              break;
            case 'setNotation':
              if (message.value) store.setNotation(message.value as NotationType);
              break;
            case 'setTableStyle':
              if (message.value) store.setTableStyle(message.value as TableStyle);
              break;
            case 'setNotationLevel':
              if (message.value) store.setNotationLevel(message.value as NotationLevel);
              break;
            case 'setCapital':
              store.setCapital(Boolean(message.value));
              break;
            case 'setTableHeightSetting':
              if (message.value && typeof message.value === 'object') {
                const v = message.value as { mode?: 'auto' | 'fixed'; fixedHeight?: number };
                if (v.mode) store.setTableHeightSetting(v.mode, v.fixedHeight);
              }
              break;
            case 'setTableWidthSetting':
              if (message.value && typeof message.value === 'object') {
                const v = message.value as { mode?: 'auto' | 'fixed'; fixedWidth?: number };
                if (v.mode) store.setTableWidthSetting(v.mode, v.fixedWidth);
              }
              break;
            case 'toggleLockEdit':
              store.toggleLockEdit();
              break;
            case 'setDatabase':
              if (message.value) store.setDatabase(message.value as DatabaseType);
              break;
            case 'setViewMode':
              if (message.value) store.setViewMode(message.value);
              break;
            case 'setEdgeRoutingType':
              if (message.value) store.setEdgeRoutingType(message.value);
              break;
            case 'alignNodes':
              if (message.value) store.alignNodes(message.value as AlignMode);
              break;
            case 'openImportFileModal':
              store.openImportFileModal();
              break;
            case 'openImportDBModal':
              store.openImportDBModal();
              break;
            case 'openModelManager':
              store.openModelManager(message.value || 'dictionary');
              break;
            case 'openEditAllModal':
              store.openEditAllModal();
              break;
            case 'openSearchModal':
              store.openSearchModal();
              break;
            case 'toggleOutline':
              store.toggleOutline();
              break;
            case 'setShowMiniMap':
              store.setShowMiniMap(Boolean(message.value));
              break;
            case 'print':
              store.openPrintPreview();
              break;
            case 'openDDLModal':
              store.openDDLModal();
              break;
            case 'openExportModal':
              store.openExportModal();
              break;
            case 'focusNode':
              if (typeof message.value === 'string') {
                store.requestFocusNode(message.value);
              }
              break;
            case 'openTableById': {
              const t = store.diagram.tables.find((item) => item.id === message.value);
              if (t) store.openTableModal(t);
              break;
            }
            case 'openViewById': {
              const v = (store.diagram.views || []).find((item) => item.id === message.value);
              if (v) store.openViewModal(v);
              break;
            }
            case 'openCategoryById': {
              const c = (store.diagram.categories || []).find((item) => item.id === message.value);
              if (c) store.openCategoryModal(c);
              break;
            }
            case 'setCategorySettings':
              if (message.value && typeof message.value === 'object') {
                store.setCategorySettings(message.value);
              }
              break;
          }
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openSearchModal();
      } else if (!isTyping && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        useERDStore.getState().requestSelectAll();
      } else if (!isTyping && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        copySelectedNodes();
      } else if (!isTyping && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        pasteClipboard();
      } else if (!isTyping && (e.key === 'Delete' || e.key === 'Backspace')) {
        const s = useERDStore.getState();
        const isModalOpen =
          s.isTableModalOpen ||
          s.isViewModalOpen ||
          s.isCategoryModalOpen ||
          s.isRelationModalOpen ||
          s.isDDLModalOpen ||
          s.isImportFileModalOpen ||
          s.isImportDBModalOpen ||
          s.isExportModalOpen ||
          s.isPrintPreviewOpen ||
          s.isModelManagerOpen ||
          s.isSearchModalOpen ||
          s.isEditAllModalOpen;
        if (!isModalOpen && s.selectedNodeIds.length > 0) {
          e.preventDefault();
          s.deleteNodesByIds(s.selectedNodeIds);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 2. Webview 준비 완료 통지
    if (vscode) {
      vscode.postMessage({ type: 'ready' });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [initDiagram, openSearchModal, copySelectedNodes, pasteClipboard]);

  useEffect(() => {
    vscode?.postMessage({
      type: 'paletteState',
      fileName,
      activeTool,
      relationSourceId,
      lockEdit,
      db: diagram.db || 'PostgreSQL',
      viewMode: diagram.viewMode || 'both',
      notation: diagram.notation || 'IE',
      tableStyle: diagram.tableStyle || 'frame',
      notationLevel: diagram.notationLevel || 'detail',
      capital: Boolean(diagram.capital),
      edgeRoutingType,
      tableHeightMode: diagram.tableHeightMode || 'auto',
      tableFixedHeight: diagram.tableFixedHeight ?? 220,
      tableWidthMode: diagram.tableWidthMode || 'auto',
      tableFixedWidth: diagram.tableFixedWidth ?? 240,
      isOutlineOpen,
      showMiniMap,
      selectedCount
    });
  }, [
    fileName,
    activeTool,
    relationSourceId,
    lockEdit,
    diagram.db,
    diagram.viewMode,
    diagram.notation,
    diagram.tableStyle,
    diagram.notationLevel,
    diagram.capital,
    diagram.tableHeightMode,
    diagram.tableFixedHeight,
    diagram.tableWidthMode,
    diagram.tableFixedWidth,
    edgeRoutingType,
    isOutlineOpen,
    showMiniMap,
    selectedCount
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      vscode?.postMessage({
        type: 'outlineData',
        tables: diagram.tables.map((t) => ({
          id: t.id,
          physicalName: t.physicalName,
          logicalName: t.logicalName,
          columns: t.columns.map((c) => ({
            id: c.id,
            physicalName: c.physicalName,
            logicalName: c.logicalName,
            primaryKey: c.primaryKey
          }))
        })),
        views: (diagram.views || []).map((v) => ({
          id: v.id,
          physicalName: v.physicalName,
          logicalName: v.logicalName
        })),
        categories: (diagram.categories || []).map((c) => ({
          id: c.id,
          name: c.name
        })),
        categorySettings: diagram.categorySettings,
        notes: (diagram.notes || []).map((n) => ({
          id: n.id,
          text: n.text
        })),
        sequencesCount: (diagram.sequences || []).length,
        triggersCount: (diagram.triggers || []).length,
        tablespacesCount: (diagram.tablespaces || []).length,
        columnGroupsCount: (diagram.columnGroups || []).length
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    diagram.tables,
    diagram.views,
    diagram.categories,
    diagram.categorySettings,
    diagram.notes,
    diagram.sequences,
    diagram.triggers,
    diagram.tablespaces,
    diagram.columnGroups
  ]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {isDiagramLoaded ? (
        <>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <ERDCanvas />
          </div>
          <CategorySheetBar />
        </>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: '13px'
          }}
        >
          {t('loadingDiagram')}
        </div>
      )}
      <TableEditModal />
      <ViewEditModal />
      <CategoryEditModal />
      <RelationEditModal />
      <DDLModal />
      <ModelManagerModal />
      <ImportFileModal />
      <ImportDBModal />
      <ExportModal />
      <SearchModal />
      <EditAllAttributesModal />
      <PrintPreviewModal />
    </div>
  );
};

export default App;
