import React, { useEffect, useState } from 'react';
import { vscode } from '../store/useERDStore.js';
import { useI18n } from '../i18n/translations.js';
import {
  Table,
  Eye,
  StickyNote,
  Folder,
  ChevronRight,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';

interface OutlineTable {
  id: string;
  physicalName: string;
  logicalName?: string;
  columns: Array<{
    id: string;
    physicalName: string;
    logicalName?: string;
    primaryKey?: boolean;
  }>;
}

interface OutlineState {
  hasActiveEditor: boolean;
  tables: OutlineTable[];
  views: Array<{ id: string; physicalName: string; logicalName?: string }>;
  categories: Array<{ id: string; name: string }>;
  categorySettings?: {
    selectedCategoryId?: string | null;
    freeLayout?: boolean;
    showReferredTables?: boolean;
  };
  notes: Array<{ id: string; text: string }>;
  sequencesCount: number;
  triggersCount: number;
  tablespacesCount: number;
  columnGroupsCount: number;
}

export const OutlinePanel: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<OutlineState>({
    hasActiveEditor: false,
    tables: [],
    views: [],
    categories: [],
    notes: [],
    sequencesCount: 0,
    triggersCount: 0,
    tablespacesCount: 0,
    columnGroupsCount: 0
  });
  const [sortBy, setSortBy] = useState<'physical' | 'logical'>('physical');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === 'outlineData') {
        setData({
          hasActiveEditor: Boolean(message.hasActiveEditor),
          tables: Array.isArray(message.tables) ? message.tables : [],
          views: Array.isArray(message.views) ? message.views : [],
          categories: Array.isArray(message.categories) ? message.categories : [],
          categorySettings: message.categorySettings,
          notes: Array.isArray(message.notes) ? message.notes : [],
          sequencesCount: typeof message.sequencesCount === 'number' ? message.sequencesCount : 0,
          triggersCount: typeof message.triggersCount === 'number' ? message.triggersCount : 0,
          tablespacesCount: typeof message.tablespacesCount === 'number' ? message.tablespacesCount : 0,
          columnGroupsCount: typeof message.columnGroupsCount === 'number' ? message.columnGroupsCount : 0
        });
      }
    };

    window.addEventListener('message', handleMessage);
    vscode?.postMessage({ type: 'ready' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const sendAction = (action: string, value?: unknown) => {
    if (!data.hasActiveEditor) {
      return;
    }
    vscode?.postMessage({ type: 'sidebarAction', action, value });
  };

  const sortedTables = [...data.tables].sort((a, b) => {
    const ka = sortBy === 'logical' ? a.logicalName || a.physicalName : a.physicalName;
    const kb = sortBy === 'logical' ? b.logicalName || b.physicalName : b.physicalName;
    return ka.localeCompare(kb);
  });

  const sortedViews = [...data.views].sort((a, b) => {
    const ka = sortBy === 'logical' ? a.logicalName || a.physicalName : a.physicalName;
    const kb = sortBy === 'logical' ? b.logicalName || b.physicalName : b.physicalName;
    return ka.localeCompare(kb);
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--vscode-sideBar-background, var(--bg-primary))',
        color: 'var(--vscode-foreground, var(--text-primary))',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '12px',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--vscode-panel-border, var(--border-color))',
          paddingBottom: '6px'
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: '11px',
            color: 'var(--vscode-descriptionForeground, var(--text-muted))',
            letterSpacing: '0.4px'
          }}
        >
          {t('outlineTitle')}
        </span>
        <button
          type="button"
          disabled={!data.hasActiveEditor}
          onClick={() => setSortBy(sortBy === 'physical' ? 'logical' : 'physical')}
          title={t('sortTip')}
          style={{
            background: 'none',
            border: '1px solid var(--vscode-panel-border, var(--border-color))',
            borderRadius: '4px',
            color: 'var(--vscode-descriptionForeground, var(--text-secondary))',
            fontSize: '10px',
            padding: '2px 6px',
            cursor: data.hasActiveEditor ? 'pointer' : 'not-allowed',
            opacity: data.hasActiveEditor ? 1 : 0.45,
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <ArrowUpDown size={10} />
          <span>{sortBy === 'physical' ? t('sortPhysical') : t('sortLogical')}</span>
        </button>
      </div>

      {!data.hasActiveEditor ? (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            lineHeight: 1.45,
            backgroundColor: 'var(--vscode-textBlockQuote-background, rgba(137, 180, 250, 0.08))',
            border: '1px solid var(--vscode-panel-border, var(--border-color))',
            color: 'var(--vscode-descriptionForeground, var(--text-secondary))'
          }}
        >
          {t('outlineEmptyHint')}
        </div>
      ) : (
        <>
          {/* Tables */}
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--vscode-descriptionForeground, #6c7086)',
                marginBottom: '4px'
              }}
            >
              TABLES ({sortedTables.length})
            </div>
            {sortedTables.map((t) => {
              const isExp = Boolean(expandedTables[t.id]);
              return (
                <div key={t.id}>
                  <div
                    onClick={() => sendAction('focusNode', t.id)}
                    onDoubleClick={() => sendAction('openTableById', t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 4px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="클릭: 위치 이동 / 더블클릭: 편집"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTables((p) => ({ ...p, [t.id]: !p[t.id] }));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--vscode-descriptionForeground, var(--text-muted))',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex'
                      }}
                    >
                      {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <Table size={12} color="#89b4fa" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sortBy === 'logical' ? t.logicalName || t.physicalName : t.physicalName}
                    </span>
                  </div>
                  {isExp && (
                    <div
                      style={{
                        paddingLeft: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        marginBottom: '4px'
                      }}
                    >
                      {t.columns.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            fontSize: '11px',
                            color: c.primaryKey
                              ? '#f9e2af'
                              : 'var(--vscode-descriptionForeground, var(--text-secondary))',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {c.primaryKey ? '🔑 ' : '• '}
                          {sortBy === 'logical' ? c.logicalName || c.physicalName : c.physicalName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Views */}
          {sortedViews.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--vscode-descriptionForeground, #6c7086)',
                  marginBottom: '4px'
                }}
              >
                VIEWS ({sortedViews.length})
              </div>
              {sortedViews.map((v) => (
                <div
                  key={v.id}
                  onClick={() => sendAction('focusNode', v.id)}
                  onDoubleClick={() => sendAction('openViewById', v.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 6px', cursor: 'pointer' }}
                  title="클릭: 위치 이동 / 더블클릭: 편집"
                >
                  <Eye size={12} color="#a6e3a1" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sortBy === 'logical' ? v.logicalName || v.physicalName : v.physicalName}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Categories */}
          {data.categories.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--vscode-descriptionForeground, #6c7086)'
                  }}
                >
                  CATEGORIES ({data.categories.length})
                </span>
                {data.categorySettings?.selectedCategoryId && (
                  <button
                    type="button"
                    onClick={() => sendAction('setCategorySettings', { selectedCategoryId: null })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#89b4fa',
                      fontSize: '10px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    전체 보기
                  </button>
                )}
              </div>
              {data.categories.map((c) => {
                const isSel = data.categorySettings?.selectedCategoryId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      sendAction('setCategorySettings', { selectedCategoryId: isSel ? null : c.id });
                      sendAction('focusNode', c.id);
                    }}
                    onDoubleClick={() => sendAction('openCategoryById', c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 6px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      backgroundColor: isSel ? 'rgba(203, 166, 247, 0.18)' : 'transparent'
                    }}
                    title="클릭: 카테고리 필터 / 더블클릭: 편집"
                  >
                    <Folder size={12} color="#cba6f7" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                  </div>
                );
              })}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  marginTop: '4px',
                  paddingLeft: '4px',
                  fontSize: '11px',
                  color: 'var(--vscode-descriptionForeground, var(--text-secondary))'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(data.categorySettings?.freeLayout)}
                    onChange={(e) => sendAction('setCategorySettings', { freeLayout: e.target.checked })}
                  />
                  <span>자유 레이아웃</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(data.categorySettings?.showReferredTables)}
                    onChange={(e) =>
                      sendAction('setCategorySettings', { showReferredTables: e.target.checked })
                    }
                  />
                  <span>참조 테이블 표시</span>
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          {data.notes.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--vscode-descriptionForeground, #6c7086)',
                  marginBottom: '4px'
                }}
              >
                NOTES ({data.notes.length})
              </div>
              {data.notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => sendAction('focusNode', n.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 6px', cursor: 'pointer' }}
                >
                  <StickyNote size={12} color="#f9e2af" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Non-element summary */}
          <div
            style={{
              borderTop: '1px solid var(--vscode-panel-border, var(--border-color))',
              paddingTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '11px',
              color: 'var(--vscode-descriptionForeground, var(--text-secondary))'
            }}
          >
            <div style={{ cursor: 'pointer' }} onClick={() => sendAction('openModelManager', 'sequences')}>
              {t('sequences')}: {data.sequencesCount}
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => sendAction('openModelManager', 'triggers')}>
              {t('triggers')}: {data.triggersCount}
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => sendAction('openModelManager', 'tablespaces')}>
              {t('tablespaces')}: {data.tablespacesCount}
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => sendAction('openModelManager', 'columnGroups')}>
              {t('columnGroups')}: {data.columnGroupsCount}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
