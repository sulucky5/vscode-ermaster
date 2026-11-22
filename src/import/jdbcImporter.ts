import { spawn } from 'child_process';
import * as path from 'path';
import { ERDiagram, ERTable, ERView, ERRelation, ERColumn, ERIndex } from '../model/erm.types.js';

export interface JdbcConnectionConfig {
  dbSystem: string;
  driverClass: string;
  url: string;
  user: string;
  password: string;
  jarPaths: string[];
}

export async function runJdbcReverseEngineer(
  extensionPath: string,
  payload: Record<string, any>
): Promise<any> {
  const jdbcClassDir = path.join(extensionPath, 'dist', 'jdbc');

  return new Promise((resolve, reject) => {
    const child = spawn('java', ['-cp', jdbcClassDir, 'JdbcReverseEngineer'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

    child.on('error', (err) => {
      reject(new Error(`Java 실행 실패 (JDK/JRE가 설치되어 있는지 확인하세요): ${err.message}`));
    });

    child.on('close', (code) => {
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(new Error(stderr.trim() || `JDBC 프로세스가 종료 코드 ${code}로 종료되었습니다.`));
        return;
      }
      try {
        const lines = trimmed.split(/\r?\n/);
        const lastLine = lines[lines.length - 1];
        const parsed = JSON.parse(lastLine);
        if (!parsed.ok) {
          reject(new Error(parsed.error || 'JDBC 작업 중 오류가 발생했습니다.'));
          return;
        }
        resolve(parsed);
      } catch (e: any) {
        reject(new Error(`JDBC 응답 파싱 실패: ${trimmed} (${e.message})`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export function mergeJdbcImportResult(
  current: ERDiagram,
  jdbcResult: { tables: any[]; views: any[]; relations: any[] }
): ERDiagram {
  const ts = Date.now();
  const qualifiedToId = new Map<string, string>();
  const nameToId = new Map<string, string>();

  const importedTables: ERTable[] = (jdbcResult.tables || []).map((t, idx) => {
    const tableId = `jdbc_tbl_${ts}_${idx}`;
    if (t.qualifiedName) qualifiedToId.set(t.qualifiedName.toLowerCase(), tableId);
    nameToId.set(t.physicalName.toLowerCase(), tableId);

    const colNameToId = new Map<string, string>();
    const columns: ERColumn[] = (t.columns || []).map((c: any, cIdx: number) => {
      const colId = `${tableId}_col_${cIdx}`;
      colNameToId.set(c.physicalName.toLowerCase(), colId);
      return {
        id: colId,
        physicalName: c.physicalName,
        logicalName: c.logicalName || c.physicalName,
        type: c.type || 'varchar',
        length: c.length ?? undefined,
        decimal: c.decimal ?? undefined,
        primaryKey: Boolean(c.primaryKey),
        notNull: Boolean(c.notNull),
        uniqueKey: false,
        autoIncrement: Boolean(c.autoIncrement),
        defaultValue: c.defaultValue || undefined,
        description: c.description || undefined
      };
    });

    const indexes: ERIndex[] = (t.indexes || []).map((ix: any, iIdx: number) => ({
      id: `${tableId}_idx_${iIdx}`,
      name: ix.name,
      nonUnique: Boolean(ix.nonUnique),
      columns: (ix.columns || [])
        .map((ic: any) => ({
          columnId: colNameToId.get(String(ic.columnName).toLowerCase()) || '',
          order: ic.order === 'DESC' ? 'DESC' : 'ASC'
        }))
        .filter((ic: any) => Boolean(ic.columnId))
    }));

    return {
      id: tableId,
      physicalName: t.physicalName,
      logicalName: t.logicalName || t.physicalName,
      description: t.description || '',
      x: 80 + (idx % 4) * 280,
      y: 80 + Math.floor(idx / 4) * 240,
      width: 230,
      height: 140,
      columns,
      indexes,
      complexUniqueKeys: [],
      tableProperties: t.schema ? { schema: t.schema } : undefined
    };
  });

  const importedViews: ERView[] = (jdbcResult.views || []).map((v, idx) => ({
    id: `jdbc_view_${ts}_${idx}`,
    physicalName: v.physicalName,
    logicalName: v.logicalName || v.physicalName,
    description: v.description || '',
    sql: '',
    schema: v.schema || undefined,
    x: 80 + (idx % 4) * 260,
    y: 420 + Math.floor(idx / 4) * 200,
    width: 220,
    height: 120,
    columns: (v.columns || []).map((c: any, cIdx: number) => ({
      id: `jdbc_vcol_${ts}_${idx}_${cIdx}`,
      physicalName: c.physicalName,
      logicalName: c.logicalName || c.physicalName,
      type: c.type || 'varchar',
      length: c.length ?? undefined,
      primaryKey: false,
      notNull: false,
      uniqueKey: false,
      autoIncrement: false
    }))
  }));

  const seenRels = new Set<string>();
  const importedRelations: ERRelation[] = [];
  for (let i = 0; i < (jdbcResult.relations || []).length; i++) {
    const r = jdbcResult.relations[i];
    const sourceId =
      qualifiedToId.get(String(r.sourceQualified || '').toLowerCase()) ||
      nameToId.get(String(r.sourceTable || '').toLowerCase());
    const targetId =
      qualifiedToId.get(String(r.targetQualified || '').toLowerCase()) ||
      nameToId.get(String(r.targetTable || '').toLowerCase());
    if (!sourceId || !targetId) continue;

    const dedupKey = `${sourceId}->${targetId}:${r.name || ''}`;
    if (seenRels.has(dedupKey)) continue;
    seenRels.add(dedupKey);

    importedRelations.push({
      id: `jdbc_rel_${ts}_${i}`,
      name: r.name || '',
      sourceTableId: sourceId,
      targetTableId: targetId,
      parentCardinality: '1',
      childCardinality: '0..n',
      referenceForPK: false,
      onDeleteAction: r.onDeleteAction || 'RESTRICT',
      onUpdateAction: r.onUpdateAction || 'RESTRICT'
    });
  }

  return {
    ...current,
    tables: [...current.tables, ...importedTables],
    views: [...(current.views || []), ...importedViews],
    relations: [...current.relations, ...importedRelations]
  };
}
