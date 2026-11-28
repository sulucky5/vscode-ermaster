import React, { useEffect, useState } from 'react';
import { vscode, ActiveTool, AlignMode } from '../store/useERDStore.js';
import { useI18n, SupportedLang, TranslationKey } from '../i18n/translations.js';
import {
  DatabaseType,
  NotationType,
  TableStyle,
  NotationLevel
} from '../types/erm.types.js';
import {
  MousePointer,
  Hand,
  Table,
  Eye,
  StickyNote,
  Folder,
  Image as ImageIcon,
  Link2,
  Share2,
  GitFork,
  Repeat,
  RotateCw,
  Info,
  Plus,
  Code,
  Database,
  Layers,
  FileUp,
  Server,
  Lock,
  Unlock,
  Search,
  Printer,
  Download
} from 'lucide-react';

type SidebarTab = 'tools' | 'view' | 'actions';

interface PaletteViewState {
  hasActiveEditor: boolean;
  fileName: string;
  activeTool: ActiveTool;
  relationSourceId: string | null;
  lockEdit: boolean;
  db: DatabaseType;
  viewMode: 'logical' | 'physical' | 'both';
  notation: NotationType;
  tableStyle: TableStyle;
  notationLevel: NotationLevel;
  capital: boolean;
  edgeRoutingType: 'smoothstep' | 'step' | 'bezier' | 'straight';
  tableHeightMode: 'auto' | 'fixed';
  tableFixedHeight: number;
  tableWidthMode: 'auto' | 'fixed';
  tableFixedWidth: number;
  isOutlineOpen: boolean;
  selectedCount: number;
}

const SUPPORTED_DBS: DatabaseType[] = [
  'PostgreSQL',
  'MySQL',
  'Oracle',
  'SQLServer',
  'SQLServer2008',
  'DB2',
  'SQLite',
  'H2',
  'HSQLDB',
  'MS Access',
  'StandardSQL',
  'Tibero',
  'CUBRID'
];

const getToolGroups = (t: (key: TranslationKey) => string) => [
  {
    title: t('groupBasic'),
    tools: [
      {
        id: 'select' as const,
        label: t('toolSelect'),
        icon: MousePointer,
        tooltip: t('toolSelectTip')
      },
      {
        id: 'pan' as const,
        label: t('toolPan'),
        icon: Hand,
        tooltip: t('toolPanTip')
      }
    ]
  },
  {
    title: t('groupElements'),
    tools: [
      {
        id: 'table' as const,
        label: t('toolTable'),
        icon: Table,
        tooltip: t('toolTableTip')
      },
      {
        id: 'view' as const,
        label: t('toolView'),
        icon: Eye,
        tooltip: t('toolViewTip')
      },
      {
        id: 'note' as const,
        label: t('toolNote'),
        icon: StickyNote,
        tooltip: t('toolNoteTip')
      },
      {
        id: 'category' as const,
        label: t('toolCategory'),
        icon: Folder,
        tooltip: t('toolCategoryTip')
      },
      {
        id: 'image' as const,
        label: t('toolImage'),
        icon: ImageIcon,
        tooltip: t('toolImageTip')
      }
    ]
  },
  {
    title: t('groupRelations'),
    tools: [
      {
        id: 'relation_1_n' as const,
        label: t('toolRel1N'),
        icon: GitFork,
        tooltip: t('toolRel1NTip')
      },
      {
        id: 'relation_1_1' as const,
        label: t('toolRel11'),
        icon: Share2,
        tooltip: t('toolRel11Tip')
      },
      {
        id: 'relation_n_m' as const,
        label: t('toolRelNM'),
        icon: Repeat,
        tooltip: t('toolRelNMTip')
      },
      {
        id: 'relation_self' as const,
        label: t('toolRelSelf'),
        icon: RotateCw,
        tooltip: t('toolRelSelfTip')
      },
      {
        id: 'comment_connection' as const,
        label: t('toolCommentConn'),
        icon: Link2,
        tooltip: t('toolCommentConnTip')
      }
    ]
  }
];

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--vscode-descriptionForeground, #6c7086)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.4px'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--vscode-dropdown-background, var(--bg-tertiary))',
  color: 'var(--vscode-dropdown-foreground, var(--text-primary))',
  border: '1px solid var(--vscode-dropdown-border, var(--border-color))',
  borderRadius: '5px',
  padding: '6px 8px',
  fontSize: '12px',
  outline: 'none',
  cursor: 'pointer'
};

