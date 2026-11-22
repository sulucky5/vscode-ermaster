import { ERDiagram, ERColumn, ERTable } from '../model/erm.types.js';

function escXml(s: string = ''): string {
  return String(s).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function escHtml(s: string = ''): string {
  return String(s).replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

// 1. Excel (SpreadsheetML .xls with multiple styled worksheets)
export function generateExcelXml(diagram: ERDiagram): string {
  const row = (cells: { val: string | number; style?: string }[]) =>
    `<Row>${cells
      .map(
        (c) =>
          `<Cell${c.style ? ` ss:StyleID="${c.style}"` : ''}><Data ss:Type="${
            typeof c.val === 'number' ? 'Number' : 'String'
          }">${escXml(String(c.val))}</Data></Cell>`
      )
      .join('')}</Row>`;

  const indexRows = [
    row([
      { val: 'No', style: 'Header' },
      { val: '물리명', style: 'Header' },
      { val: '논리명', style: 'Header' },
      { val: '스키마', style: 'Header' },
      { val: '컬럼 수', style: 'Header' },
      { val: '설명', style: 'Header' }
    ]),
    ...diagram.tables.map((t, i) =>
      row([
        { val: i + 1 },
        { val: t.physicalName },
        { val: t.logicalName },
        { val: t.tableProperties?.schema || '' },
        { val: t.columns.length },
        { val: t.description || '' }
      ])
    )
  ].join('\n');

  const tableDefRows: string[] = [];
  for (const t of diagram.tables) {
    tableDefRows.push(
      row([
        { val: `테이블: ${t.physicalName} (${t.logicalName})`, style: 'Section' },
        { val: t.description || '', style: 'Section' }
      ])
    );
    tableDefRows.push(
      row([
        { val: '컬럼 물리명', style: 'Header' },
        { val: '컬럼 논리명', style: 'Header' },
        { val: '데이터 타입', style: 'Header' },
        { val: '길이', style: 'Header' },
        { val: 'PK', style: 'Header' },
        { val: 'NN', style: 'Header' },
        { val: 'UK', style: 'Header' },
        { val: 'AI', style: 'Header' },
        { val: '기본값', style: 'Header' },
        { val: '설명', style: 'Header' }
      ])
    );
    for (const c of t.columns) {
      tableDefRows.push(
        row([
          { val: c.physicalName },
          { val: c.logicalName },
          { val: c.type },
          { val: c.length ?? '' },
          { val: c.primaryKey ? 'Y' : '' },
          { val: c.notNull ? 'Y' : '' },
          { val: c.uniqueKey ? 'Y' : '' },
          { val: c.autoIncrement ? 'Y' : '' },
          { val: c.defaultValue || '' },
          { val: c.description || '' }
        ])
      );
    }
    tableDefRows.push(row([{ val: '' }]));
  }

  const dictRows = [
    row([
      { val: '물리명', style: 'Header' },
      { val: '논리명', style: 'Header' },
      { val: '타입', style: 'Header' },
      { val: '길이', style: 'Header' },
      { val: '설명', style: 'Header' }
    ]),
    ...(diagram.dictionary || []).map((w) =>
      row([
        { val: w.physicalName },
        { val: w.logicalName },
        { val: w.type },
        { val: w.length ?? '' },
        { val: w.description || '' }
      ])
    )
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#3B5998" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Section">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8EEF5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="테이블 목록">
    <Table>${indexRows}</Table>
  </Worksheet>
  <Worksheet ss:Name="테이블 정의서">
    <Table>${tableDefRows.join('\n')}</Table>
  </Worksheet>
  <Worksheet ss:Name="단어 사전">
    <Table>${dictRows}</Table>
  </Worksheet>
</Workbook>`;
}

