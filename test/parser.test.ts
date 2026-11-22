import { parseERMXml } from '../src/parser/ermParser.js';
import { serializeERMXml } from '../src/parser/ermSerializer.js';
import { generateDDL } from '../src/ddl/ddlGenerator.js';
import { validateDiagram } from '../src/ddl/diagramValidator.js';
import {
  generateExcelXml,
  generateHtmlReport,
  generateJavaEntities,
  generateDictionaryCsv,
  generateTranslationsCsv,
  generateTestDataSql
} from '../src/export/modelExporter.js';
import { parseExternalModelFile, mergeImportedObjects } from '../src/import/fileImporter.js';
import { mergeJdbcImportResult } from '../src/import/jdbcImporter.js';

const sampleErmXml = `<?xml version="1.0" encoding="UTF-8"?>
<diagram>
	<db>PostgreSQL</db>
	<page_setting>
		<direction_horizontal>true</direction_horizontal>
		<scale>100</scale>
		<paper_size>A4 210 x 297 mm</paper_size>
		<top_margin>30</top_margin>
		<left_margin>30</left_margin>
		<bottom_margin>30</bottom_margin>
		<right_margin>30</right_margin>
	</page_setting>
	<category_index>0</category_index>
	<zoom>100</zoom>
	<x>0</x>
	<y>0</y>
	<default_color>
		<r>128</r>
		<g>128</g>
		<b>192</b>
	</default_color>
	<color>
		<r>255</r>
		<g>255</g>
		<b>255</b>
	</color>
	<font_name></font_name>
	<font_size>9</font_size>
	<dictionary>
		<word>
			<id>0</id>
			<length>null</length>
			<decimal>null</decimal>
			<array>false</array>
			<array_dimension>null</array_dimension>
			<unsigned>false</unsigned>
			<args></args>
			<description>사용자 식별 번호</description>
			<logical_name>사용자ID</logical_name>
			<physical_name>id</physical_name>
			<type>bigint</type>
		</word>
		<word>
			<id>1</id>
			<length>255</length>
			<decimal>null</decimal>
			<array>false</array>
			<array_dimension>null</array_dimension>
			<unsigned>false</unsigned>
			<args></args>
			<description></description>
			<logical_name>이메일</logical_name>
			<physical_name>email</physical_name>
			<type>varchar</type>
		</word>
	</dictionary>
	<tablespace_set>
	</tablespace_set>
	<contents>
		<table>
			<id>0</id>
			<height>120</height>
			<width>220</width>
			<font_name></font_name>
			<font_size>9</font_size>
			<x>100</x>
			<y>100</y>
			<color>
				<r>128</r>
				<g>128</g>
				<b>192</b>
			</color>
			<connections>
			</connections>
			<physical_name>users</physical_name>
			<logical_name>사용자</logical_name>
			<description>사용자 계정 테이블</description>
			<columns>
				<normal_column>
					<word_id>0</word_id>
					<id>0</id>
					<description></description>
					<unique_key_name></unique_key_name>
					<logical_name></logical_name>
					<physical_name></physical_name>
					<type></type>
					<constraint></constraint>
					<default_value></default_value>
					<auto_increment>true</auto_increment>
					<foreign_key>false</foreign_key>
					<not_null>true</not_null>
					<primary_key>true</primary_key>
					<unique_key>false</unique_key>
					<character_set></character_set>
					<collation></collation>
					<sequence></sequence>
				</normal_column>
				<normal_column>
					<word_id>1</word_id>
					<id>1</id>
					<description></description>
					<unique_key_name></unique_key_name>
					<logical_name></logical_name>
					<physical_name></physical_name>
					<type></type>
					<constraint></constraint>
					<default_value></default_value>
					<auto_increment>false</auto_increment>
					<foreign_key>false</foreign_key>
					<not_null>true</not_null>
					<primary_key>false</primary_key>
					<unique_key>true</unique_key>
					<character_set></character_set>
					<collation></collation>
					<sequence></sequence>
				</normal_column>
			</columns>
		</table>
		<table>
			<id>1</id>
			<height>120</height>
			<width>220</width>
			<font_name></font_name>
			<font_size>9</font_size>
			<x>450</x>
			<y>100</y>
			<color>
				<r>128</r>
				<g>128</g>
				<b>192</b>
			</color>
			<connections>
				<relation>
					<id>rel_0</id>
					<source>0</source>
					<target>1</target>
					<name>FK_orders_users</name>
					<parent_cardinality>1</parent_cardinality>
					<child_cardinality>0..n</child_cardinality>
					<reference_for_pk>false</reference_for_pk>
					<on_delete_action>CASCADE</on_delete_action>
					<on_update_action>CASCADE</on_update_action>
				</relation>
			</connections>
			<physical_name>orders</physical_name>
			<logical_name>주문</logical_name>
			<description>주문 내역 테이블</description>
			<columns>
				<normal_column>
					<word_id>0</word_id>
					<id>2</id>
					<description></description>
					<unique_key_name></unique_key_name>
					<logical_name></logical_name>
					<physical_name></physical_name>
					<type></type>
					<constraint></constraint>
					<default_value></default_value>
					<auto_increment>true</auto_increment>
					<foreign_key>false</foreign_key>
					<not_null>true</not_null>
					<primary_key>true</primary_key>
					<unique_key>false</unique_key>
					<character_set></character_set>
					<collation></collation>
					<sequence></sequence>
				</normal_column>
			</columns>
		</table>
		<note>
			<id>2</id>
			<height>80</height>
			<width>180</width>
			<font_name></font_name>
			<font_size>9</font_size>
			<x>200</x>
			<y>300</y>
			<color>
				<r>255</r>
				<g>255</g>
				<b>128</b>
			</color>
			<connections>
			</connections>
			<text>이 시스템은 사용자 주문 관리 시스템입니다.</text>
		</note>
	</contents>
	<column_groups>
	</column_groups>
	<test_data_list>
	</test_data_list>
	<sequence_set>
	</sequence_set>
	<trigger_set>
	</trigger_set>
	<change_tracking_list>
	</change_tracking_list>
</diagram>`;

