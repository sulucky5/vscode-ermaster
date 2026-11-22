import React, { useEffect, useState } from 'react';
import { vscode, ActiveTool, AlignMode } from '../store/useERDStore.js';
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

const TOOL_GROUPS = [
  {
    title: '기본',
    tools: [
      {
        id: 'select' as const,
        label: '선택 (Select)',
        icon: MousePointer,
        tooltip: '객체 선택 및 드래그 박스 선택'
      },
      {
        id: 'pan' as const,
        label: '이동 (Pan)',
        icon: Hand,
        tooltip: '화면 배경을 드래그하여 이동'
      }
    ]
  },
  {
    title: '모델 요소',
    tools: [
      {
        id: 'table' as const,
        label: '테이블 (Table)',
        icon: Table,
        tooltip: '클릭하여 새 테이블 생성'
      },
      {
        id: 'view' as const,
        label: '뷰 (View)',
        icon: Eye,
        tooltip: '클릭하여 새 뷰 생성'
      },
      {
        id: 'note' as const,
        label: '메모 (Note)',
        icon: StickyNote,
        tooltip: '클릭하여 새 메모 생성'
      },
      {
        id: 'category' as const,
        label: '카테고리 (Category)',
        icon: Folder,
        tooltip: '클릭하여 새 카테고리 영역 생성'
      },
      {
        id: 'image' as const,
        label: '이미지 (Image)',
        icon: ImageIcon,
        tooltip: '클릭하여 이미지 삽입'
      }
    ]
  },
  {
    title: '관계선 (Relations)',
    tools: [
      {
        id: 'relation_1_n' as const,
        label: '1:N 관계',
        icon: GitFork,
        tooltip: '부모 테이블 클릭 후 자식 테이블 클릭'
      },
      {
        id: 'relation_1_1' as const,
        label: '1:1 관계',
        icon: Share2,
        tooltip: '1:1 관계 연결'
      },
      {
        id: 'relation_n_m' as const,
        label: 'N:M 관계',
        icon: Repeat,
        tooltip: 'N:M 다대다 관계 연결'
      },
      {
        id: 'relation_self' as const,
        label: '자기 참조',
        icon: RotateCw,
        tooltip: '동일 테이블 자기 참조 연결'
      },
      {
        id: 'comment_connection' as const,
        label: '메모 연결선',
        icon: Link2,
        tooltip: '메모와 테이블/뷰/노드 연결'
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
    if (!state.hasActiveEditor) {
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
          ERMaster 파일(.erm, .erd)을 열면 사용할 수 있습니다.
        </div>
      )}

      {section === 'tools' && (
        <>
          {state.hasActiveEditor && state.lockEdit && (
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#f38ba8' }}>
              LOCKED (편집 잠금됨)
            </div>
          )}
            {/* Quick Add Buttons (from Toolbar) */}
            <div>
              <div style={sectionLabelStyle}>빠른 추가</div>
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

            {TOOL_GROUPS.map((group) => (
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
                    <span>안내</span>
                  </div>
                  {state.activeTool === 'comment_connection'
                    ? state.relationSourceId
                      ? '2. 연결할 대상 노드를 클릭하세요.'
                      : '1. 시작 노드(메모 등)를 클릭하세요.'
                    : state.relationSourceId
                    ? '2. 자식(참조할) 테이블을 클릭하세요.'
                    : '1. 부모(기준) 테이블을 클릭하세요.'}
                </div>
              )}
        </>
      )}

      {section === 'view' && (
        <>
            {/* Edit Lock & Capital */}
            <div>
              <div style={sectionLabelStyle}>편집 상태</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('toggleLockEdit')}
                  style={{
                    ...actionButtonStyle(disabled, state.lockEdit ? 'danger' : 'default'),
                    justifyContent: 'center'
                  }}
                  title={state.lockEdit ? '편집 잠금 해제' : '편집 잠금'}
                >
                  {state.lockEdit ? <Lock size={13} /> : <Unlock size={13} />}
                  <span>{state.lockEdit ? '잠금' : '편집'}</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => sendAction('setCapital', !state.capital)}
                  style={{
                    ...actionButtonStyle(disabled, state.capital ? 'primary' : 'default'),
                    justifyContent: 'center'
                  }}
                  title="물리명 대문자 전환"
                >
                  <span>{state.capital ? 'AA (대문자)' : 'aa (기본)'}</span>
                </button>
              </div>
            </div>

            {/* DBMS */}
            <div>
              <div style={sectionLabelStyle}>대상 DBMS</div>
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
              <div style={sectionLabelStyle}>보기 모드</div>
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
              <div style={sectionLabelStyle}>표기법 (Notation)</div>
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
              <div style={sectionLabelStyle}>디자인 테마</div>
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
              <div style={sectionLabelStyle}>표시 레벨</div>
              <select
                disabled={disabled}
                value={state.notationLevel}
                onChange={(e) => sendAction('setNotationLevel', e.target.value)}
                style={selectStyle}
              >
                <option value="detail">상세</option>
                <option value="title">제목만</option>
                <option value="key">키만</option>
                <option value="column">컬럼만</option>
                <option value="exclude_type">타입 제외</option>
                <option value="name_and_key">제목+키</option>
              </select>
            </div>

            {/* Edge Routing */}
            <div>
              <div style={sectionLabelStyle}>관계선 꺾임 모양</div>
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
                    { id: 'smoothstep', label: '직교' },
                    { id: 'step', label: '계단' },
                    { id: 'bezier', label: '곡선' },
                    { id: 'straight', label: '직선' }
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

            {/* Align & Match Size */}
            <div>
              <div style={sectionLabelStyle}>정렬 / 크기 맞추기 ({state.selectedCount})</div>
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
                <option value="">2개 이상 선택 후 동작 선택...</option>
                <option value="left">좌측 정렬</option>
                <option value="center">가운데 정렬</option>
                <option value="right">우측 정렬</option>
                <option value="top">상단 정렬</option>
                <option value="middle">중앙 정렬</option>
                <option value="bottom">하단 정렬</option>
                <option value="matchWidth">너비 맞추기</option>
                <option value="matchHeight">높이 맞추기</option>
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