// 2. HTML Documentation
export function generateHtmlReport(diagram: ERDiagram): string {
  const navLinks = diagram.tables
    .map((t) => `<a href="#tbl_${escHtml(t.id)}">${escHtml(t.physicalName)} <span>${escHtml(t.logicalName)}</span></a>`)
    .join('\n');

  const tableSections = diagram.tables
    .map((t) => {
      const cols = t.columns
        .map(
          (c) => `<tr>
            <td><code>${escHtml(c.physicalName)}</code></td>
            <td>${escHtml(c.logicalName)}</td>
            <td>${escHtml(c.type)}${c.length ? `(${c.length}${c.decimal ? `,${c.decimal}` : ''})` : ''}</td>
            <td>${c.primaryKey ? 'PK' : ''}</td>
            <td>${c.notNull ? 'NN' : ''}</td>
            <td>${c.uniqueKey ? 'UK' : ''}</td>
            <td>${escHtml(c.defaultValue || '')}</td>
            <td>${escHtml(c.description || '')}</td>
          </tr>`
        )
        .join('\n');
      return `<section id="tbl_${escHtml(t.id)}" class="card">
        <h2>${escHtml(t.physicalName)} <small>${escHtml(t.logicalName)}</small></h2>
        ${t.description ? `<p class="desc">${escHtml(t.description)}</p>` : ''}
        <table>
          <thead><tr><th>물리명</th><th>논리명</th><th>타입</th><th>PK</th><th>NN</th><th>UK</th><th>기본값</th><th>설명</th></tr></thead>
          <tbody>${cols}</tbody>
        </table>
      </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<title>ERMaster DB 명세서 (${escHtml(diagram.db)})</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; display: flex; background: #0f172a; color: #e2e8f0; }
  aside { width: 260px; background: #1e293b; padding: 16px; height: 100vh; overflow-y: auto; position: sticky; top: 0; border-right: 1px solid #334155; }
  aside h1 { font-size: 16px; margin: 0 0 12px; color: #60a5fa; }
  aside a { display: block; padding: 6px 8px; color: #cbd5e1; text-decoration: none; border-radius: 6px; font-size: 13px; }
  aside a:hover { background: #334155; }
  aside a span { color: #94a3b8; font-size: 11px; margin-left: 4px; }
  main { flex: 1; padding: 24px 32px; max-width: 1100px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; margin-bottom: 20px; }
  h2 { margin: 0 0 8px; font-size: 18px; color: #93c5fd; }
  h2 small { color: #94a3b8; font-weight: normal; font-size: 13px; }
  .desc { color: #94a3b8; font-size: 13px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid #334155; padding: 8px 10px; text-align: left; }
  th { background: #0f172a; color: #94a3b8; font-weight: 600; }
</style>
</head>
<body>
  <aside>
    <h1>ERMaster 명세서</h1>
    <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;">DBMS: ${escHtml(diagram.db)} | 테이블 ${diagram.tables.length}개</div>
    ${navLinks}
  </aside>
  <main>
    ${tableSections}
  </main>
</body>
</html>`;
}

// 3. Java Entity Generator
export interface JavaExportOptions {
  packageName: string;
  useJpa: boolean;
  useLombok: boolean;
}

export interface GeneratedJavaFile {
  fileName: string;
  content: string;
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Entity';
}

function toCamelCase(str: string): string {
  const p = toPascalCase(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function mapSqlTypeToJava(col: ERColumn): { javaType: string; importStmt?: string } {
  const t = (col.type || '').toUpperCase();
  if (t.includes('BIGINT') || t === 'LONG') return { javaType: 'Long' };
  if (t.includes('INT')) return { javaType: 'Integer' };
  if (t.includes('DECIMAL') || t.includes('NUMERIC')) {
    return { javaType: 'BigDecimal', importStmt: 'java.math.BigDecimal' };
  }
  if (t.includes('DOUBLE') || t.includes('FLOAT')) return { javaType: 'Double' };
  if (t.includes('BOOL') || t === 'BIT') return { javaType: 'Boolean' };
  if (t === 'DATE') return { javaType: 'LocalDate', importStmt: 'java.time.LocalDate' };
  if (t.includes('TIME')) return { javaType: 'LocalDateTime', importStmt: 'java.time.LocalDateTime' };
  if (t.includes('BLOB') || t.includes('BYTEA')) return { javaType: 'byte[]' };
  return { javaType: 'String' };
}

export function generateJavaEntities(
  diagram: ERDiagram,
  options: JavaExportOptions
): GeneratedJavaFile[] {
  const pkg = options.packageName.trim() || 'com.example.entity';
  const files: GeneratedJavaFile[] = [];

  for (const table of diagram.tables) {
    const className = toPascalCase(table.physicalName);
    const imports = new Set<string>();
    if (options.useJpa) imports.add('jakarta.persistence.*');
    if (options.useLombok) imports.add('lombok.Data');

    const fields: string[] = [];
    const gettersSetters: string[] = [];

    for (const col of table.columns) {
      const { javaType, importStmt } = mapSqlTypeToJava(col);
      if (importStmt) imports.add(importStmt);
      const fieldName = toCamelCase(col.physicalName);

      const annos: string[] = [];
      if (col.logicalName || col.description) {
        annos.push(`    /** ${col.logicalName || col.description} */`);
      }
      if (options.useJpa) {
        if (col.primaryKey) {
          annos.push('    @Id');
          if (col.autoIncrement) annos.push('    @GeneratedValue(strategy = GenerationType.IDENTITY)');
        }
        annos.push(
          `    @Column(name = "${col.physicalName}"${col.notNull ? ', nullable = false' : ''}${
            col.length ? `, length = ${col.length}` : ''
          })`
        );
      }
      fields.push(`${annos.join('\n')}${annos.length ? '\n' : ''}    private ${javaType} ${fieldName};`);

      if (!options.useLombok) {
        const cap = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        gettersSetters.push(
          `    public ${javaType} get${cap}() { return this.${fieldName}; }\n    public void set${cap}(${javaType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`
        );
      }
    }

    const lines: string[] = [`package ${pkg};`, ''];
    for (const imp of [...imports].sort()) {
      lines.push(`import ${imp};`);
    }
    lines.push('');
    if (options.useLombok) lines.push('@Data');
    if (options.useJpa) {
      lines.push('@Entity');
      lines.push(`@Table(name = "${table.physicalName}")`);
    }
    lines.push(`public class ${className} {`, '');
    lines.push(fields.join('\n\n'));
    if (gettersSetters.length > 0) {
      lines.push('');
      lines.push(gettersSetters.join('\n\n'));
    }
    lines.push('}', '');

    files.push({
      fileName: `${className}.java`,
      content: lines.join('\n')
    });
  }

  return files;
}

// 4. Dictionary CSV, Translation CSV, TestData SQL
export function generateDictionaryCsv(diagram: ERDiagram): string {
  const esc = (s: string = '') => `"${String(s).replace(/"/g, '""')}"`;
  const lines = ['physical_name,logical_name,type,length,decimal,description'];
  for (const w of diagram.dictionary || []) {
    lines.push(
      [esc(w.physicalName), esc(w.logicalName), esc(w.type), w.length ?? '', w.decimal ?? '', esc(w.description)].join(',')
    );
  }
  return '\uFEFF' + lines.join('\n');
}

export function generateTranslationsCsv(diagram: ERDiagram): string {
  const esc = (s: string = '') => `"${String(s).replace(/"/g, '""')}"`;
  const lines = ['logical_name,physical_name'];
  for (const tr of diagram.translations || []) {
    lines.push([esc(tr.logicalName), esc(tr.physicalName)].join(','));
  }
  return '\uFEFF' + lines.join('\n');
}

export function generateTestDataSql(diagram: ERDiagram): string {
  const tableMap = new Map<string, ERTable>(diagram.tables.map((t) => [t.id, t]));
  const stmts: string[] = [];
  for (const td of diagram.testDataList || []) {
    stmts.push(`-- Test Data: ${td.name}`);
    for (const ttd of td.tableTestData || []) {
      const table = tableMap.get(ttd.tableId);
      if (!table) continue;
      const colNames = table.columns.map((c) => c.physicalName);
      for (const row of ttd.directTestData || []) {
        const vals = table.columns.map((c) => {
          const v = row.values[c.id];
          if (v === undefined || v === '') return 'NULL';
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        stmts.push(`INSERT INTO ${table.physicalName} (${colNames.join(', ')}) VALUES (${vals.join(', ')});`);
      }
    }
    stmts.push('');
  }
  return stmts.join('\n');
}