console.log('=== [1] Parsing ERM XML ===');
const diagram = parseERMXml(sampleErmXml);
console.log('DBMS:', diagram.db);
console.log('Tables Count:', diagram.tables.length);
console.log('Notes Count:', diagram.notes.length);
console.log('Relations Count:', diagram.relations.length);
console.log('First Table Columns:', diagram.tables[0].columns.map(c => `${c.physicalName}(${c.logicalName}): ${c.type}${c.length ? '('+c.length+')' : ''}`));

console.log('\n=== [2] Generating DDL ===');
const ddl = generateDDL(diagram, 'PostgreSQL');
console.log(ddl);

console.log('\n=== [3] Serializing back to XML ===');
const serializedXml = serializeERMXml(diagram);
console.log('Serialized XML Length:', serializedXml.length);

console.log('\n=== [4] Roundtrip Parsing ===');
const diagram2 = parseERMXml(serializedXml);
console.log('Roundtrip Tables Count:', diagram2.tables.length);
console.log('Roundtrip Relations Count:', diagram2.relations.length);

console.log('\n=== [5] Full Data Model Elements Roundtrip ===');
const fullDiagram = {
  ...diagram,
  tablespaces: [{ id: 'ts_1', name: 'ts_main', description: 'Main TS', properties: { location: '/pgdata' } }],
  sequences: [{ id: 'seq_1', name: 'seq_users', start: 1, increment: 1, cache: 20, cycle: false }],
  triggers: [{ id: 'trg_1', name: 'trg_audit', sql: 'CREATE TRIGGER trg_audit AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION audit();' }],
  columnGroups: [{
    id: 'cg_1',
    groupName: 'AuditColumns',
    columns: [{ id: 'cg_c1', physicalName: 'created_at', logicalName: '생성일', type: 'timestamp', primaryKey: false, notNull: true, uniqueKey: false, autoIncrement: false }]
  }],
  views: [{
    id: 'v_1',
    physicalName: 'v_active_users',
    logicalName: '활성사용자뷰',
    description: 'Active users',
    sql: 'SELECT id, email FROM users',
    x: 300,
    y: 400,
    columns: [{ id: 'vc_1', physicalName: 'id', logicalName: 'ID', type: 'bigint', primaryKey: false, notNull: false, uniqueKey: false, autoIncrement: false }]
  }],
  categories: [{
    id: 'cat_1',
    name: '회원 영역',
    selected: true,
    x: 50,
    y: 50,
    width: 600,
    height: 400,
    nodeElementIds: ['0', '1']
  }],
  images: [{ id: 'img_1', x: 700, y: 100, width: 120, height: 80, data: 'iVBORw0KGgo=', alpha: 255, fixAspectRatio: true }],
  noteConnections: [{ id: 'cc_1', sourceId: '2', targetId: '0' }],
  modelProperties: {
    x: 20, y: 20, width: 200, height: 100, display: true,
    properties: [{ name: 'Author', value: 'J-Lab' }]
  },
  testDataList: [{
    id: 'td_0',
    name: '기본 테스트 데이터',
    tableTestData: [{ tableId: '0', directTestData: [{ values: { '0': '1', '1': 'a@b.com' } }] }]
  }]
};
fullDiagram.tables[0] = {
  ...fullDiagram.tables[0],
  columnGroupIds: ['cg_1'],
  indexes: [{ id: 'idx_1', name: 'idx_users_email', nonUnique: false, columns: [{ columnId: '1', order: 'ASC' }] }],
  complexUniqueKeys: [{ id: 'uk_1', name: 'uk_users_email', columns: ['1'] }]
};

