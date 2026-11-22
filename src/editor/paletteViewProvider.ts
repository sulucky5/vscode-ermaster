import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface PaletteState {
  hasActiveEditor: boolean;
  fileName?: string;
  activeTool: string;
  relationSourceId: string | null;
  lockEdit: boolean;
  db?: string;
  viewMode?: 'logical' | 'physical' | 'both';
  notation?: string;
  tableStyle?: string;
  notationLevel?: string;
  capital?: boolean;
  edgeRoutingType?: string;
  isOutlineOpen?: boolean;
  selectedCount?: number;
}

export interface OutlineData {
  hasActiveEditor: boolean;
  tables: Array<{
    id: string;
    physicalName: string;
    logicalName?: string;
    columns: Array<{
      id: string;
      physicalName: string;
      logicalName?: string;
      primaryKey?: boolean;
    }>;
  }>;
  views: Array<{
    id: string;
    physicalName: string;
    logicalName?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
  }>;
  categorySettings?: {
    selectedCategoryId?: string | null;
    freeLayout?: boolean;
    showReferredTables?: boolean;
  };
  notes: Array<{
    id: string;
    text: string;
  }>;
  sequencesCount: number;
  triggersCount: number;
  tablespacesCount: number;
  columnGroupsCount: number;
}

export interface SidebarActionMessage {
  type: 'sidebarAction';
  action: string;
  value?: unknown;
}

export function buildWebviewHtml(
  webview: vscode.Webview,
  extensionPath: string,
  viewMode: 'editor' | 'palette' | 'view' | 'menu' | 'outline'
): string {
  const webviewDist = path.join(extensionPath, 'dist', 'webview');
  const indexPath = path.join(webviewDist, 'index.html');

  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(/(src|href)="(\/assets\/[^"]+)"/g, (_, attr, src) => {
      const resourceUri = webview.asWebviewUri(
        vscode.Uri.file(path.join(webviewDist, src.replace(/^\//, '')))
      );
      return `${attr}="${resourceUri}"`;
    });
    html = html.replace(
      '</head>',
      `<script>window.__ERMASTER_VIEW__ = "${viewMode}";</script></head>`
    );
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

export class PaletteViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ermaster.paletteView';

  private view?: vscode.WebviewView;
  private currentState: PaletteState = {
    hasActiveEditor: false,
    activeTool: 'select',
    relationSourceId: null,
    lockEdit: false
  };

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly onAction: (action: SidebarActionMessage) => void,
    private readonly webviewMode: 'palette' | 'view' | 'menu' = 'palette'
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))
      ]
    };

    webviewView.webview.html = buildWebviewHtml(
      webviewView.webview,
      this.context.extensionPath,
      this.webviewMode
    );

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

  public updateState(state: PaletteState): void {
    this.currentState = state;
    this.postState();
  }

  private postState(): void {
    if (this.view) {
      this.view.webview.postMessage({
        type: 'paletteState',
        ...this.currentState
      });
    }
  }
}

export class OutlineViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ermaster.outlineView';

  private view?: vscode.WebviewView;
  private currentData: OutlineData = {
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

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly onAction: (action: SidebarActionMessage) => void
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))
      ]
    };

    webviewView.webview.html = buildWebviewHtml(
      webviewView.webview,
      this.context.extensionPath,
      'outline'
    );

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

  public updateData(data: OutlineData): void {
    this.currentData = data;
    this.postData();
  }

  private postData(): void {
    if (this.view) {
      this.view.webview.postMessage({
        type: 'outlineData',
        ...this.currentData
      });
    }
  }
}
