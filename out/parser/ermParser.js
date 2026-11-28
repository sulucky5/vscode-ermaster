"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseERMXml = parseERMXml;
const fast_xml_parser_1 = require("fast-xml-parser");
function ensureArray(item) {
    if (item === undefined || item === null)
        return [];
    return Array.isArray(item) ? item : [item];
}
function parseNumber(val, defaultVal = 0) {
    if (val === undefined || val === null || val === 'null' || val === '')
        return defaultVal;
    const num = Number(val);
    return isNaN(num) ? defaultVal : num;
}
function parseOptionalNumber(val) {
    if (val === undefined || val === null || val === 'null' || val === '')
        return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
}
function parseBoolean(val) {
    if (val === undefined || val === null)
        return false;
    return val === true || val === 'true' || val === '1';
}
function parseString(val, defaultVal = '') {
    if (val === undefined || val === null || val === 'null')
        return defaultVal;
    return String(val);
}
function parseOptionalString(val) {
    if (val === undefined || val === null || val === 'null' || val === '')
        return undefined;
    return String(val);
}
function parseColor(colorObj) {
    if (!colorObj)
        return undefined;
    return {
        r: parseNumber(colorObj.r, 255),
        g: parseNumber(colorObj.g, 255),
        b: parseNumber(colorObj.b, 255)
    };
}
function parseNormalColumns(rawCols, wordMap) {
    const columns = [];
    for (const c of ensureArray(rawCols)) {
        const colId = parseString(c.id);
        const wordId = parseOptionalString(c.word_id);
        const refWord = wordId ? wordMap.get(wordId) : undefined;
        const physicalName = parseOptionalString(c.physical_name) ?? refWord?.physicalName ?? '';
        const logicalName = parseOptionalString(c.logical_name) ?? refWord?.logicalName ?? '';
        const colType = parseOptionalString(c.type) ?? refWord?.type ?? 'varchar';
        const colLength = c.length !== undefined && c.length !== 'null' && c.length !== ''
            ? parseOptionalNumber(c.length)
            : refWord?.length;
        const colDecimal = c.decimal !== undefined && c.decimal !== 'null' && c.decimal !== ''
            ? parseOptionalNumber(c.decimal)
            : refWord?.decimal;
        columns.push({
            id: colId,
            wordId,
            physicalName,
            logicalName,
            type: colType,
            length: colLength,
            decimal: colDecimal,
            primaryKey: parseBoolean(c.primary_key),
            notNull: parseBoolean(c.not_null),
            uniqueKey: parseBoolean(c.unique_key),
            uniqueKeyName: parseOptionalString(c.unique_key_name),
            autoIncrement: parseBoolean(c.auto_increment),
            foreignKey: parseBoolean(c.foreign_key),
            referencedColumnId: parseOptionalString(c.referenced_column),
            relationId: parseOptionalString(c.relation),
            constraint: parseOptionalString(c.constraint),
            defaultValue: parseOptionalString(c.default_value),
            description: parseOptionalString(c.description) ?? refWord?.description,
            characterSet: parseOptionalString(c.character_set),
            collation: parseOptionalString(c.collation),
            sequence: parseOptionalString(c.sequence)
        });
    }
    return columns;
}
function parseBendpoints(rawBendpoints) {
    const bendpoints = [];
    for (const bp of ensureArray(rawBendpoints)) {
        bendpoints.push({
            x: parseNumber(bp.x, 0),
            y: parseNumber(bp.y, 0),
            relative: parseBoolean(bp.relative)
        });
    }
    return bendpoints;
}
function parseCommentConnections(rawConns, defaultTargetId, noteConnections) {
    for (const cc of ensureArray(rawConns)) {
        const bendpoints = parseBendpoints(cc.bendpoint);
        noteConnections.push({
            id: parseString(cc.id, `cc_${noteConnections.length}`),
            sourceId: parseString(cc.source),
            targetId: parseString(cc.target, defaultTargetId),
            bendpoints: bendpoints.length > 0 ? bendpoints : undefined
        });
    }
}
function parseERMXml(xmlString) {
    const parser = new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseTagValue: false,
        trimValues: false
    });
    const parsed = parser.parse(xmlString);
    const diagramNode = parsed.diagram || {};
    const db = parseOptionalString(diagramNode.settings?.database) ?? parseOptionalString(diagramNode.db) ?? 'PostgreSQL';
    const x = parseNumber(diagramNode.x, 0);
    const y = parseNumber(diagramNode.y, 0);
    const zoom = parseNumber(diagramNode.zoom, 100);
    const rawViewMode = diagramNode.settings?.view_mode;
    const viewMode = rawViewMode === '0' || rawViewMode === 0
        ? 'logical'
        : rawViewMode === '1' || rawViewMode === 1
            ? 'physical'
            : 'both';
    const rawNotation = parseOptionalString(diagramNode.settings?.notation)?.toUpperCase();
    const notation = rawNotation === 'IDEF1X' ? 'IDEF1X' : 'IE';
    const rawTableStyle = parseOptionalString(diagramNode.settings?.table_style)?.toLowerCase();
    const tableStyle = rawTableStyle === 'funny' || rawTableStyle === 'simple' ? rawTableStyle : 'frame';
    const rawNotationLevel = Number(diagramNode.settings?.notation_level);
    const notationLevel = rawNotationLevel === 1
        ? 'title'
        : rawNotationLevel === 2
            ? 'column'
            : rawNotationLevel === 3
                ? 'key'
                : rawNotationLevel === 4
                    ? 'exclude_type'
                    : rawNotationLevel === 5
                        ? 'name_and_key'
                        : 'detail';
    const capital = parseBoolean(diagramNode.settings?.capital);
    // 1. Dictionary (Word)
    const wordMap = new Map();
    const dictionary = [];
    for (const w of ensureArray(diagramNode.dictionary?.word)) {
        const wordId = parseString(w.id);
        const word = {
            id: wordId,
            physicalName: parseString(w.physical_name),
            logicalName: parseString(w.logical_name),
            description: parseString(w.description),
            type: parseString(w.type, 'varchar'),
            length: parseOptionalNumber(w.length),
            decimal: parseOptionalNumber(w.decimal),
            array: parseBoolean(w.array),
            arrayDimension: parseOptionalNumber(w.array_dimension),
            unsigned: parseBoolean(w.unsigned),
            zerofill: parseBoolean(w.zerofill),
            binary: parseBoolean(w.binary),
            args: parseOptionalString(w.args),
            charSemantics: parseBoolean(w.char_semantics)
        };
        wordMap.set(wordId, word);
        dictionary.push(word);
    }
    // 2. Tablespaces
    const tablespaces = [];
    for (const ts of ensureArray(diagramNode.tablespace_set?.tablespace)) {
        const props = {};
        if (ts.properties && typeof ts.properties === 'object') {
            for (const [k, v] of Object.entries(ts.properties)) {
                props[k] = v;
            }
        }
        tablespaces.push({
            id: parseString(ts.id),
            name: parseString(ts.name),
            description: parseOptionalString(ts.description),
            properties: Object.keys(props).length > 0 ? props : undefined
        });
    }
    // 3. Column Groups
    const columnGroups = [];
    for (const cg of ensureArray(diagramNode.column_groups?.column_group)) {
        columnGroups.push({
            id: parseString(cg.id),
            groupName: parseString(cg.group_name),
            columns: parseNormalColumns(cg.columns?.normal_column, wordMap)
        });
    }
    // 4. Contents (Tables, Views, Notes, Images) & Connections
    const tables = [];
    const views = [];
    const notes = [];
    const images = [];
    const relations = [];
    const noteConnections = [];
    for (const t of ensureArray(diagramNode.contents?.table)) {
        const tableId = parseString(t.id);
        const columns = parseNormalColumns(t.columns?.normal_column, wordMap);
        const columnGroupIds = ensureArray(t.columns?.column_group).map((g) => parseString(g));
        // Indexes (<inidex> in ERMaster XML, also support <index>)
        const indexes = [];
        const rawIndexes = [
            ...ensureArray(t.indexes?.inidex),
            ...ensureArray(t.indexes?.index)
        ];
        rawIndexes.forEach((idx, i) => {
            const idxCols = ensureArray(idx.columns?.column).map((ic) => ({
                columnId: parseString(ic.id),
                order: parseBoolean(ic.desc) ? 'DESC' : 'ASC'
            }));
            indexes.push({
                id: parseOptionalString(idx.id) ?? `${tableId}_idx_${i}`,
                name: parseString(idx.name),
                type: parseOptionalString(idx.type),
                nonUnique: parseBoolean(idx.non_unique),
                fullText: parseBoolean(idx.full_text),
                columns: idxCols,
                description: parseOptionalString(idx.description)
            });
        });
        // Complex Unique Keys
        const complexUniqueKeys = [];
        for (const cuk of ensureArray(t.complex_unique_key_list?.complex_unique_key)) {
            const cukCols = ensureArray(cuk.columns?.column).map((cc) => parseString(cc.id));
            complexUniqueKeys.push({
                id: parseString(cuk.id),
                name: parseString(cuk.name),
                columns: cukCols
            });
        }
        // Table Properties
        let tableProperties;
        if (t.table_properties) {
            tableProperties = {
                tablespaceId: parseOptionalString(t.table_properties.tablespace_id),
                schema: parseOptionalString(t.table_properties.schema),
                characterSet: parseOptionalString(t.table_properties.character_set),
                collation: parseOptionalString(t.table_properties.collation),
                storageEngine: parseOptionalString(t.table_properties.storage_engine),
                primaryKeyLengthOfText: parseOptionalNumber(t.table_properties.primary_key_length_of_text),
                withoutOIDs: parseBoolean(t.table_properties.without_oids)
            };
        }
        // Relations
        for (const rel of ensureArray(t.connections?.relation)) {
            const bendpoints = parseBendpoints(rel.bendpoint_list?.bendpoint ?? rel.bendpoint);
            const sourceColumnIds = ensureArray(rel.source_column_ids?.column_id).map((id) => parseString(id));
            const targetColumnIds = ensureArray(rel.target_column_ids?.column_id).map((id) => parseString(id));
            relations.push({
                id: parseString(rel.id),
                name: parseString(rel.name),
                sourceTableId: parseString(rel.source),
                targetTableId: parseString(rel.target, tableId),
                sourceColumnIds: sourceColumnIds.length > 0 ? sourceColumnIds : undefined,
                targetColumnIds: targetColumnIds.length > 0 ? targetColumnIds : undefined,
                referenceForPK: parseBoolean(rel.reference_for_pk),
                referencedComplexUniqueKeyId: parseOptionalString(rel.referenced_complex_unique_key),
                onDeleteAction: parseOptionalString(rel.on_delete_action),
                onUpdateAction: parseOptionalString(rel.on_update_action),
                parentCardinality: parseOptionalString(rel.parent_cardinality) ?? '1',
                childCardinality: parseOptionalString(rel.child_cardinality) ?? '0..n',
                sourceXp: parseOptionalNumber(rel.source_xp),
                sourceYp: parseOptionalNumber(rel.source_yp),
                targetXp: parseOptionalNumber(rel.target_xp),
                targetYp: parseOptionalNumber(rel.target_yp),
                parentMandatory: parseBoolean(rel.parent_mandatory),
                childMandatory: parseBoolean(rel.child_mandatory),
                bendpoints: bendpoints.length > 0 ? bendpoints : undefined
            });
        }
        parseCommentConnections(t.connections?.comment_connection, tableId, noteConnections);
        tables.push({
            id: tableId,
            physicalName: parseString(t.physical_name),
            logicalName: parseString(t.logical_name),
            description: parseString(t.description),
            constraint: parseOptionalString(t.constraint),
            primaryKeyName: parseOptionalString(t.primary_key_name),
            option: parseOptionalString(t.option),
            x: parseNumber(t.x, 50),
            y: parseNumber(t.y, 50),
            width: parseOptionalNumber(t.width) || 160,
            height: (() => {
                const h = parseOptionalNumber(t.height);
                return h !== undefined && h > 0 ? h : undefined;
            })(),
            color: parseColor(t.color),
            columns,
            columnGroupIds: columnGroupIds.length > 0 ? columnGroupIds : undefined,
            indexes,
            complexUniqueKeys,
            tableProperties
        });
    }
    // Views
    for (const v of ensureArray(diagramNode.contents?.view)) {
        const viewId = parseString(v.id);
        const columns = parseNormalColumns(v.columns?.normal_column, wordMap);
        const columnGroupIds = ensureArray(v.columns?.column_group).map((g) => parseString(g));
        parseCommentConnections(v.connections?.comment_connection, viewId, noteConnections);
        views.push({
            id: viewId,
            physicalName: parseString(v.physical_name),
            logicalName: parseString(v.logical_name),
            description: parseString(v.description),
            sql: parseString(v.sql),
            schema: parseOptionalString(v.view_properties?.schema),
            x: parseNumber(v.x, 100),
            y: parseNumber(v.y, 100),
            width: parseOptionalNumber(v.width) || 180,
            height: parseOptionalNumber(v.height) || 120,
            color: parseColor(v.color),
            columns,
            columnGroupIds: columnGroupIds.length > 0 ? columnGroupIds : undefined
        });
    }
    // Notes
    for (const n of ensureArray(diagramNode.contents?.note)) {
        const noteId = parseString(n.id);
        parseCommentConnections(n.connections?.comment_connection, noteId, noteConnections);
        notes.push({
            id: noteId,
            text: parseString(n.text),
            x: parseNumber(n.x, 100),
            y: parseNumber(n.y, 100),
            width: parseNumber(n.width, 150),
            height: parseNumber(n.height, 80),
            color: parseColor(n.color),
            connections: []
        });
    }
    // Inserted Images
    for (const img of ensureArray(diagramNode.contents?.image)) {
        const imgId = parseString(img.id);
        parseCommentConnections(img.connections?.comment_connection, imgId, noteConnections);
        images.push({
            id: imgId,
            x: parseNumber(img.x, 100),
            y: parseNumber(img.y, 100),
            width: parseNumber(img.width, 200),
            height: parseNumber(img.height, 150),
            color: parseColor(img.color),
            data: parseString(img.data),
            hue: parseOptionalNumber(img.hue),
            saturation: parseOptionalNumber(img.saturation),
            brightness: parseOptionalNumber(img.brightness),
            alpha: parseOptionalNumber(img.alpha),
            fixAspectRatio: img.fix_aspect_ratio !== undefined ? parseBoolean(img.fix_aspect_ratio) : true
        });
    }
    // 5. Categories & CategorySettings
    const categories = [];
    const catSettingsNode = diagramNode.settings?.category_settings;
    const freeLayout = parseBoolean(catSettingsNode?.free_layout);
    const showReferredTables = parseBoolean(catSettingsNode?.show_referred_tables);
    let selectedCategoryId = null;
    for (const cat of ensureArray(catSettingsNode?.categories?.category)) {
        const catId = parseString(cat.id);
        const isSel = parseBoolean(cat.selected);
        if (isSel)
            selectedCategoryId = catId;
        categories.push({
            id: catId,
            name: parseString(cat.name),
            selected: isSel,
            x: parseNumber(cat.x, 0),
            y: parseNumber(cat.y, 0),
            width: parseNumber(cat.width, 400),
            height: parseNumber(cat.height, 300),
            color: parseColor(cat.color),
            nodeElementIds: ensureArray(cat.node_element).map((id) => parseString(id))
        });
    }
    // 6. Model Properties
    let modelProperties;
    const mpNode = diagramNode.settings?.model_properties;
    if (mpNode) {
        const props = ensureArray(mpNode.model_property).map((p) => ({
            name: parseString(p.name),
            value: parseString(p.value)
        }));
        modelProperties = {
            id: parseOptionalString(mpNode.id),
            x: parseNumber(mpNode.x, 50),
            y: parseNumber(mpNode.y, 50),
            width: parseNumber(mpNode.width, 220),
            height: parseNumber(mpNode.height, 120),
            color: parseColor(mpNode.color),
            display: parseBoolean(mpNode.display),
            creationDate: parseOptionalString(mpNode.creation_date),
            updatedDate: parseOptionalString(mpNode.updated_date),
            properties: props
        };
    }
    // 7. Sequences
    const sequences = [];
    for (const seq of ensureArray(diagramNode.sequence_set?.sequence)) {
        sequences.push({
            id: parseString(seq.name, `seq_${sequences.length}`),
            name: parseString(seq.name),
            schema: parseOptionalString(seq.schema),
            increment: parseOptionalNumber(seq.increment),
            minValue: parseOptionalNumber(seq.min_value),
            maxValue: parseOptionalNumber(seq.max_value),
            start: parseOptionalNumber(seq.start),
            cache: parseOptionalNumber(seq.cache),
            nocache: parseBoolean(seq.nocache),
            cycle: parseBoolean(seq.cycle),
            order: parseBoolean(seq.order),
            description: parseOptionalString(seq.description),
            dataType: parseOptionalString(seq.data_type),
            decimalSize: parseOptionalNumber(seq.decimal_size)
        });
    }
    // 8. Triggers
    const triggers = [];
    for (const trg of ensureArray(diagramNode.trigger_set?.trigger)) {
        triggers.push({
            id: parseString(trg.name, `trg_${triggers.length}`),
            name: parseString(trg.name),
            schema: parseOptionalString(trg.schema),
            sql: parseString(trg.sql),
            description: parseOptionalString(trg.description)
        });
    }
    // 9. Test Data
    const testDataList = [];
    for (const td of ensureArray(diagramNode.test_data_list?.test_data)) {
        const tableTestData = [];
        for (const ttd of ensureArray(td.table_test_data)) {
            const directTestData = [];
            for (const row of ensureArray(ttd.direct_test_data?.data)) {
                const values = {};
                for (const colVal of ensureArray(row.column_data)) {
                    values[parseString(colVal.column_id)] = parseString(colVal.value);
                }
                directTestData.push({ values });
            }
            tableTestData.push({
                tableId: parseString(ttd.table_id),
                directTestData,
                repeatCount: parseOptionalNumber(ttd.repeat_test_data?.test_data_num)
            });
        }
        testDataList.push({
            id: `td_${testDataList.length}`,
            name: parseString(td.name),
            tableTestData
        });
    }
    // 10. Change Tracking List
    const changeTrackingList = [];
    for (const ct of ensureArray(diagramNode.change_tracking_list?.change_tracking)) {
        changeTrackingList.push({
            id: `ct_${changeTrackingList.length}`,
            comment: parseString(ct.comment),
            updatedDate: parseString(ct.updated_date),
            tableNames: ensureArray(ct.table_name).map((n) => parseString(n)),
            tableCount: parseNumber(ct.table_count, 0),
            columnCount: parseNumber(ct.column_count, 0)
        });
    }
    // 11. Translation Entries
    const translations = [];
    for (const tr of ensureArray(diagramNode.settings?.translation_settings?.custom_translations?.entry)) {
        translations.push({
            id: `tr_${translations.length}`,
            logicalName: parseString(tr.logical_name),
            physicalName: parseString(tr.physical_name)
        });
    }
    return {
        db,
        x,
        y,
        zoom,
        viewMode,
        notation,
        tableStyle,
        notationLevel,
        capital,
        lockEdit: false,
        dictionary,
        tables,
        views,
        notes,
        noteConnections,
        images,
        relations,
        categories,
        categorySettings: {
            freeLayout,
            showReferredTables,
            selectedCategoryId
        },
        columnGroups,
        sequences,
        triggers,
        tablespaces,
        modelProperties,
        testDataList,
        changeTrackingList,
        translations,
        settings: diagramNode.settings
    };
}
//# sourceMappingURL=ermParser.js.map