const fullXml = serializeERMXml(fullDiagram);
const parsedFull = parseERMXml(fullXml);
const fullDdl = generateDDL(parsedFull, 'PostgreSQL');

const assert = (cond: boolean, msg: string) => { if (!cond) throw new Error(`Assertion failed: ${msg}`); };
assert(parsedFull.tablespaces.length === 1, 'tablespaces');
assert(parsedFull.sequences.length === 1, 'sequences');
assert(parsedFull.triggers.length === 1, 'triggers');
assert(parsedFull.columnGroups.length === 1, 'columnGroups');
assert(parsedFull.views.length === 1, 'views');
assert(parsedFull.categories.length === 1, 'categories');
assert(parsedFull.images.length === 1, 'images');
assert(parsedFull.noteConnections.length === 1, 'noteConnections');
assert(parsedFull.modelProperties?.display === true, 'modelProperties');
assert(parsedFull.testDataList.length === 1, 'testDataList');
assert(parsedFull.tables[0].indexes.length === 1, 'table indexes');
assert(parsedFull.tables[0].complexUniqueKeys.length === 1, 'table complexUniqueKeys');
assert(parsedFull.tables[0].columnGroupIds?.length === 1, 'table columnGroupIds');
assert(fullDdl.includes('CREATE SEQUENCE seq_users'), 'DDL sequence');
assert(fullDdl.includes('CREATE OR REPLACE VIEW v_active_users'), 'DDL view');
assert(fullDdl.includes('CREATE UNIQUE INDEX idx_users_email'), 'DDL index');
assert(fullDdl.includes('CONSTRAINT uk_users_email UNIQUE'), 'DDL complex unique key');
assert(fullDdl.includes('CREATE TRIGGER trg_audit'), 'DDL trigger');

console.log('\n=== [6] File & JDBC Import Tests ===');
const sqlSample = `
  CREATE TABLE departments (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
  );
  CREATE TABLE employees (
    id BIGINT PRIMARY KEY,
    dept_id BIGINT NOT NULL,
    CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id) REFERENCES departments (id)
  );
  CREATE VIEW v_employees AS SELECT id, dept_id FROM employees;
  CREATE SEQUENCE seq_emp;
`;
const parsedSql = parseExternalModelFile('schema.sql', sqlSample);
assert(parsedSql.tables.length === 2, 'SQL import tables');
assert(parsedSql.views.length === 1, 'SQL import views');
assert(parsedSql.sequences.length === 1, 'SQL import sequences');
assert(parsedSql.relations.length === 1, 'SQL import FK relation');