const actionButtonStyle = (
  disabled: boolean,
  variant: 'default' | 'primary' | 'danger' = 'default'
): React.CSSProperties => {
  const bg =
    variant === 'primary'
      ? 'var(--vscode-button-background, var(--accent-primary))'
      : variant === 'danger'
      ? 'rgba(243, 139, 168, 0.2)'
      : 'var(--vscode-button-secondaryBackground, var(--bg-tertiary))';
  const fg =
    variant === 'primary'
      ? 'var(--vscode-button-foreground, #11111b)'
      : variant === 'danger'
      ? '#f38ba8'
      : 'var(--vscode-button-secondaryForeground, var(--text-primary))';

  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '7px 10px',
    borderRadius: '5px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid var(--vscode-panel-border, var(--border-color))',
    backgroundColor: bg,
    color: fg,
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left'
  };
};

export const Palette: React.FC<{ section?: SidebarTab }> = ({ section = 'tools' }) => {
  const { lang, t } = useI18n();
  const toolGroups = getToolGroups(t);
  const [state, setState] = useState<PaletteViewState>({
    hasActiveEditor: false,
    fileName: '',
    activeTool: 'select',
    relationSourceId: null,
    lockEdit: false,
    db: 'PostgreSQL',
    viewMode: 'both',
    notation: 'IE',
    tableStyle: 'frame',
    notationLevel: 'detail',
    capital: false,
    edgeRoutingType: 'smoothstep',
    tableHeightMode: 'auto',
    tableFixedHeight: 220,
    tableWidthMode: 'auto',
    tableFixedWidth: 240,
    isOutlineOpen: false,
    selectedCount: 0
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type === 'paletteState') {
        setState({
          hasActiveEditor: Boolean(message.hasActiveEditor),
          fileName: message.fileName || '',
          activeTool: (message.activeTool || 'select') as ActiveTool,
          relationSourceId: message.relationSourceId ?? null,
          lockEdit: Boolean(message.lockEdit),
          db: (message.db || 'PostgreSQL') as DatabaseType,
          viewMode: message.viewMode || 'both',
          notation: (message.notation || 'IE') as NotationType,
          tableStyle: (message.tableStyle || 'frame') as TableStyle,
          notationLevel: (message.notationLevel || 'detail') as NotationLevel,
          capital: Boolean(message.capital),
          edgeRoutingType: message.edgeRoutingType || 'smoothstep',
          tableHeightMode: message.tableHeightMode === 'fixed' ? 'fixed' : 'auto',
          tableFixedHeight: typeof message.tableFixedHeight === 'number' ? message.tableFixedHeight : 220,
          tableWidthMode: message.tableWidthMode === 'fixed' ? 'fixed' : 'auto',
          tableFixedWidth: typeof message.tableFixedWidth === 'number' ? message.tableFixedWidth : 240,
          isOutlineOpen: Boolean(message.isOutlineOpen),
          selectedCount: typeof message.selectedCount === 'number' ? message.selectedCount : 0
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
    if (!state.hasActiveEditor && action !== 'setLanguage') {
      return;
    }
    if (action === 'setActiveTool' && typeof value === 'string') {
      setState((prev) => ({
        ...prev,
        activeTool: value as ActiveTool,
        relationSourceId: null
      }));
    }
    vscode?.postMessage({ type: 'sidebarAction', action, value });
  };

  const disabled = !state.hasActiveEditor;
  const editDisabled = disabled || state.lockEdit;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'var(--vscode-sideBar-background, var(--bg-primary))',
        color: 'var(--vscode-foreground, var(--text-primary))',
        userSelect: 'none'
      }}
    >
      {!state.hasActiveEditor && (
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
          {t('openFileHint')}
        </div>
      )}

      {section === 'tools' && (
        <>
          {state.hasActiveEditor && state.lockEdit && (
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#f38ba8' }}>
              {t('lockedBadge')}
            </div>
          )}
            {/* Quick Add Buttons (from Toolbar) */}
            <div>
              <div style={sectionLabelStyle}>{t('quickAdd')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  disabled={editDisabled}
                  onClick={() => sendAction('addTable')}
                  style={{ ...actionButtonStyle(editDisabled, 'primary'), justifyContent: 'center' }}
                >
                  <Plus size={13} />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  disabled={editDisabled}
                  onClick={() => sendAction('addNote')}
                  style={{ ...actionButtonStyle(editDisabled), justifyContent: 'center' }}
                >
                  <StickyNote size={13} />
                  <span>Note</span>
                </button>
              </div>
            </div>

            {toolGroups.map((group) => (
              <div key={group.title}>
                <div style={sectionLabelStyle}>{group.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = state.hasActiveEditor && state.activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => sendAction('setActiveTool', tool.id)}
                        title={tool.tooltip}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: isActive ? 600 : 400,
                          border: '1px solid',
                          borderColor: isActive
                            ? 'var(--vscode-focusBorder, var(--accent-primary))'
                            : 'transparent',
                          backgroundColor: isActive
                            ? 'var(--vscode-list-activeSelectionBackground, rgba(137, 180, 250, 0.15))'
                            : 'transparent',
                          color: isActive
                            ? 'var(--vscode-list-activeSelectionForeground, #89b4fa)'
                            : 'var(--vscode-foreground, var(--text-primary))',
                          opacity: disabled ? 0.45 : 1,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left'
                        }}
                      >
                        <Icon
                          size={14}
                          color={
                            isActive
                              ? 'var(--vscode-list-activeSelectionForeground, #89b4fa)'
                              : 'var(--vscode-descriptionForeground, var(--text-secondary))'
                          }
                        />
                        <span>{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {state.hasActiveEditor &&
              (state.activeTool.startsWith('relation') ||
                state.activeTool === 'comment_connection') && (
                <div
                  style={{
                    marginTop: '2px',
                    padding: '8px',
                    backgroundColor: 'rgba(137, 180, 250, 0.1)',
                    border: '1px solid rgba(137, 180, 250, 0.3)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#89b4fa',
                    lineHeight: 1.4
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '3px',
                      fontWeight: 600
                    }}
                  >
                    <Info size={12} />
                    <span>{t('guideTitle')}</span>
                  </div>
                  {state.activeTool === 'comment_connection'
                    ? state.relationSourceId
                      ? t('guideCommentStep2')
                      : t('guideCommentStep1')
                    : state.relationSourceId
                    ? t('guideRelStep2')
                    : t('guideRelStep1')}
                </div>
              )}
        </>
      )}

      {section === 'view' && (
        <>
            {/* Edit Lock & Capital */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionEditState')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('toggleLockEdit')}
                  style={{
                    ...actionButtonStyle(disabled, state.lockEdit ? 'danger' : 'default'),
                    justifyContent: 'center'
                  }}
                  title={state.lockEdit ? t('unlockTip') : t('lockTip')}
                >
                  {state.lockEdit ? <Lock size={13} /> : <Unlock size={13} />}
                  <span>{state.lockEdit ? t('lockLabel') : t('editLabel')}</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('setCapital', !state.capital)}
                  style={{
                    ...actionButtonStyle(disabled, state.capital ? 'primary' : 'default'),
                    justifyContent: 'center'
                  }}
                  title={t('capitalTip')}
                >
                  <span>{state.capital ? t('capitalOn') : t('capitalOff')}</span>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionLanguage')}</div>
              <select
                value={lang}
                onChange={(e) => sendAction('setLanguage', e.target.value as SupportedLang)}
                style={selectStyle}
              >
                <option value="ko">한국어 (Korean)</option>
                <option value="en">English</option>
                <option value="ja">日本語 (Japanese)</option>
              </select>
            </div>

            {/* DBMS */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionDbms')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} color="var(--vscode-descriptionForeground, var(--text-secondary))" />
                <select
                  disabled={disabled}
                  value={state.db}
                  onChange={(e) => sendAction('setDatabase', e.target.value)}
                  style={selectStyle}
                >
                  {SUPPORTED_DBS.map((db) => (
                    <option key={db} value={db}>
                      {db}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionViewMode')}</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                  padding: '3px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--vscode-input-background, var(--bg-tertiary))',
                  border: '1px solid var(--vscode-panel-border, var(--border-color))'
                }}
              >
                {(['both', 'physical', 'logical'] as const).map((mode) => {
                  const active = state.viewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={disabled}
                      onClick={() => sendAction('setViewMode', mode)}
                      style={{
                        padding: '5px 4px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        backgroundColor: active
                          ? 'var(--vscode-button-background, var(--accent-primary))'
                          : 'transparent',
                        color: active
                          ? 'var(--vscode-button-foreground, #11111b)'
                          : 'var(--vscode-foreground, var(--text-secondary))',
                        opacity: disabled ? 0.45 : 1
                      }}
                    >
                      {mode.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notation, Theme, Level */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionNotation')}</div>
              <select
                disabled={disabled}
                value={state.notation}
                onChange={(e) => sendAction('setNotation', e.target.value)}
                style={selectStyle}
              >
                <option value="IE">IE</option>
                <option value="IDEF1X">IDEF1X</option>
              </select>
            </div>

            <div>
              <div style={sectionLabelStyle}>{t('sectionTheme')}</div>
              <select
                disabled={disabled}
                value={state.tableStyle}
                onChange={(e) => sendAction('setTableStyle', e.target.value)}
                style={selectStyle}
              >
                <option value="frame">Frame</option>
                <option value="funny">Funny</option>
                <option value="simple">Simple</option>
              </select>
            </div>

            <div>
              <div style={sectionLabelStyle}>{t('sectionLevel')}</div>
              <select
                disabled={disabled}
                value={state.notationLevel}
                onChange={(e) => sendAction('setNotationLevel', e.target.value)}
                style={selectStyle}
              >
                <option value="detail">{t('levelDetail')}</option>
                <option value="title">{t('levelTitle')}</option>
                <option value="key">{t('levelKey')}</option>
                <option value="column">{t('levelColumn')}</option>
                <option value="exclude_type">{t('levelExcludeType')}</option>
                <option value="name_and_key">{t('levelNameAndKey')}</option>
              </select>
            </div>

            {/* Edge Routing */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionRouting')}</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px',
                  padding: '3px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--vscode-input-background, var(--bg-tertiary))',
                  border: '1px solid var(--vscode-panel-border, var(--border-color))'
                }}
              >
                {(
                  [
                    { id: 'smoothstep', label: t('routeSmoothstep') },
                    { id: 'step', label: t('routeStep') },
                    { id: 'bezier', label: t('routeBezier') },
                    { id: 'straight', label: t('routeStraight') }
                  ] as const
                ).map((style) => {
                  const active = state.edgeRoutingType === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => sendAction('setEdgeRoutingType', style.id)}
                      style={{
                        padding: '5px 2px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        backgroundColor: active
                          ? 'var(--vscode-button-background, var(--accent-primary))'
                          : 'transparent',
                        color: active
                          ? 'var(--vscode-button-foreground, #11111b)'
                          : 'var(--vscode-foreground, var(--text-secondary))',
                        opacity: disabled ? 0.45 : 1
                      }}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Height (Auto / Fixed) */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionTableHeight')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                    padding: '3px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--vscode-input-background, var(--bg-tertiary))',
                    border: '1px solid var(--vscode-panel-border, var(--border-color))'
                  }}
                >
                  {(['auto', 'fixed'] as const).map((mode) => {
                    const active = state.tableHeightMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          sendAction('setTableHeightSetting', {
                            mode,
                            fixedHeight: state.tableFixedHeight
                          })
                        }
                        style={{
                          padding: '5px 4px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          backgroundColor: active
                            ? 'var(--vscode-button-background, var(--accent-primary))'
                            : 'transparent',
                          color: active
                            ? 'var(--vscode-button-foreground, #11111b)'
                            : 'var(--vscode-foreground, var(--text-secondary))',
                          opacity: disabled ? 0.45 : 1
                        }}
                      >
                        {mode === 'auto' ? t('heightAuto') : t('heightFixed')}
                      </button>
                    );
                  })}
                </div>
                {state.tableHeightMode === 'fixed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min={80}
                      step={10}
                      disabled={disabled}
                      value={state.tableFixedHeight}
                      onChange={(e) => {
                        const val = Math.max(80, Number(e.target.value) || 220);
                        setState((prev) => ({ ...prev, tableFixedHeight: val }));
                        sendAction('setTableHeightSetting', { mode: 'fixed', fixedHeight: val });
                      }}
                      style={{
                        ...selectStyle,
                        width: '90px'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground, var(--text-muted))' }}>
                      px
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Table Width (Auto / Fixed) */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionTableWidth')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                    padding: '3px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--vscode-input-background, var(--bg-tertiary))',
                    border: '1px solid var(--vscode-panel-border, var(--border-color))'
                  }}
                >
                  {(['auto', 'fixed'] as const).map((mode) => {
                    const active = state.tableWidthMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          sendAction('setTableWidthSetting', {
                            mode,
                            fixedWidth: state.tableFixedWidth
                          })
                        }
                        style={{
                          padding: '5px 4px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          backgroundColor: active
                            ? 'var(--vscode-button-background, var(--accent-primary))'
                            : 'transparent',
                          color: active
                            ? 'var(--vscode-button-foreground, #11111b)'
                            : 'var(--vscode-foreground, var(--text-secondary))',
                          opacity: disabled ? 0.45 : 1
                        }}
                      >
                        {mode === 'auto' ? t('heightAuto') : t('heightFixed')}
                      </button>
                    );
                  })}
                </div>
                {state.tableWidthMode === 'fixed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min={160}
                      step={10}
                      disabled={disabled}
                      value={state.tableFixedWidth}
                      onChange={(e) => {
                        const val = Math.max(160, Number(e.target.value) || 240);
                        setState((prev) => ({ ...prev, tableFixedWidth: val }));
                        sendAction('setTableWidthSetting', { mode: 'fixed', fixedWidth: val });
                      }}
                      style={{
                        ...selectStyle,
                        width: '90px'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--vscode-descriptionForeground, var(--text-muted))' }}>
                      px
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Align & Match Size */}
            <div>
              <div style={sectionLabelStyle}>{t('sectionAlign')} ({state.selectedCount})</div>
              <select
                value=""
                disabled={editDisabled || state.selectedCount < 2}
                onChange={(e) => {
                  if (e.target.value) {
                    sendAction('alignNodes', e.target.value as AlignMode);
                  }
                }}
                style={{
                  ...selectStyle,
                  opacity: editDisabled || state.selectedCount < 2 ? 0.5 : 1,
                  cursor: editDisabled || state.selectedCount < 2 ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">{t('alignPlaceholder')}</option>
                <option value="left">{t('alignLeft')}</option>
                <option value="center">{t('alignCenter')}</option>
                <option value="right">{t('alignRight')}</option>
                <option value="top">{t('alignTop')}</option>
                <option value="middle">{t('alignMiddle')}</option>
                <option value="bottom">{t('alignBottom')}</option>
                <option value="matchWidth">{t('alignMatchWidth')}</option>
                <option value="matchHeight">{t('alignMatchHeight')}</option>
              </select>
            </div>
        </>
      )}

      {section === 'actions' && (
        <>
            <div>
              <div style={sectionLabelStyle}>가져오기 (Import)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('openImportFileModal')}
                  style={actionButtonStyle(disabled)}
                  title="파일(.erm/.sql)에서 모델 가져오기"
                >
                  <FileUp size={14} />
                  <span>파일 가져오기 (.erm/.sql)</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('openImportDBModal')}
                  style={actionButtonStyle(disabled)}
                  title="JDBC를 통해 기존 DB 리버스 엔지니어링"
                >
                  <Server size={14} />
                  <span>DB 가져오기 (JDBC)</span>
                </button>
              </div>
            </div>

            <div>
              <div style={sectionLabelStyle}>모델 및 탐색</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('openModelManager', 'dictionary')}
                  style={actionButtonStyle(disabled)}
                >
                  <Layers size={14} />
                  <span>모델 관리</span>
                </button>
                <button
                  type="button"
                  disabled={editDisabled}
                  onClick={() => sendAction('openEditAllModal')}
                  style={actionButtonStyle(editDisabled)}
                  title="모든 테이블 컬럼 일괄 편집"
                >
                  <Table size={14} />
                  <span>모든 속성 일괄 편집</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('openSearchModal')}
                  style={actionButtonStyle(disabled)}
                  title="검색 (Ctrl+F)"
                >
                  <Search size={14} />
                  <span>검색 (Ctrl+F)</span>
                </button>
              </div>
            </div>

            <div>
              <div style={sectionLabelStyle}>DDL 및 내보내기</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('openDDLModal')}
                  style={actionButtonStyle(disabled)}
                >
                  <Code size={14} />
                  <span>DDL 미리보기 / 생성</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('openExportModal')}
                  style={actionButtonStyle(disabled, 'primary')}
                  title="Excel, HTML, Java, 이미지, DB 등 내보내기"
                >
                  <Download size={14} />
                  <span>내보내기 (Export)</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('print')}
                  style={actionButtonStyle(disabled)}
                  title="다이어그램 인쇄"
                >
                  <Printer size={14} />
                  <span>인쇄</span>
                </button>
              </div>
            </div>
        </>
      )}
    </div>
  );
};
