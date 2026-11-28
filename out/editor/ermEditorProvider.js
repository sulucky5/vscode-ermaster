"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERMEditorProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const ermParser_js_1 = require("../parser/ermParser.js");
const ermSerializer_js_1 = require("../parser/ermSerializer.js");
const ddlGenerator_js_1 = require("../ddl/ddlGenerator.js");
const fileImporter_js_1 = require("../import/fileImporter.js");
const jdbcImporter_js_1 = require("../import/jdbcImporter.js");
const paletteViewProvider_js_1 = require("./paletteViewProvider.js");
const modelExporter_js_1 = require("../export/modelExporter.js");
const excelTemplateExporter_js_1 = require("../export/excelTemplateExporter.js");
class ERMEditorProvider {
    context;
    paletteViewProviders;
    outlineViewProvider;
    static viewType = 'ermaster.editor';
    activePanel;
    panelStates = new Map();
    panelOutlines = new Map();
    constructor(context, paletteViewProviders = [], outlineViewProvider) {
        this.context = context;
        this.paletteViewProviders = paletteViewProviders;
        this.outlineViewProvider = outlineViewProvider;
    }
    setActiveTool(tool) {
        this.dispatchSidebarAction({
            type: 'sidebarAction',
            action: 'setActiveTool',
            value: tool
        });
    }
    dispatchSidebarAction(action) {
        const target = this.activePanel ?? this.panelStates.keys().next().value;
        if (target) {
            target.webview.postMessage(action);
        }
    }
    broadcastLanguage(lang) {
        for (const panel of this.panelStates.keys()) {
            panel.webview.postMessage({ type: 'setLanguage', lang });
        }
        for (const provider of this.paletteViewProviders) {
            provider.postLanguage(lang);
        }
        this.outlineViewProvider?.postLanguage(lang);
    }
    syncPaletteView() {
        const target = this.activePanel ?? this.panelStates.keys().next().value;
        if (this.paletteViewProviders.length > 0) {
            const state = target ? this.panelStates.get(target) : undefined;
            const nextState = state ?? {
                hasActiveEditor: false,
                activeTool: 'select',
                relationSourceId: null,
                lockEdit: false
            };
            for (const provider of this.paletteViewProviders) {
                provider.updateState(nextState);
            }
        }
        if (this.outlineViewProvider) {
            const outline = target ? this.panelOutlines.get(target) : undefined;
            this.outlineViewProvider.updateData(outline ?? {
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
        }
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))
            ]
        };
        webviewPanel.webview.html = (0, paletteViewProvider_js_1.buildWebviewHtml)(webviewPanel.webview, this.context.extensionPath, 'editor');
        this.panelStates.set(webviewPanel, {
            hasActiveEditor: true,
            activeTool: 'select',
            relationSourceId: null,
            lockEdit: false
        });
        if (webviewPanel.active || !this.activePanel) {
            this.activePanel = webviewPanel;
            this.syncPaletteView();
        }
        const viewStateSubscription = webviewPanel.onDidChangeViewState((e) => {
            if (e.webviewPanel.active) {
                this.activePanel = e.webviewPanel;
                this.syncPaletteView();
            }
        });
        let isInternalUpdate = false;
        // 문서 초기 파싱 및 Webview 전달
        const sendInitialData = () => {
            try {
                const text = document.getText();
                const diagram = text.trim() ? (0, ermParser_js_1.parseERMXml)(text) : this.createNewDiagram();
                webviewPanel.webview.postMessage({
                    type: 'init',
                    diagram,
                    fileName: path.basename(document.fileName)
                });
            }
            catch (err) {
                vscode.window.showErrorMessage(`Failed to parse ERMaster file: ${err.message}`);
            }
        };
        const sendTemplates = () => {
            const builtins = (0, excelTemplateExporter_js_1.getBuiltinTemplates)(this.context.extensionPath);
            const customs = this.context.globalState.get('ermaster.customExcelTemplates', []);
            webviewPanel.webview.postMessage({
                type: 'export:templatesLoaded',
                templates: [...builtins, ...customs],
                defaultTemplateId: 'template_ko.xls'
            });
        };
        // Webview 메시지 수신 핸들러
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'ready':
                    sendInitialData();
                    sendTemplates();
                    break;
                case 'export:getTemplates':
                    sendTemplates();
                    break;
                case 'export:addTemplate': {
                    const uris = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: { 'Excel Template (.xls)': ['xls'] }
                    });
                    if (uris && uris.length > 0) {
                        const filePath = uris[0].fsPath;
                        const fileName = path.basename(filePath);
                        const customs = this.context.globalState.get('ermaster.customExcelTemplates', []);
                        const id = `custom_${Date.now()}_${fileName}`;
                        const next = [
                            ...customs,
                            { id, label: `${fileName} (사용자 추가)`, filePath, isBuiltin: false }
                        ];
                        await this.context.globalState.update('ermaster.customExcelTemplates', next);
                        sendTemplates();
                        webviewPanel.webview.postMessage({ type: 'export:templateAdded', templateId: id });
                    }
                    break;
                }
                case 'export:removeTemplate': {
                    const customs = this.context.globalState.get('ermaster.customExcelTemplates', []);
                    const next = customs.filter((t) => t.id !== message.templateId);
                    await this.context.globalState.update('ermaster.customExcelTemplates', next);
                    sendTemplates();
                    break;
                }
                case 'export:downloadTemplate': {
                    const builtins = (0, excelTemplateExporter_js_1.getBuiltinTemplates)(this.context.extensionPath);
                    const customs = this.context.globalState.get('ermaster.customExcelTemplates', []);
                    const all = [...builtins, ...customs];
                    const chosen = all.find((t) => t.id === message.templateId) ||
                        all.find((t) => t.id === 'template_ko.xls') ||
                        all[0];
                    if (!chosen || !fs.existsSync(chosen.filePath)) {
                        vscode.window.showErrorMessage('다운로드할 템플릿 파일을 찾을 수 없습니다.');
                        break;
                    }
                    const saveUri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(path.join(path.dirname(document.fileName), path.basename(chosen.filePath))),
                        filters: { 'Excel Template (.xls)': ['xls'] }
                    });
                    if (saveUri) {
                        fs.copyFileSync(chosen.filePath, saveUri.fsPath);
                        vscode.window.showInformationMessage(`템플릿 저장 완료: ${path.basename(saveUri.fsPath)}`);
                    }
                    break;
                }
                case 'paletteState': {
                    this.panelStates.set(webviewPanel, {
                        hasActiveEditor: true,
                        fileName: typeof message.fileName === 'string' ? message.fileName : undefined,
                        activeTool: typeof message.activeTool === 'string' ? message.activeTool : 'select',
                        relationSourceId: message.relationSourceId ?? null,
                        lockEdit: Boolean(message.lockEdit),
                        db: typeof message.db === 'string' ? message.db : undefined,
                        viewMode: message.viewMode,
                        notation: typeof message.notation === 'string' ? message.notation : undefined,
                        tableStyle: typeof message.tableStyle === 'string' ? message.tableStyle : undefined,
                        notationLevel: typeof message.notationLevel === 'string' ? message.notationLevel : undefined,
                        capital: Boolean(message.capital),
                        edgeRoutingType: typeof message.edgeRoutingType === 'string' ? message.edgeRoutingType : undefined,
                        tableHeightMode: message.tableHeightMode === 'fixed' ? 'fixed' : 'auto',
                        tableFixedHeight: typeof message.tableFixedHeight === 'number' ? message.tableFixedHeight : 220,
                        tableWidthMode: message.tableWidthMode === 'fixed' ? 'fixed' : 'auto',
                        tableFixedWidth: typeof message.tableFixedWidth === 'number' ? message.tableFixedWidth : 240,
                        isOutlineOpen: Boolean(message.isOutlineOpen),
                        showMiniMap: message.showMiniMap !== false,
                        selectedCount: typeof message.selectedCount === 'number' ? message.selectedCount : 0
                    });
                    if (this.activePanel === webviewPanel || !this.activePanel) {
                        this.activePanel = webviewPanel;
                        this.syncPaletteView();
                    }
                    break;
                }
                case 'outlineData': {
                    this.panelOutlines.set(webviewPanel, {
                        hasActiveEditor: true,
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
                    if (this.activePanel === webviewPanel || !this.activePanel) {
                        this.activePanel = webviewPanel;
                        this.syncPaletteView();
                    }
                    break;
                }
                case 'update': {
                    try {
                        isInternalUpdate = true;
                        const updatedXml = (0, ermSerializer_js_1.serializeERMXml)(message.diagram);
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedXml);
                        await vscode.workspace.applyEdit(edit);
                    }
                    finally {
                        isInternalUpdate = false;
                    }
                    break;
                }
                case 'requestDDL': {
                    const ddl = (0, ddlGenerator_js_1.generateDDL)(message.diagram, message.targetDb, message.options);
                    const doc = await vscode.workspace.openTextDocument({
                        content: ddl,
                        language: 'sql'
                    });
                    await vscode.window.showTextDocument(doc, { preview: false });
                    break;
                }
                case 'exportImage': {
                    const defaultUri = vscode.Uri.file(document.fileName.replace(/\.(erm|erd)$/i, '.png'));
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri,
                        filters: { 'Images': ['png'] }
                    });
                    if (uri && message.dataUrl) {
                        const base64Data = message.dataUrl.replace(/^data:image\/png;base64,/, '');
                        fs.writeFileSync(uri.fsPath, Buffer.from(base64Data, 'base64'));
                        vscode.window.showInformationMessage(`Exported ERD image to ${path.basename(uri.fsPath)}`);
                    }
                    break;
                }
                case 'importFile:browse': {
                    const uris = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: {
                            'ERMaster / SQL DDL': ['erm', 'sql', 'ddl'],
                            'All Files': ['*']
                        }
                    });
                    if (!uris || uris.length === 0)
                        break;
                    try {
                        const filePath = uris[0].fsPath;
                        const content = fs.readFileSync(filePath, 'utf8');
                        const sourceDiagram = (0, fileImporter_js_1.parseExternalModelFile)(filePath, content);
                        webviewPanel.webview.postMessage({
                            type: 'importFile:loaded',
                            fileName: path.basename(filePath),
                            sourceDiagram
                        });
                    }
                    catch (err) {
                        webviewPanel.webview.postMessage({
                            type: 'importFile:error',
                            error: err.message
                        });
                    }
                    break;
                }
                case 'importFile:execute': {
                    try {
                        const merged = (0, fileImporter_js_1.mergeImportedObjects)(message.currentDiagram, message.sourceDiagram, message.selection);
                        isInternalUpdate = true;
                        const updatedXml = (0, ermSerializer_js_1.serializeERMXml)(merged);
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedXml);
                        await vscode.workspace.applyEdit(edit);
                        webviewPanel.webview.postMessage({
                            type: 'init',
                            diagram: merged,
                            fileName: path.basename(document.fileName)
                        });
                        webviewPanel.webview.postMessage({ type: 'importFile:done' });
                    }
                    catch (err) {
                        webviewPanel.webview.postMessage({
                            type: 'importFile:error',
                            error: err.message
                        });
                    }
                    finally {
                        isInternalUpdate = false;
                    }
                    break;
                }
                case 'importDB:browseJar': {
                    const uris = await vscode.window.showOpenDialog({
                        canSelectMany: true,
                        filters: { 'JDBC Driver JAR': ['jar'] }
                    });
                    if (uris && uris.length > 0) {
                        webviewPanel.webview.postMessage({
                            type: 'importDB:jarSelected',
                            jarPaths: uris.map(u => u.fsPath)
                        });
                    }
                    break;
                }
                case 'importDB:listSchemas': {
                    try {
                        const res = await (0, jdbcImporter_js_1.runJdbcReverseEngineer)(this.context.extensionPath, {
                            action: 'listSchemas',
                            ...message.config
                        });
                        webviewPanel.webview.postMessage({
                            type: 'importDB:schemasLoaded',
                            schemas: res.schemas || []
                        });
                    }
                    catch (err) {
                        webviewPanel.webview.postMessage({
                            type: 'importDB:error',
                            error: err.message
                        });
                    }
                    break;
                }
                case 'importDB:listObjects': {
                    try {
                        const res = await (0, jdbcImporter_js_1.runJdbcReverseEngineer)(this.context.extensionPath, {
                            action: 'listObjects',
                            ...message.config,
                            schemas: message.schemas || []
                        });
                        webviewPanel.webview.postMessage({
                            type: 'importDB:objectsLoaded',
                            tables: res.tables || [],
                            views: res.views || []
                        });
                    }
                    catch (err) {
                        webviewPanel.webview.postMessage({
                            type: 'importDB:error',
                            error: err.message
                        });
                    }
                    break;
                }
                case 'importDB:execute': {
                    try {
                        const res = await (0, jdbcImporter_js_1.runJdbcReverseEngineer)(this.context.extensionPath, {
                            action: 'importObjects',
                            ...message.config,
                            schemas: message.schemas || [],
                            selectedTables: message.selectedTables || [],
                            selectedViews: message.selectedViews || []
                        });
                        const merged = (0, jdbcImporter_js_1.mergeJdbcImportResult)(message.currentDiagram, res);
                        isInternalUpdate = true;
                        const updatedXml = (0, ermSerializer_js_1.serializeERMXml)(merged);
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedXml);
                        await vscode.workspace.applyEdit(edit);
                        webviewPanel.webview.postMessage({
                            type: 'init',
                            diagram: merged,
                            fileName: path.basename(document.fileName)
                        });
                        webviewPanel.webview.postMessage({ type: 'importDB:done' });
                    }
                    catch (err) {
                        webviewPanel.webview.postMessage({
                            type: 'importDB:error',
                            error: err.message
                        });
                    }
                    finally {
                        isInternalUpdate = false;
                    }
                    break;
                }
                case 'export:excel': {
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(document.fileName.replace(/\.(erm|erd)$/i, '_spec.xls')),
                        filters: { 'Excel Spreadsheet (.xls)': ['xls'] }
                    });
                    if (uri) {
                        const builtins = (0, excelTemplateExporter_js_1.getBuiltinTemplates)(this.context.extensionPath);
                        const customs = this.context.globalState.get('ermaster.customExcelTemplates', []);
                        const all = [...builtins, ...customs];
                        const chosen = all.find((t) => t.id === message.templateId) ||
                            all.find((t) => t.id === 'template_ko.xls') ||
                            all[0];
                        if (chosen && fs.existsSync(chosen.filePath)) {
                            try {
                                await (0, excelTemplateExporter_js_1.exportExcelFromTemplate)(this.context.extensionPath, message.diagram, chosen.filePath, uri.fsPath, Boolean(message.useLogicalNameAsSheetName), typeof message.imageDataUrl === 'string' ? message.imageDataUrl : undefined);
                                vscode.window.showInformationMessage(`Excel 명세서 저장 완료 (${chosen.id}): ${path.basename(uri.fsPath)}`);
                                break;
                            }
                            catch (err) {
                                vscode.window.showWarningMessage(`템플릿 Excel 생성 실패로 기본 XML 형식으로 저장합니다: ${err.message}`);
                            }
                        }
                        fs.writeFileSync(uri.fsPath, (0, modelExporter_js_1.generateExcelXml)(message.diagram), 'utf8');
                        vscode.window.showInformationMessage(`Excel 명세서 저장 완료: ${path.basename(uri.fsPath)}`);
                    }
                    break;
                }
                case 'export:html': {
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(document.fileName.replace(/\.(erm|erd)$/i, '_spec.html')),
                        filters: { 'HTML Document': ['html'] }
                    });
                    if (uri) {
                        fs.writeFileSync(uri.fsPath, (0, modelExporter_js_1.generateHtmlReport)(message.diagram), 'utf8');
                        vscode.window.showInformationMessage(`HTML 문서 저장 완료: ${path.basename(uri.fsPath)}`);
                    }
                    break;
                }
                case 'export:java': {
                    const folders = await vscode.window.showOpenDialog({
                        canSelectFolders: true,
                        canSelectFiles: false,
                        canSelectMany: false,
                        openLabel: 'Java 엔티티 저장 폴더 선택'
                    });
                    if (folders && folders.length > 0) {
                        const outDir = folders[0].fsPath;
                        const files = (0, modelExporter_js_1.generateJavaEntities)(message.diagram, message.options);
                        for (const f of files) {
                            fs.writeFileSync(path.join(outDir, f.fileName), f.content, 'utf8');
                        }
                        vscode.window.showInformationMessage(`Java 엔티티 ${files.length}개 생성 완료: ${outDir}`);
                    }
                    break;
                }
                case 'export:dictionary': {
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(document.fileName.replace(/\.(erm|erd)$/i, '_dictionary.csv')),
                        filters: { 'CSV': ['csv'] }
                    });
                    if (uri) {
                        fs.writeFileSync(uri.fsPath, (0, modelExporter_js_1.generateDictionaryCsv)(message.diagram), 'utf8');
                        vscode.window.showInformationMessage(`단어 사전 저장 완료: ${path.basename(uri.fsPath)}`);
                    }
                    break;
                }
                case 'export:translations': {
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(document.fileName.replace(/\.(erm|erd)$/i, '_translations.csv')),
                        filters: { 'CSV': ['csv'] }
                    });
                    if (uri) {
                        fs.writeFileSync(uri.fsPath, (0, modelExporter_js_1.generateTranslationsCsv)(message.diagram), 'utf8');
                        vscode.window.showInformationMessage(`번역 사전 저장 완료: ${path.basename(uri.fsPath)}`);
                    }
                    break;
                }
                case 'export:testData': {
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(document.fileName.replace(/\.(erm|erd)$/i, '_testdata.sql')),
                        filters: { 'SQL': ['sql'] }
                    });
                    if (uri) {
                        fs.writeFileSync(uri.fsPath, (0, modelExporter_js_1.generateTestDataSql)(message.diagram), 'utf8');
                        vscode.window.showInformationMessage(`테스트 데이터 SQL 저장 완료: ${path.basename(uri.fsPath)}`);
                    }
                    break;
                }
                case 'export:svg': {
                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(document.fileName.replace(/\.(erm|erd)$/i, '.svg')),
                        filters: { 'SVG Image': ['svg'] }
                    });
                    if (uri && message.svgContent) {
                        fs.writeFileSync(uri.fsPath, message.svgContent, 'utf8');
                        vscode.window.showInformationMessage(`SVG 이미지 저장 완료: ${path.basename(uri.fsPath)}`);
                    }
                    break;
                }
                case 'printDiagram': {
                    if (typeof message.svgContent === 'string' && message.svgContent) {
                        const title = path.basename(document.fileName);
                        const safeTitle = title.replace(/[<>&"]/g, '');
                        const orientation = message.orientation === 'portrait' ? 'portrait' : 'landscape';
                        const paperSize = message.paperSize === 'A3' ? 'A3' : 'A4';
                        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Print - ${safeTitle}</title>
  <style>
    @page { size: ${paperSize} ${orientation}; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 10px 14px; background: #1e293b; color: #f8fafc; border-radius: 8px; }
    .toolbar button { background: #3b82f6; color: #fff; border: none; border-radius: 6px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .sheet { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; overflow: auto; text-align: center; }
    svg { max-width: 100%; height: auto; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none; }
      .sheet { border: none; padding: 0; overflow: visible; }
      svg { width: 100%; max-height: 96vh; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span><strong>ERMaster</strong> — ${safeTitle}</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">${message.svgContent}</div>
  <script>window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 250); });</script>
</body>
</html>`;
                        const tmpPath = path.join(os.tmpdir(), `ermaster_print_${Date.now()}.html`);
                        fs.writeFileSync(tmpPath, html, 'utf8');
                        if (process.platform === 'win32') {
                            (0, child_process_1.exec)(`start "" "${tmpPath}"`, (err) => {
                                if (err) {
                                    vscode.window.showErrorMessage(`인쇄 창 실행 실패: ${err.message}`);
                                }
                            });
                        }
                        else if (process.platform === 'darwin') {
                            (0, child_process_1.spawn)('open', [tmpPath], { detached: true, stdio: 'ignore' }).unref();
                        }
                        else {
                            const opened = await vscode.env.openExternal(vscode.Uri.file(tmpPath));
                            if (!opened) {
                                (0, child_process_1.spawn)('xdg-open', [tmpPath], { detached: true, stdio: 'ignore' }).unref();
                            }
                        }
                    }
                    break;
                }
                case 'export:db': {
                    try {
                        const ddlSql = (0, ddlGenerator_js_1.generateDDL)(message.diagram, message.config?.dbSystem || message.diagram.db);
                        const res = await (0, jdbcImporter_js_1.runJdbcReverseEngineer)(this.context.extensionPath, {
                            action: 'executeDdl',
                            ...message.config,
                            ddlSql
                        });
                        webviewPanel.webview.postMessage({
                            type: 'exportDB:done',
                            executedCount: res.executedCount || 0
                        });
                        vscode.window.showInformationMessage(`DB 반영 완료: ${res.executedCount || 0}개 SQL 문 실행됨`);
                    }
                    catch (err) {
                        webviewPanel.webview.postMessage({
                            type: 'exportDB:error',
                            error: err.message
                        });
                    }
                    break;
                }
            }
        });
        // 외부에서 문서가 변경된 경우 Webview 갱신
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === document.uri.toString() && !isInternalUpdate) {
                sendInitialData();
            }
        });
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            viewStateSubscription.dispose();
            this.panelStates.delete(webviewPanel);
            this.panelOutlines.delete(webviewPanel);
            if (this.activePanel === webviewPanel) {
                this.activePanel = this.panelStates.keys().next().value;
            }
            this.syncPaletteView();
        });
    }
    createNewDiagram() {
        return {
            db: 'PostgreSQL',
            viewMode: 'both',
            zoom: 100,
            x: 0,
            y: 0,
            dictionary: [],
            tables: [],
            views: [],
            notes: [],
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
    }
}
exports.ERMEditorProvider = ERMEditorProvider;
//# sourceMappingURL=ermEditorProvider.js.map