const mergedFile = mergeImportedObjects(diagram, parsedSql, {
  tableIds: parsedSql.tables.map(t => t.id),
  viewIds: parsedSql.views.map(v => v.id),
  noteIds: [],
  sequenceIds: parsedSql.sequences.map(s => s.id),
  triggerIds: [],
  tablespaceIds: [],
  columnGroupIds: []
});
assert(mergedFile.tables.length === 4, 'merged file tables');
assert(mergedFile.relations.length === 2, 'merged file relations');

const mergedJdbc = mergeJdbcImportResult(diagram, {
  tables: [
    {
      qualifiedName: 'public.customers',
      schema: 'public',
      physicalName: 'customers',
      logicalName: '고객',
      description: '',
      columns: [{ physicalName: 'id', logicalName: 'ID', type: 'bigint', primaryKey: true, notNull: true }],
      indexes: [{ name: 'idx_cust_id', nonUnique: false, columns: [{ columnName: 'id', order: 'ASC' }] }]
    },
    {
      qualifiedName: 'public.invoices',
      schema: 'public',
      physicalName: 'invoices',
      logicalName: '청구서',
      description: '',
      columns: [{ physicalName: 'id', logicalName: 'ID', type: 'bigint', primaryKey: true, notNull: true }],
      indexes: []
    }
  ],
  views: [{ schema: 'public', physicalName: 'v_cust', logicalName: '고객뷰', description: '', columns: [] }],
  relations: [{
    name: 'fk_inv_cust',
    sourceQualified: 'public.customers',
    sourceTable: 'customers',
    targetQualified: 'public.invoices',
    targetTable: 'invoices',
    onDeleteAction: 'CASCADE',
    onUpdateAction: 'RESTRICT'
  }]
});
assert(mergedJdbc.tables.length === 4, 'merged jdbc tables');
assert(mergedJdbc.views.length === 1, 'merged jdbc views');
assert(mergedJdbc.relations.length === 2, 'merged jdbc relations');

console.log('\n=== [7] DBMS-Specific DDL & Validator Tests ===');
// Composite FK mapping + DBMS dialects
const compositeDiagram = {
  ...fullDiagram,
  relations: [
    {
      id: 'rel_comp',
      name: 'FK_orders_users_comp',
      sourceTableId: '0',
      targetTableId: '1',
      sourceColumnIds: ['0'],
      targetColumnIds: ['2'],
      onDeleteAction: 'CASCADE',
      onUpdateAction: 'RESTRICT'
    }
  ]
};
const mysqlDdl = generateDDL(compositeDiagram, 'MySQL');
assert(mysqlDdl.includes('SET FOREIGN_KEY_CHECKS = 0;'), 'MySQL FK checks');
assert(mysqlDdl.includes('AUTO_INCREMENT'), 'MySQL AUTO_INCREMENT');
assert(mysqlDdl.includes('FOREIGN KEY (id) REFERENCES users (id)'), 'Explicit FK mapping');

const oracleDdl = generateDDL(compositeDiagram, 'Oracle');
assert(oracleDdl.includes('VARCHAR2(255)'), 'Oracle VARCHAR2');
assert(oracleDdl.includes('NOCYCLE'), 'Oracle sequence NOCYCLE');

const mssqlDdl = generateDDL(compositeDiagram, 'SQLServer');
assert(mssqlDdl.includes("OBJECT_ID('users', 'U')"), 'SQLServer IF OBJECT_ID');
assert(mssqlDdl.includes('IDENTITY(1,1)'), 'SQLServer IDENTITY');

// Validator tests
const badDiagram = {
  ...fullDiagram,
  tables: [
    ...fullDiagram.tables,
    {
      id: 'bad_t',
      physicalName: 'users', // duplicate!
      logicalName: '중복',
      description: '',
      x: 0,
      y: 0,
      columns: [], // no columns!
      indexes: [{ id: 'bad_idx', name: 'idx_ft', nonUnique: true, fullText: true, columns: [] }],
      complexUniqueKeys: []
    }
  ]
};
const issues = validateDiagram(badDiagram, 'PostgreSQL');
assert(issues.some(i => i.severity === 'error' && i.category === 'Table' && i.message.includes('중복')), 'Validator duplicate table');
assert(issues.some(i => i.severity === 'error' && i.category === 'Table' && i.message.includes('컬럼이 하나도')), 'Validator no columns');
assert(issues.some(i => i.severity === 'warning' && i.category === 'Index' && i.message.includes('FULLTEXT')), 'Validator fulltext warning');

