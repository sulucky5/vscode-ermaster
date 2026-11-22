import * as vscode from 'vscode';
import { ERMEditorProvider } from './editor/ermEditorProvider.js';
import { OutlineViewProvider, PaletteViewProvider } from './editor/paletteViewProvider.js';
import { serializeERMXml } from './parser/ermSerializer.js';

export function activate(context: vscode.ExtensionContext) {
  // 1. Primary Side Bar Views & Custom Editor Provider 등록
  let editorProvider: ERMEditorProvider;
  const handleSidebarAction = (action: { type: 'sidebarAction'; action: string; value?: unknown }) => {
    editorProvider?.dispatchSidebarAction(action);
  };
  const paletteViewProvider = new PaletteViewProvider(context, handleSidebarAction, 'palette');
  const viewSettingsProvider = new PaletteViewProvider(context, handleSidebarAction, 'view');
  const outlineViewProvider = new OutlineViewProvider(context, handleSidebarAction);
  editorProvider = new ERMEditorProvider(
    context,
    [paletteViewProvider, viewSettingsProvider],
    outlineViewProvider
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PaletteViewProvider.viewType,
      paletteViewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    ),
    vscode.window.registerWebviewViewProvider(
      'ermaster.viewView',
      viewSettingsProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    ),
    vscode.window.registerWebviewViewProvider(
      OutlineViewProvider.viewType,
      outlineViewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    ),
    vscode.window.registerCustomEditorProvider(
      ERMEditorProvider.viewType,
      editorProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );

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
      const initialXml = serializeERMXml({
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
      await vscode.commands.executeCommand('vscode.openWith', uri, ERMEditorProvider.viewType);
    }
  });

  context.subscriptions.push(newDiagramCmd);
}

export function deactivate() {}
