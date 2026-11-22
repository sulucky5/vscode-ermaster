import {
  ERDiagram,
  ERTable,
  ERColumn,
  ERView,
  ERRelation,
  ERSequence,
  ERTrigger,
  ERTablespace,
  ColumnGroup,
  ERNote
} from '../model/erm.types.js';
import { parseERMXml } from '../parser/ermParser.js';

export interface ImportSelection {
  tableIds: string[];
  viewIds: string[];
  noteIds: string[];
  sequenceIds: string[];
  triggerIds: string[];
  tablespaceIds: string[];
  columnGroupIds: string[];
}

export function parseExternalModelFile(fileName: string, content: string): ERDiagram {
  if (fileName.toLowerCase().endsWith('.sql') || fileName.toLowerCase().endsWith('.ddl')) {
    return parseSqlDdlToDiagram(content);
  }
  return parseERMXml(content);
}

export function parseSqlDdlToDiagram(sql: string): ERDiagram {
  const tables: ERTable[] = [];
  const views: ERView[] = [];
  const sequences: ERSequence[] = [];
  const relations: ERRelation[] = [];

  const cleaned = sql
    .replace(/--[^\r\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const statements = cleaned.split(';').map(s => s.trim()).filter(Boolean);
  let colCounter = 0;

  for (const stmt of statements) {
    // CREATE TABLE
    const createTableMatch = stmt.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]+)\)$/i);
    if (createTableMatch) {
      const rawName = createTableMatch[1].replace(/[`"\[\]]/g, '');
      const parts = rawName.split('.');
      const physicalName = parts[parts.length - 1];
      const schema = parts.length > 1 ? parts[0] : undefined;
      const body = createTableMatch[2];

      const defs = splitTopLevelCommas(body);
      const columns: ERColumn[] = [];
      const pkNames = new Set<string>();

      for (const def of defs) {
        const trimmed = def.trim();
        if (!trimmed) continue;

        const pkMatch = trimmed.match(/^(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          pkMatch[1].split(',').forEach(c => pkNames.add(c.trim().replace(/[`"\[\]]/g, '')));
          continue;
        }

        const fkMatch = trimmed.match(/^(?:CONSTRAINT\s+(\S+)\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
        if (fkMatch) {
          const fkName = fkMatch[1] ? fkMatch[1].replace(/[`"\[\]]/g, '') : '';
          const refTableName = fkMatch[3].replace(/[`"\[\]]/g, '').split('.').pop() || '';
          relations.push({
            id: `rel_${Date.now()}_${relations.length}`,
            name: fkName,
            sourceTableId: refTableName,
            targetTableId: physicalName,
            parentCardinality: '1',
            childCardinality: '0..n',
            referenceForPK: false
          });
          continue;
        }

        if (/^(?:CONSTRAINT|UNIQUE|INDEX|KEY|CHECK)\b/i.test(trimmed)) continue;

        const colMatch = trimmed.match(/^([`"\[\]a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)(?:\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\))?([\s\S]*)$/i);
        if (colMatch) {
          const colName = colMatch[1].replace(/[`"\[\]]/g, '');
          const colType = colMatch[2].toLowerCase();
          const length = colMatch[3] ? Number(colMatch[3]) : undefined;
          const decimal = colMatch[4] ? Number(colMatch[4]) : undefined;
          const rest = colMatch[5] || '';

          const isPk = /\bPRIMARY\s+KEY\b/i.test(rest);
          const isNotNull = isPk || /\bNOT\s+NULL\b/i.test(rest);
          const isUnique = /\bUNIQUE\b/i.test(rest);
          const isAutoInc = /\bAUTO_INCREMENT\b|\bSERIAL\b|\bIDENTITY\b/i.test(rest) || colType === 'serial' || colType === 'bigserial';

          columns.push({
            id: `sql_col_${colCounter++}`,
            physicalName: colName,
            logicalName: colName,
            type: colType === 'serial' ? 'integer' : colType === 'bigserial' ? 'bigint' : colType,
            length,
            decimal,
            primaryKey: isPk,
            notNull: isNotNull,
            uniqueKey: isUnique,
            autoIncrement: isAutoInc
          });
        }
      }

      for (const col of columns) {
        if (pkNames.has(col.physicalName)) {
          col.primaryKey = true;
          col.notNull = true;
        }
      }

      const idx = tables.length;
      tables.push({
        id: `sql_tbl_${idx}`,
        physicalName,
        logicalName: physicalName,
        description: '',
        x: 80 + (idx % 4) * 280,
        y: 80 + Math.floor(idx / 4) * 240,
        width: 230,
        height: 140,
        columns,
        indexes: [],
        complexUniqueKeys: [],
        tableProperties: schema ? { schema } : undefined
      });
      continue;
    }

    // CREATE VIEW
    const createViewMatch = stmt.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([^\s(]+)\s+AS\s+([\s\S]+)$/i);
    if (createViewMatch) {
      const rawName = createViewMatch[1].replace(/[`"\[\]]/g, '');
      const parts = rawName.split('.');
      const physicalName = parts[parts.length - 1];
      const schema = parts.length > 1 ? parts[0] : undefined;
      const idx = views.length;
      views.push({
        id: `sql_view_${idx}`,
        physicalName,
        logicalName: physicalName,
        description: '',
        sql: createViewMatch[2].trim(),
        schema,
        x: 100 + idx * 260,
        y: 420,
        width: 220,
        height: 120,
        columns: []
      });
      continue;
    }

    // CREATE SEQUENCE
    const createSeqMatch = stmt.match(/^CREATE\s+SEQUENCE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s;]+)/i);
    if (createSeqMatch) {
      const rawName = createSeqMatch[1].replace(/[`"\[\]]/g, '');
      const parts = rawName.split('.');
      const name = parts[parts.length - 1];
      const schema = parts.length > 1 ? parts[0] : undefined;
      sequences.push({ id: `sql_seq_${sequences.length}`, name, schema });
      continue;
    }

    // ALTER TABLE ... FOREIGN KEY
    const alterFkMatch = stmt.match(/^ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+(?:CONSTRAINT\s+(\S+)\s+)?FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([^\s(]+)/i);
    if (alterFkMatch) {
      const targetName = alterFkMatch[1].replace(/[`"\[\]]/g, '').split('.').pop() || '';
      const fkName = alterFkMatch[2] ? alterFkMatch[2].replace(/[`"\[\]]/g, '') : '';
      const sourceName = alterFkMatch[3].replace(/[`"\[\]]/g, '').split('.').pop() || '';
      relations.push({
        id: `rel_${Date.now()}_${relations.length}`,
        name: fkName,
        sourceTableId: sourceName,
        targetTableId: targetName,
        parentCardinality: '1',
        childCardinality: '0..n',
        referenceForPK: false
      });
    }
  }

  // Resolve relation table names -> IDs
  const tableByName = new Map(tables.map(t => [t.physicalName.toLowerCase(), t.id]));
  const resolvedRelations = relations
    .map(r => ({
      ...r,
      sourceTableId: tableByName.get(r.sourceTableId.toLowerCase()) || r.sourceTableId,
      targetTableId: tableByName.get(r.targetTableId.toLowerCase()) || r.targetTableId
    }))
    .filter(r => tables.some(t => t.id === r.sourceTableId) && tables.some(t => t.id === r.targetTableId));

  return {
    db: 'PostgreSQL',
    viewMode: 'both',
    dictionary: [],
    tables,
    views,
    notes: [],
    noteConnections: [],
    images: [],
    relations: resolvedRelations,
    categories: [],
    columnGroups: [],
    sequences,
    triggers: [],
    tablespaces: [],
    testDataList: []
  };
}

function splitTopLevelCommas(str: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current);
  return result;
}

export function mergeImportedObjects(
  current: ERDiagram,
  source: ERDiagram,
  selection: ImportSelection
): ERDiagram {
  const ts = Date.now();
  const tableIdMap = new Map<string, string>();
  const offsetX = current.tables.length > 0 ? 60 : 0;
  const offsetY = current.tables.length > 0 ? 60 : 0;

  const importedTables: ERTable[] = source.tables
    .filter(t => selection.tableIds.includes(t.id))
    .map((t, idx) => {
      const newId = `imp_tbl_${ts}_${idx}`;
      tableIdMap.set(t.id, newId);
      return {
        ...t,
        id: newId,
        x: t.x + offsetX,
        y: t.y + offsetY,
        columns: t.columns.map((c, cIdx) => ({ ...c, id: `${newId}_col_${cIdx}` }))
      };
    });

  const importedViews: ERView[] = (source.views || [])
    .filter(v => selection.viewIds.includes(v.id))
    .map((v, idx) => ({
      ...v,
      id: `imp_view_${ts}_${idx}`,
      x: v.x + offsetX,
      y: v.y + offsetY
    }));

  const importedNotes: ERNote[] = (source.notes || [])
    .filter(n => selection.noteIds.includes(n.id))
    .map((n, idx) => ({
      ...n,
      id: `imp_note_${ts}_${idx}`,
      x: n.x + offsetX,
      y: n.y + offsetY
    }));

  const importedRelations: ERRelation[] = (source.relations || [])
    .filter(r => tableIdMap.has(r.sourceTableId) && tableIdMap.has(r.targetTableId))
    .map((r, idx) => ({
      ...r,
      id: `imp_rel_${ts}_${idx}`,
      sourceTableId: tableIdMap.get(r.sourceTableId)!,
      targetTableId: tableIdMap.get(r.targetTableId)!
    }));

  const importedSequences: ERSequence[] = (source.sequences || [])
    .filter(s => selection.sequenceIds.includes(s.id))
    .map((s, idx) => ({ ...s, id: `imp_seq_${ts}_${idx}` }));

  const importedTriggers: ERTrigger[] = (source.triggers || [])
    .filter(t => selection.triggerIds.includes(t.id))
    .map((t, idx) => ({ ...t, id: `imp_trg_${ts}_${idx}` }));

  const importedTablespaces: ERTablespace[] = (source.tablespaces || [])
    .filter(t => selection.tablespaceIds.includes(t.id))
    .map((t, idx) => ({ ...t, id: `imp_ts_${ts}_${idx}` }));

  const importedColumnGroups: ColumnGroup[] = (source.columnGroups || [])
    .filter(g => selection.columnGroupIds.includes(g.id))
    .map((g, idx) => ({ ...g, id: `imp_cg_${ts}_${idx}` }));

  return {
    ...current,
    tables: [...current.tables, ...importedTables],
    views: [...(current.views || []), ...importedViews],
    notes: [...current.notes, ...importedNotes],
    relations: [...current.relations, ...importedRelations],
    sequences: [...(current.sequences || []), ...importedSequences],
    triggers: [...(current.triggers || []), ...importedTriggers],
    tablespaces: [...(current.tablespaces || []), ...importedTablespaces],
    columnGroups: [...(current.columnGroups || []), ...importedColumnGroups]
  };
}
