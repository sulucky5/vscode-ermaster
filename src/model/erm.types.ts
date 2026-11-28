export type DatabaseType =
  | 'PostgreSQL'
  | 'MySQL'
  | 'Oracle'
  | 'SQLServer'
  | 'SQLServer2008'
  | 'DB2'
  | 'SQLite'
  | 'H2'
  | 'HSQLDB'
  | 'MS Access'
  | 'StandardSQL'
  | 'Tibero'
  | 'CUBRID'
  | string;

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface Word {
  id: string;
  physicalName: string;
  logicalName: string;
  description: string;
  type: string;
  length?: number;
  decimal?: number;
  array?: boolean;
  arrayDimension?: number;
  unsigned?: boolean;
  zerofill?: boolean;
  binary?: boolean;
  args?: string;
  charSemantics?: boolean;
}

export interface ERColumn {
  id: string;
  wordId?: string;
  physicalName: string;
  logicalName: string;
  type: string;
  length?: number;
  decimal?: number;
  primaryKey: boolean;
  notNull: boolean;
  uniqueKey: boolean;
  uniqueKeyName?: string;
  autoIncrement: boolean;
  foreignKey?: boolean;
  referencedColumnId?: string;
  relationId?: string;
  constraint?: string;
  defaultValue?: string;
  description?: string;
  characterSet?: string;
  collation?: string;
  sequence?: string;
}

export interface ERIndexColumn {
  columnId: string;
  order: 'ASC' | 'DESC';
}

export interface ERIndex {
  id: string;
  name: string;
  type?: string;
  nonUnique: boolean;
  fullText?: boolean;
  columns: ERIndexColumn[];
  description?: string;
}

export interface ERComplexUniqueKey {
  id: string;
  name: string;
  columns: string[];
}

export interface Bendpoint {
  x: number;
  y: number;
  relative?: boolean;
}

export interface ERRelation {
  id: string;
  name: string;
  sourceTableId: string; // Parent (Referenced / PK)
  targetTableId: string; // Child (Foreign / FK)
  sourceColumnIds?: string[];
  targetColumnIds?: string[];
  referenceForPK?: boolean;
  referencedComplexUniqueKeyId?: string;
  onDeleteAction?: string;
  onUpdateAction?: string;
  parentCardinality?: string; // '1', '0..1'
  childCardinality?: string;  // '1', '0..1', '0..n', '1..n'
  sourceHandle?: string;      // 'top' | 'bottom' | 'left' | 'right'
  targetHandle?: string;      // 'top' | 'bottom' | 'left' | 'right'
  sourceXp?: number;
  sourceYp?: number;
  targetXp?: number;
  targetYp?: number;
  parentMandatory?: boolean;
  childMandatory?: boolean;
  bendpoints?: Bendpoint[];
}

export interface ERTableProperties {
  tablespaceId?: string;
  schema?: string;
  characterSet?: string;
  collation?: string;
  storageEngine?: string;
  primaryKeyLengthOfText?: number;
  withoutOIDs?: boolean;
  [key: string]: any;
}

export interface ERTable {
  id: string;
  physicalName: string;
  logicalName: string;
  description: string;
  constraint?: string;
  primaryKeyName?: string;
  option?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: RGBColor;
  columns: ERColumn[];
  columnGroupIds?: string[];
  indexes: ERIndex[];
  complexUniqueKeys: ERComplexUniqueKey[];
  incomings?: ERRelation[];
  tableProperties?: ERTableProperties;
}

export interface ERNoteConnection {
  id: string;
  sourceId: string;
  targetId: string;
  bendpoints?: Bendpoint[];
}

export interface ERNote {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: RGBColor;
  connections: ERNoteConnection[];
}

export interface ERView {
  id: string;
  physicalName: string;
  logicalName: string;
  description: string;
  sql: string;
  schema?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: RGBColor;
  columns: ERColumn[];
  columnGroupIds?: string[];
}

export interface ERCategory {
  id: string;
  name: string;
  selected?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeElementIds: string[];
  color?: RGBColor;
}

export interface ERImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: RGBColor;
  data: string; // base64 encoded image data
  hue?: number;
  saturation?: number;
  brightness?: number;
  alpha?: number;
  fixAspectRatio?: boolean;
}

export interface ERNameValue {
  name: string;
  value: string;
}

export interface ERModelProperties {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: RGBColor;
  display: boolean;
  creationDate?: string;
  updatedDate?: string;
  properties: ERNameValue[];
}

export interface ColumnGroup {
  id: string;
  groupName: string;
  columns: ERColumn[];
}

export interface ERSequence {
  id: string;
  name: string;
  schema?: string;
  increment?: number;
  minValue?: number;
  maxValue?: number;
  start?: number;
  cache?: number;
  nocache?: boolean;
  cycle?: boolean;
  order?: boolean;
  description?: string;
  dataType?: string;
  decimalSize?: number;
}

export interface ERTrigger {
  id: string;
  name: string;
  schema?: string;
  sql: string;
  description?: string;
}

export interface ERTablespace {
  id: string;
  name: string;
  description?: string;
  properties?: Record<string, any>;
}

export interface ERTestDataRow {
  values: Record<string, string>; // columnId -> value
}

export interface ERTableTestData {
  tableId: string;
  directTestData: ERTestDataRow[];
  repeatCount?: number;
}

export interface ERTestData {
  id: string;
  name: string;
  tableTestData: ERTableTestData[];
}

export interface ERChangeTracking {
  id: string;
  comment: string;
  updatedDate: string;
  tableNames: string[];
  tableCount: number;
  columnCount: number;
}

export interface ERTranslationEntry {
  id: string;
  logicalName: string;
  physicalName: string;
}

export type NotationType = 'IE' | 'IDEF1X';
export type TableStyle = 'frame' | 'funny' | 'simple';
export type NotationLevel =
  | 'detail'
  | 'title'
  | 'column'
  | 'key'
  | 'exclude_type'
  | 'name_and_key';

export interface ERCategorySettings {
  freeLayout: boolean;
  showReferredTables: boolean;
  selectedCategoryId?: string | null;
}

export interface ERDiagram {
  db: DatabaseType;
  x?: number;
  y?: number;
  zoom?: number;
  viewMode: 'logical' | 'physical' | 'both';
  notation?: NotationType;
  tableStyle?: TableStyle;
  notationLevel?: NotationLevel;
  capital?: boolean;
  lockEdit?: boolean;
  tableHeightMode?: 'auto' | 'fixed';
  tableFixedHeight?: number;
  tableWidthMode?: 'auto' | 'fixed';
  tableFixedWidth?: number;
  dictionary: Word[];
  tables: ERTable[];
  views: ERView[];
  notes: ERNote[];
  noteConnections: ERNoteConnection[];
  images: ERImage[];
  relations: ERRelation[];
  categories: ERCategory[];
  categorySettings?: ERCategorySettings;
  columnGroups: ColumnGroup[];
  sequences: ERSequence[];
  triggers: ERTrigger[];
  tablespaces: ERTablespace[];
  modelProperties?: ERModelProperties;
  testDataList: ERTestData[];
  changeTrackingList?: ERChangeTracking[];
  translations?: ERTranslationEntry[];
  settings?: Record<string, any>;
}
