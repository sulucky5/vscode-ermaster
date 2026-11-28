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
exports.OutlineViewProvider = exports.PaletteViewProvider = void 0;
exports.resolveUiLanguage = resolveUiLanguage;
exports.buildWebviewHtml = buildWebviewHtml;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function resolveUiLanguage() {
    const configured = vscode.workspace.getConfiguration('ermaster').get('language', 'auto');
    if (configured === 'ko' || configured === 'en' || configured === 'ja') {
        return configured;
    }
    const envLang = (vscode.env.language || 'en').toLowerCase();
    if (envLang.startsWith('ko'))
        return 'ko';
    if (envLang.startsWith('ja'))
        return 'ja';
    return 'en';
}
function buildWebviewHtml(webview, extensionPath, viewMode) {
    const webviewDist = path.join(extensionPath, 'dist', 'webview');
    const indexPath = path.join(webviewDist, 'index.html');
    const lang = resolveUiLanguage();
    if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        html = html.replace(/(src|href)="(\/assets\/[^"]+)"/g, (_, attr, src) => {
            const resourceUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewDist, src.replace(/^\//, ''))));
            return `${attr}="${resourceUri}"`;
        });
        html = html.replace('</head>', `<script>window.__ERMASTER_VIEW__ = "${viewMode}";window.__ERMASTER_LANG__ = "${lang}";</script></head>`);
        return html;
    }
    return `<!DOCTYPE html>
  <html>
    <body>
      <div style="color: red; padding: 20px;">
        Webview bundle not found. Please run 'npm run build' in vscode-ermaster.
      </div>
    </body>
  </html>`;
}
class PaletteViewProvider {
    context;
    onAction;
    webviewMode;
    static viewType = 'ermaster.paletteView';
    view;
    currentState = {
        hasActiveEditor: false,
        activeTool: 'select',
        relationSourceId: null,
        lockEdit: false
    };
    constructor(context, onAction, webviewMode = 'palette') {
        this.context = context;
        this.onAction = onAction;
        this.webviewMode = webviewMode;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))
            ]
        };
        webviewView.webview.html = buildWebviewHtml(webviewView.webview, this.context.extensionPath, this.webviewMode);
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.type) {
                case 'ready':
                    this.postState();
                    break;
                case 'selectTool':
                    if (typeof message.tool === 'string') {
                        this.onAction({
                            type: 'sidebarAction',
                            action: 'setActiveTool',
                            value: message.tool
                        });
                    }
                    break;
                case 'sidebarAction':
                    if (typeof message.action === 'string') {
                        this.onAction({
                            type: 'sidebarAction',
                            action: message.action,
                            value: message.value
                        });
                    }
                    break;
            }
        });
        webviewView.onDidDispose(() => {
            if (this.view === webviewView) {
                this.view = undefined;
            }
        });
    }
    updateState(state) {
        this.currentState = state;
        this.postState();
    }
    postLanguage(lang) {
        if (this.view) {
            this.view.webview.postMessage({ type: 'setLanguage', lang });
        }
    }
    postState() {
        if (this.view) {
            this.view.webview.postMessage({
                type: 'paletteState',
                ...this.currentState
            });
        }
    }
}
exports.PaletteViewProvider = PaletteViewProvider;
class OutlineViewProvider {
    context;
    onAction;
    static viewType = 'ermaster.outlineView';
    view;
    currentData = {
        hasActiveEditor: false,
        tables: [],
        views: [],
        categories: [],
        notes: [],
        sequencesCount: 0,
        triggersCount: 0,
        tablespacesCount: 0,
        columnGroupsCount: 0
    };
    constructor(context, onAction) {
        this.context = context;
        this.onAction = onAction;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))
            ]
        };
        webviewView.webview.html = buildWebviewHtml(webviewView.webview, this.context.extensionPath, 'outline');
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.type) {
                case 'ready':
                    this.postData();
                    break;
                case 'sidebarAction':
                    if (typeof message.action === 'string') {
                        this.onAction({
                            type: 'sidebarAction',
                            action: message.action,
                            value: message.value
                        });
                    }
                    break;
            }
        });
        webviewView.onDidDispose(() => {
            if (this.view === webviewView) {
                this.view = undefined;
            }
        });
    }
    updateData(data) {
        this.currentData = data;
        this.postData();
    }
    postLanguage(lang) {
        if (this.view) {
            this.view.webview.postMessage({ type: 'setLanguage', lang });
        }
    }
    postData() {
        if (this.view) {
            this.view.webview.postMessage({
                type: 'outlineData',
                ...this.currentData
            });
        }
    }
}
exports.OutlineViewProvider = OutlineViewProvider;
//# sourceMappingURL=paletteViewProvider.js.map