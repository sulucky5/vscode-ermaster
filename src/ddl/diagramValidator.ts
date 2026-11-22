import { ERDiagram, ERColumn } from '../model/erm.types.js';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  category: 'Table' | 'Column' | 'View' | 'Index' | 'Relation' | 'Sequence' | 'Trigger' | 'Tablespace' | 'Diagram';
  targetName: string;
  message: string;
}

const RESERVED_WORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
  'TABLE', 'VIEW', 'INDEX', 'SEQUENCE', 'TRIGGER', 'USER', 'ORDER', 'GROUP', 'BY',
  'HAVING', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT',
  'NULL', 'TRUE', 'FALSE', 'DEFAULT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'CHECK', 'CONSTRAINT', 'VALUES', 'INTO', 'SET', 'BEGIN', 'END', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'EXISTS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'UNION', 'ALL',
  'DISTINCT', 'TOP', 'LIMIT', 'OFFSET', 'DESC', 'ASC', 'GRANT', 'REVOKE', 'COMMIT',
  'ROLLBACK', 'SESSION', 'DATE', 'TIME', 'TIMESTAMP', 'LEVEL', 'NUMBER', 'COMMENT'
]);

export function validateDiagram(diagram: ERDiagram, targetDb?: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const db = (targetDb || diagram.db || 'PostgreSQL').toUpperCase();
  const groupMap = new Map((diagram.columnGroups || []).map(g => [g.id, g]));

  // 1. Duplicate physical names across tables & views
  const objectNames = new Map<string, string>();
  const registerObjectName = (rawName: string, kind: 'Table' | 'View' | 'Sequence' | 'Trigger' | 'Tablespace') => {
    const name = (rawName || '').trim().toUpperCase();
    if (!name) return;
    if (objectNames.has(name)) {
      issues.push({
        severity: 'error',
        category: kind,
        targetName: rawName,
        message: `물리명 '${rawName}'이(가) 다른 객체(${objectNames.get(name)})와 중복됩니다.`
      });
    } else {
      objectNames.set(name, `${kind}:${rawName}`);
    }
  };

  // 2. Tables & Columns & Indexes
  for (const table of diagram.tables) {
    const tName = (table.physicalName || '').trim();
    if (!tName) {
      issues.push({
        severity: 'error',
        category: 'Table',
        targetName: table.logicalName || table.id,
        message: '테이블의 물리명이 입력되지 않았습니다.'
      });
    } else {
      registerObjectName(tName, 'Table');
      if (RESERVED_WORDS.has(tName.toUpperCase())) {
        issues.push({
          severity: 'warning',
          category: 'Table',
          targetName: tName,
          message: `테이블명 '${tName}'은(는) SQL 예약어입니다.`
        });
      }
    }

    const allColumns: ERColumn[] = [...table.columns];
    for (const cgId of table.columnGroupIds || []) {
      const g = groupMap.get(cgId);
      if (g) allColumns.push(...g.columns);
    }

    if (allColumns.length === 0) {
      issues.push({
        severity: 'error',
        category: 'Table',
        targetName: tName || table.logicalName || table.id,
        message: '테이블에 컬럼이 하나도 없습니다.'
      });
    }

    const colNames = new Set<string>();
    for (const col of allColumns) {
      const cName = (col.physicalName || '').trim();
      if (!cName) {
        issues.push({
          severity: 'error',
          category: 'Column',
          targetName: `${tName || table.id}.${col.logicalName || col.id}`,
          message: '컬럼의 물리명이 입력되지 않았습니다.'
        });
      } else {
        const upper = cName.toUpperCase();
        if (colNames.has(upper)) {
          issues.push({
            severity: 'error',
            category: 'Column',
            targetName: `${tName}.${cName}`,
            message: `테이블 '${tName}' 내에 컬럼명 '${cName}'이(가) 중복됩니다.`
          });
        }
        colNames.add(upper);

        if (RESERVED_WORDS.has(upper)) {
          issues.push({
            severity: 'warning',
            category: 'Column',
            targetName: `${tName}.${cName}`,
            message: `컬럼명 '${cName}'은(는) SQL 예약어입니다.`
          });
        }
      }

      if (!col.type || !col.type.trim()) {
        issues.push({
          severity: 'error',
          category: 'Column',
          targetName: `${tName}.${cName || col.id}`,
          message: '컬럼의 데이터 타입이 지정되지 않았습니다.'
        });
      }
    }

    // Indexes
    for (const idx of table.indexes || []) {
      if (!idx.name || !idx.name.trim()) {
        issues.push({
          severity: 'error',
          category: 'Index',
          targetName: tName,
          message: `테이블 '${tName}'의 인덱스 이름이 비어 있습니다.`
        });
      }
      if (!idx.columns || idx.columns.length === 0) {
        issues.push({
          severity: 'error',
          category: 'Index',
          targetName: `${tName}.${idx.name || '(unnamed)'}`,
          message: '인덱스에 대상 컬럼이 지정되지 않았습니다.'
        });
      }
      if (idx.fullText && !db.includes('MYSQL')) {
        issues.push({
          severity: 'warning',
          category: 'Index',
          targetName: `${tName}.${idx.name}`,
          message: `FULLTEXT 인덱스는 ${targetDb || diagram.db}에서 지원되지 않을 수 있습니다.`
        });
      }
    }
  }

  // 3. Views
  for (const view of diagram.views || []) {
    const vName = (view.physicalName || '').trim();
    if (!vName) {
      issues.push({
        severity: 'error',
        category: 'View',
        targetName: view.logicalName || view.id,
        message: '뷰의 물리명이 입력되지 않았습니다.'
      });
    } else {
      registerObjectName(vName, 'View');
      if (RESERVED_WORDS.has(vName.toUpperCase())) {
        issues.push({
          severity: 'warning',
          category: 'View',
          targetName: vName,
          message: `뷰명 '${vName}'은(는) SQL 예약어입니다.`
        });
      }
    }

    if (!view.sql || !view.sql.trim()) {
      issues.push({
        severity: 'error',
        category: 'View',
        targetName: vName || view.id,
        message: '뷰의 SQL 정의가 비어 있습니다.'
      });
    }
  }

  // 4. Sequences, Triggers, Tablespaces
  for (const seq of diagram.sequences || []) {
    if (!seq.name || !seq.name.trim()) {
      issues.push({ severity: 'error', category: 'Sequence', targetName: seq.id, message: '시퀀스 이름이 비어 있습니다.' });
    } else {
      registerObjectName(seq.name, 'Sequence');
    }
  }

  for (const trg of diagram.triggers || []) {
    if (!trg.name || !trg.name.trim()) {
      issues.push({ severity: 'error', category: 'Trigger', targetName: trg.id, message: '트리거 이름이 비어 있습니다.' });
    } else {
      registerObjectName(trg.name, 'Trigger');
    }
    if (!trg.sql || !trg.sql.trim()) {
      issues.push({ severity: 'warning', category: 'Trigger', targetName: trg.name || trg.id, message: '트리거 SQL 본문이 비어 있습니다.' });
    }
  }

  for (const ts of diagram.tablespaces || []) {
    if (!ts.name || !ts.name.trim()) {
      issues.push({ severity: 'error', category: 'Tablespace', targetName: ts.id, message: '테이블스페이스 이름이 비어 있습니다.' });
    } else {
      registerObjectName(ts.name, 'Tablespace');
    }
  }

  // 5. Relations (FK mapping)
  for (const rel of diagram.relations) {
    const source = diagram.tables.find(t => t.id === rel.sourceTableId);
    const target = diagram.tables.find(t => t.id === rel.targetTableId);
    if (!source || !target) {
      issues.push({
        severity: 'error',
        category: 'Relation',
        targetName: rel.name || rel.id,
        message: '관계선의 부모 또는 자식 테이블을 찾을 수 없습니다.'
      });
      continue;
    }

    const srcCount = rel.sourceColumnIds?.length || 0;
    const tgtCount = rel.targetColumnIds?.length || 0;
    if ((srcCount > 0 || tgtCount > 0) && srcCount !== tgtCount) {
      issues.push({
        severity: 'error',
        category: 'Relation',
        targetName: rel.name || `${target.physicalName} -> ${source.physicalName}`,
        message: `외래키 매핑 컬럼 수가 일치하지 않습니다 (부모 ${srcCount}개, 자식 ${tgtCount}개).`
      });
    } else if (srcCount === 0 && !source.columns.some(c => c.primaryKey)) {
      issues.push({
        severity: 'warning',
        category: 'Relation',
        targetName: rel.name || `${target.physicalName} -> ${source.physicalName}`,
        message: `부모 테이블 '${source.physicalName}'에 기본키(PK)가 없어 FK 자동 매핑이 부정확할 수 있습니다.`
      });
    }
  }

  return issues;
}