console.log('\n=== [8] Notation, Theme, Level, Capital Roundtrip ===');
const styledDiagram = {
  ...fullDiagram,
  notation: 'IDEF1X' as const,
  tableStyle: 'funny' as const,
  notationLevel: 'key' as const,
  capital: true
};
const styledXml = serializeERMXml(styledDiagram);
const parsedStyled = parseERMXml(styledXml);
assert(parsedStyled.notation === 'IDEF1X', 'notation IDEF1X roundtrip');
assert(parsedStyled.tableStyle === 'funny', 'tableStyle funny roundtrip');
assert(parsedStyled.notationLevel === 'key', 'notationLevel key roundtrip');
assert(parsedStyled.capital === true, 'capital true roundtrip');

console.log('\n=== [9] ChangeTracking & Translations Roundtrip ===');
const trackedDiagram = {
  ...styledDiagram,
  changeTrackingList: [
    {
      id: 'ct_0',
      comment: 'Initial snapshot',
      updatedDate: '2026-11-22 11:45:00',
      tableNames: ['users', 'orders'],
      tableCount: 2,
      columnCount: 5
    }
  ],
  translations: [
    { id: 'tr_0', logicalName: '사용자', physicalName: 'user' }
  ]
};
const trackedXml = serializeERMXml(trackedDiagram);
const parsedTracked = parseERMXml(trackedXml);
assert(parsedTracked.changeTrackingList?.length === 1, 'changeTrackingList roundtrip');
assert(parsedTracked.changeTrackingList?.[0].comment === 'Initial snapshot', 'changeTracking comment');
assert(parsedTracked.translations?.length === 1, 'translations roundtrip');
assert(parsedTracked.translations?.[0].physicalName === 'user', 'translation entry');

console.log('\n=== [10] Model Exporters (Excel, HTML, Java, CSV, TestData) ===');
const excelXml = generateExcelXml(trackedDiagram);
assert(excelXml.includes('<Worksheet ss:Name="테이블 정의서">'), 'Excel XML worksheet');
const htmlReport = generateHtmlReport(trackedDiagram);
assert(htmlReport.includes('ERMaster 명세서') && htmlReport.includes('users'), 'HTML report');
const javaFiles = generateJavaEntities(trackedDiagram, { packageName: 'com.jlab.entity', useJpa: true, useLombok: true });
assert(javaFiles.length === 2 && javaFiles[0].content.includes('@Entity'), 'Java entities');
const dictCsv = generateDictionaryCsv(trackedDiagram);
assert(dictCsv.includes('physical_name,logical_name'), 'Dictionary CSV');
const transCsv = generateTranslationsCsv(trackedDiagram);
assert(transCsv.includes('사용자') && transCsv.includes('user'), 'Translations CSV');
const tdSql = generateTestDataSql(trackedDiagram);
assert(tdSql.includes('INSERT INTO users'), 'TestData INSERT SQL');

console.log('\n=== [11] CategorySettings & Bendpoint Roundtrip ===');
const catDiagram = {
  ...trackedDiagram,
  categorySettings: { freeLayout: true, showReferredTables: true, selectedCategoryId: 'cat_1' },
  relations: [
    { ...trackedDiagram.relations[0], bendpoints: [{ x: 300, y: 200, relative: false }] }
  ]
};
const catXml = serializeERMXml(catDiagram);
const parsedCat = parseERMXml(catXml);
assert(parsedCat.categorySettings?.freeLayout === true, 'freeLayout roundtrip');
assert(parsedCat.categorySettings?.showReferredTables === true, 'showReferredTables roundtrip');
assert(parsedCat.categorySettings?.selectedCategoryId === 'cat_1', 'selectedCategoryId roundtrip');
assert(parsedCat.relations[0].bendpoints?.length === 1, 'relation bendpoint roundtrip');

console.log('SUCCESS: All tests passed!');
