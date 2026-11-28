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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ermEditorProvider_js_1 = require("./editor/ermEditorProvider.js");
const paletteViewProvider_js_1 = require("./editor/paletteViewProvider.js");
const ermSerializer_js_1 = require("./parser/ermSerializer.js");
function activate(context) {
    // 1. Primary Side Bar Views & Custom Editor Provider 등록
    let editorProvider;
    const handleSidebarAction = async (action) => {
        if (action.action === 'setLanguage' && typeof action.value === 'string') {
            await vscode.workspace.getConfiguration('ermaster').update('language', action.value, vscode.ConfigurationTarget.Global);
            editorProvider?.broadcastLanguage((0, paletteViewProvider_js_1.resolveUiLanguage)());
            return;
        }
        editorProvider?.dispatchSidebarAction(action);
    };
    const paletteViewProvider = new paletteViewProvider_js_1.PaletteViewProvider(context, handleSidebarAction, 'palette');
    const viewSettingsProvider = new paletteViewProvider_js_1.PaletteViewProvider(context, handleSidebarAction, 'view');
    const outlineViewProvider = new paletteViewProvider_js_1.OutlineViewProvider(context, handleSidebarAction);
    editorProvider = new ermEditorProvider_js_1.ERMEditorProvider(context, [paletteViewProvider, viewSettingsProvider], outlineViewProvider);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(paletteViewProvider_js_1.PaletteViewProvider.viewType, paletteViewProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }), vscode.window.registerWebviewViewProvider('ermaster.viewView', viewSettingsProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }), vscode.window.registerWebviewViewProvider(paletteViewProvider_js_1.OutlineViewProvider.viewType, outlineViewProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }), vscode.window.registerCustomEditorProvider(ermEditorProvider_js_1.ERMEditorProvider.viewType, editorProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
    }));
    // 2. 새 ERD 생성 명령어
    const newDiagramCmd = vscode.commands.registerCommand('ermaster.newDiagram', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const defaultUri = workspaceFolders && workspaceFolders.length > 0
            ? vscode.Uri.joinPath(workspaceFolders[0].uri, 'untitled.erm')
            : vscode.Uri.file('untitled.erm');
        const uri = await vscode.window.showSaveDialog({
            defaultUri,
            filters: { 'ERMaster Files': ['erm', 'erd'] }
        });
        if (uri) {
            const initialXml = (0, ermSerializer_js_1.serializeERMXml)({
                db: 'PostgreSQL',
                viewMode: 'both',
                zoom: 100,
                x: 0,
                y: 0,
                dictionary: [],
                tables: [
                    {
                        id: '0',
                        physicalName: 'users',
                        logicalName: '사용자',
                        description: '사용자 기본 정보',
                        x: 100,
                        y: 100,
                        width: 220,
                        height: 140,
                        columns: [
                            {
                                id: '0',
                                physicalName: 'id',
                                logicalName: '사용자ID',
                                type: 'bigint',
                                primaryKey: true,
                                notNull: true,
                                uniqueKey: false,
                                autoIncrement: true
                            },
                            {
                                id: '1',
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
                                id: '2',
                                physicalName: 'created_at',
                                logicalName: '생성일시',
                                type: 'timestamp',
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
                notes: [
                    {
                        id: '1',
                        text: 'ERMaster for VS Code\n새 다이어그램이 생성되었습니다.',
                        x: 400,
                        y: 100,
                        width: 200,
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
            });
            await vscode.workspace.fs.writeFile(uri, Buffer.from(initialXml, 'utf8'));
            await vscode.commands.executeCommand('vscode.openWith', uri, ermEditorProvider_js_1.ERMEditorProvider.viewType);
        }
    });
    context.subscriptions.push(newDiagramCmd, vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('ermaster.language')) {
            editorProvider?.broadcastLanguage((0, paletteViewProvider_js_1.resolveUiLanguage)());
        }
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map