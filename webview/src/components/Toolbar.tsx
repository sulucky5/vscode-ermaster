import React from "react";
import { useERDStore, AlignMode } from "../store/useERDStore.js";
import {
  Plus,
  StickyNote,
  Code,
  Database,
  Sparkles,
  Layers,
  FileUp,
  Server,
  Lock,
  Unlock,
  Search,
  ListTree,
  Printer,
  Download,
} from "lucide-react";
import {
  DatabaseType,
  NotationType,
  TableStyle,
  NotationLevel,
} from "../types/erm.types.js";

export const Toolbar: React.FC = () => {
  const diagram = useERDStore((state) => state.diagram);
  const fileName = useERDStore((state) => state.fileName);
  const setViewMode = useERDStore((state) => state.setViewMode);
  const setDatabase = useERDStore((state) => state.setDatabase);
  const setNotation = useERDStore((state) => state.setNotation);
  const setTableStyle = useERDStore((state) => state.setTableStyle);
  const setNotationLevel = useERDStore((state) => state.setNotationLevel);
  const setCapital = useERDStore((state) => state.setCapital);
  const toggleLockEdit = useERDStore((state) => state.toggleLockEdit);
  const addTable = useERDStore((state) => state.addTable);
  const addNote = useERDStore((state) => state.addNote);
  const edgeRoutingType = useERDStore((state) => state.edgeRoutingType);
  const setEdgeRoutingType = useERDStore((state) => state.setEdgeRoutingType);
  const openDDLModal = useERDStore((state) => state.openDDLModal);
  const openModelManager = useERDStore((state) => state.openModelManager);
  const openEditAllModal = useERDStore((state) => state.openEditAllModal);
  const openImportFileModal = useERDStore((state) => state.openImportFileModal);
  const openImportDBModal = useERDStore((state) => state.openImportDBModal);
  const openExportModal = useERDStore((state) => state.openExportModal);
  const openSearchModal = useERDStore((state) => state.openSearchModal);
  const toggleOutline = useERDStore((state) => state.toggleOutline);
  const isOutlineOpen = useERDStore((state) => state.isOutlineOpen);
  const selectedNodeIds = useERDStore((state) => state.selectedNodeIds);
  const alignNodes = useERDStore((state) => state.alignNodes);
  const lockEdit = Boolean(diagram.lockEdit);

  const supportedDbs: DatabaseType[] = [
    "PostgreSQL",
    "MySQL",
    "Oracle",
    "SQLServer",
    "SQLServer2008",
    "DB2",
    "SQLite",
    "H2",
    "HSQLDB",
    "MS Access",
    "StandardSQL",
    "Tibero",
    "CUBRID",
  ];

  return (
    <div
      className="no-print"
      style={{
        position: "absolute",
        top: 14,
        left: 14,
        right: 14,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        backgroundColor: "rgba(37, 37, 56, 0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Left: Brand & File info */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%)",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} color="#11111b" />
          </div>
          <div>
            <div
              style={{ fontSize: "13px", fontWeight: 700, color: "#cdd6f4" }}
            >
              ERMaster
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {fileName}
            </div>
          </div>
        </div>

        <div
          style={{
            width: "1px",
            height: "24px",
            backgroundColor: "var(--border-color)",
          }}
        />

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className="btn btn-primary"
            disabled={lockEdit}
            onClick={() => addTable()}
          >
            <Plus size={14} />
            <span>Table</span>
          </button>
          <button
            className="btn btn-secondary"
            disabled={lockEdit}
            onClick={() => addNote()}
          >
            <StickyNote size={14} />
            <span>Note</span>
          </button>
        </div>
      </div>

      {/* Right: View Mode, Notation, Theme, Level, Capital, Lock, DBMS, Import, DDL */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {/* Notation: IE / IDEF1X */}
        <select
          value={diagram.notation || "IE"}
          onChange={(e) => setNotation(e.target.value as NotationType)}
          title="표기법 (IE / IDEF1X)"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "5px 8px",
            fontSize: "11px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="IE">IE</option>
          <option value="IDEF1X">IDEF1X</option>
        </select>

        {/* Design Theme: Frame / Funny / Simple */}
        <select
          value={diagram.tableStyle || "frame"}
          onChange={(e) => setTableStyle(e.target.value as TableStyle)}
          title="디자인 테마 (Frame / Funny / Simple)"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "5px 8px",
            fontSize: "11px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="frame">Frame</option>
          <option value="funny">Funny</option>
          <option value="simple">Simple</option>
        </select>

        {/* Notation Level */}
        <select
          value={diagram.notationLevel || "detail"}
          onChange={(e) => setNotationLevel(e.target.value as NotationLevel)}
          title="표시 레벨"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "5px 8px",
            fontSize: "11px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="detail">상세</option>
          <option value="title">제목만</option>
          <option value="key">키만</option>
          <option value="column">컬럼만</option>
          <option value="exclude_type">타입 제외</option>
          <option value="name_and_key">제목+키</option>
        </select>

        {/* Capital Toggle */}
        <button
          className={`btn ${diagram.capital ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "4px 8px", fontSize: "11px" }}
          onClick={() => setCapital(!diagram.capital)}
          title="물리명 대문자 전환"
        >
          {diagram.capital ? "AA" : "aa"}
        </button>

        {/* Edit Lock Toggle */}
        <button
          className={`btn ${lockEdit ? "btn-danger" : "btn-secondary"}`}
          style={{ padding: "4px 8px", fontSize: "11px" }}
          onClick={toggleLockEdit}
          title={lockEdit ? "편집 잠금 해제" : "편집 잠금"}
        >
          {lockEdit ? <Lock size={13} /> : <Unlock size={13} />}
          <span>{lockEdit ? "잠금" : "편집"}</span>
        </button>
        {/* DBMS Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Database size={14} color="var(--text-secondary)" />
          <select
            value={diagram.db || "PostgreSQL"}
            onChange={(e) => setDatabase(e.target.value as DatabaseType)}
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "5px 10px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {supportedDbs.map((db) => (
              <option key={db} value={db}>
                {db}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "2px",
          }}
        >
          {(["both", "physical", "logical"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                background:
                  diagram.viewMode === mode
                    ? "var(--accent-primary)"
                    : "transparent",
                color:
                  diagram.viewMode === mode
                    ? "#11111b"
                    : "var(--text-secondary)",
                border: "none",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Edge Routing Style Toggle */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "2px",
          }}
          title="관계선 꺾임 모양 (직교 / 스텝 / 곡선 / 직선)"
        >
          {(
            [
              { id: "smoothstep", label: "직교" },
              { id: "step", label: "계단" },
              { id: "bezier", label: "곡선" },
              { id: "straight", label: "직선" },
            ] as const
          ).map((style) => (
            <button
              key={style.id}
              onClick={() => setEdgeRoutingType(style.id)}
              style={{
                background:
                  edgeRoutingType === style.id
                    ? "var(--accent-primary)"
                    : "transparent",
                color:
                  edgeRoutingType === style.id
                    ? "#11111b"
                    : "var(--text-secondary)",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {style.label}
            </button>
          ))}
        </div>

        {/* Import Actions */}
        <button
          className="btn btn-secondary"
          onClick={openImportFileModal}
          title="파일(.erm/.sql)에서 모델 가져오기"
        >
          <FileUp size={14} />
          <span>파일 가져오기</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={openImportDBModal}
          title="JDBC를 통해 기존 DB 리버스 엔지니어링"
        >
          <Server size={14} />
          <span>DB 가져오기</span>
        </button>

        {/* Model Elements Manager */}
        <button
          className="btn btn-secondary"
          onClick={() => openModelManager("dictionary")}
        >
          <Layers size={14} />
          <span>모델 관리</span>
        </button>
        <button
          className="btn btn-secondary"
          disabled={lockEdit}
          onClick={openEditAllModal}
          title="모든 테이블 컬럼 일괄 편집"
        >
          <span>일괄 편집</span>
        </button>

        {/* Align & Match Size (when 2+ nodes selected) */}
        <select
          value=""
          disabled={lockEdit || selectedNodeIds.length < 2}
          onChange={(e) => {
            if (e.target.value) alignNodes(e.target.value as AlignMode);
          }}
          title={
            selectedNodeIds.length < 2
              ? "2개 이상 노드를 선택하면 정렬/크기 맞추기 사용 가능"
              : "선택한 노드 정렬/크기 맞추기"
          }
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "5px 8px",
            fontSize: "11px",
            outline: "none",
            cursor: selectedNodeIds.length < 2 ? "not-allowed" : "pointer",
            opacity: selectedNodeIds.length < 2 ? 0.5 : 1,
          }}
        >
          <option value="">정렬/크기 ({selectedNodeIds.length})</option>
          <option value="left">좌측 정렬</option>
          <option value="center">가운데 정렬</option>
          <option value="right">우측 정렬</option>
          <option value="top">상단 정렬</option>
          <option value="middle">중앙 정렬</option>
          <option value="bottom">하단 정렬</option>
          <option value="matchWidth">너비 맞추기</option>
          <option value="matchHeight">높이 맞추기</option>
        </select>

        {/* Search, Outline, Print */}
        <button
          className="btn btn-secondary"
          onClick={openSearchModal}
          title="검색 (Ctrl+F)"
        >
          <Search size={14} />
        </button>
        <button
          className={`btn ${isOutlineOpen ? "btn-primary" : "btn-secondary"}`}
          onClick={toggleOutline}
          title="아웃라인 뷰 토글"
        >
          <ListTree size={14} />
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => window.print()}
          title="다이어그램 인쇄"
        >
          <Printer size={14} />
        </button>

        {/* DDL Preview & Export */}
        <button className="btn btn-secondary" onClick={openDDLModal}>
          <Code size={14} />
          <span>DDL</span>
        </button>
        <button className="btn btn-primary" onClick={openExportModal} title="Excel, HTML, Java, 이미지, DB 등 내보내기">
          <Download size={14} />
          <span>내보내기</span>
        </button>
      </div>
    </div>
  );
};
