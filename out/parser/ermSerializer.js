"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeERMXml = serializeERMXml;
function escapeXml(unsafe = "") {
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            case '"':
                return "&quot;";
            default:
                return c;
        }
    });
}
function serializeColor(lines, indent, color, fallback = { r: 128, g: 128, b: 192 }) {
    const c = color || fallback;
    lines.push(`${indent}<color>`);
    lines.push(`${indent}\t<r>${c.r}</r>`);
    lines.push(`${indent}\t<g>${c.g}</g>`);
    lines.push(`${indent}\t<b>${c.b}</b>`);
    lines.push(`${indent}</color>`);
}
function serializeNormalColumn(lines, indent, col, wordId, colId) {
    lines.push(`${indent}<normal_column>`);
    lines.push(`${indent}\t<word_id>${escapeXml(wordId)}</word_id>`);
    lines.push(`${indent}\t<id>${escapeXml(colId)}</id>`);
    if (col.referencedColumnId) {
        lines.push(`${indent}\t<referenced_column>${escapeXml(col.referencedColumnId)}</referenced_column>`);
    }
    if (col.relationId) {
        lines.push(`${indent}\t<relation>${escapeXml(col.relationId)}</relation>`);
    }
    lines.push(`${indent}\t<description>${escapeXml(col.description || "")}</description>`);
    lines.push(`${indent}\t<unique_key_name>${escapeXml(col.uniqueKeyName || "")}</unique_key_name>`);
    lines.push(`${indent}\t<logical_name>${escapeXml(col.logicalName || "")}</logical_name>`);
    lines.push(`${indent}\t<physical_name>${escapeXml(col.physicalName || "")}</physical_name>`);
    lines.push(`${indent}\t<type>${escapeXml(col.type || "")}</type>`);
    lines.push(`${indent}\t<constraint>${escapeXml(col.constraint || "")}</constraint>`);
    lines.push(`${indent}\t<default_value>${escapeXml(col.defaultValue || "")}</default_value>`);
    lines.push(`${indent}\t<auto_increment>${col.autoIncrement ? "true" : "false"}</auto_increment>`);
    lines.push(`${indent}\t<foreign_key>${col.foreignKey ? "true" : "false"}</foreign_key>`);
    lines.push(`${indent}\t<not_null>${col.notNull ? "true" : "false"}</not_null>`);
    lines.push(`${indent}\t<primary_key>${col.primaryKey ? "true" : "false"}</primary_key>`);
    lines.push(`${indent}\t<unique_key>${col.uniqueKey ? "true" : "false"}</unique_key>`);
    lines.push(`${indent}\t<character_set>${escapeXml(col.characterSet || "")}</character_set>`);
    lines.push(`${indent}\t<collation>${escapeXml(col.collation || "")}</collation>`);
    lines.push(`${indent}\t<sequence>${escapeXml(col.sequence || "")}</sequence>`);
    lines.push(`${indent}</normal_column>`);
}
function serializeCommentConnections(lines, indent, connections) {
    for (const cc of connections) {
        lines.push(`${indent}<comment_connection>`);
        lines.push(`${indent}\t<id>${escapeXml(cc.id)}</id>`);
        lines.push(`${indent}\t<source>${escapeXml(cc.sourceId)}</source>`);
        lines.push(`${indent}\t<target>${escapeXml(cc.targetId)}</target>`);
        if (cc.bendpoints) {
            for (const bp of cc.bendpoints) {
                lines.push(`${indent}\t<bendpoint>`);
                lines.push(`${indent}\t\t<relative>${bp.relative ? "true" : "false"}</relative>`);
                lines.push(`${indent}\t\t<x>${bp.x}</x>`);
                lines.push(`${indent}\t\t<y>${bp.y}</y>`);
                lines.push(`${indent}\t</bendpoint>`);
            }
        }
        lines.push(`${indent}</comment_connection>`);
    }
}
function serializeERMXml(diagram) {
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push("<diagram>");
    lines.push(`\t<db>${escapeXml(diagram.db || "PostgreSQL")}</db>`);
    lines.push(`\t<page_setting>`);
    lines.push(`\t\t<direction_horizontal>true</direction_horizontal>`);
    lines.push(`\t\t<scale>100</scale>`);
    lines.push(`\t\t<paper_size>A4 210 x 297 mm</paper_size>`);
    lines.push(`\t\t<top_margin>30</top_margin>`);
    lines.push(`\t\t<left_margin>30</left_margin>`);
    lines.push(`\t\t<bottom_margin>30</bottom_margin>`);
    lines.push(`\t\t<right_margin>30</right_margin>`);
    lines.push(`\t</page_setting>`);
    lines.push(`\t<category_index>0</category_index>`);
    lines.push(`\t<zoom>${diagram.zoom || 100}</zoom>`);
    lines.push(`\t<x>${diagram.x || 0}</x>`);
    lines.push(`\t<y>${diagram.y || 0}</y>`);
    lines.push(`\t<default_color>`);
    lines.push(`\t\t<r>128</r>`);
    lines.push(`\t\t<g>128</g>`);
    lines.push(`\t\t<b>192</b>`);
    lines.push(`\t</default_color>`);
    serializeColor(lines, "\t", undefined, { r: 255, g: 255, b: 255 });
    lines.push(`\t<font_name></font_name>`);
    lines.push(`\t<font_size>9</font_size>`);
    // Settings (database, view_mode, notation, table_style, notation_level, capital, categories, model_properties)
    const viewModeNum = diagram.viewMode === "logical"
        ? 0
        : diagram.viewMode === "physical"
            ? 1
            : 2;
    const notationLevelMap = {
        detail: 0,
        title: 1,
        column: 2,
        key: 3,
        exclude_type: 4,
        name_and_key: 5,
    };
    const notationLevelNum = notationLevelMap[diagram.notationLevel || "detail"] ?? 0;
    lines.push(`\t<settings>`);
    lines.push(`\t\t<database>${escapeXml(diagram.db || "PostgreSQL")}</database>`);
    lines.push(`\t\t<capital>${diagram.capital ? "true" : "false"}</capital>`);
    lines.push(`\t\t<table_style>${escapeXml(diagram.tableStyle || "frame")}</table_style>`);
    lines.push(`\t\t<notation>${escapeXml(diagram.notation || "IE")}</notation>`);
    lines.push(`\t\t<notation_level>${notationLevelNum}</notation_level>`);
    lines.push(`\t\t<view_mode>${viewModeNum}</view_mode>`);
    if ((diagram.translations || []).length > 0) {
        lines.push(`\t\t<translation_settings>`);
        lines.push(`\t\t\t<use>true</use>`);
        lines.push(`\t\t\t<custom_translations>`);
        for (const tr of diagram.translations || []) {
            lines.push(`\t\t\t\t<entry>`);
            lines.push(`\t\t\t\t\t<logical_name>${escapeXml(tr.logicalName)}</logical_name>`);
            lines.push(`\t\t\t\t\t<physical_name>${escapeXml(tr.physicalName)}</physical_name>`);
            lines.push(`\t\t\t\t</entry>`);
        }
        lines.push(`\t\t\t</custom_translations>`);
        lines.push(`\t\t</translation_settings>`);
    }
    lines.push(`\t\t<category_settings>`);
    lines.push(`\t\t\t<free_layout>${diagram.categorySettings?.freeLayout ? 'true' : 'false'}</free_layout>`);
    lines.push(`\t\t\t<show_referred_tables>${diagram.categorySettings?.showReferredTables ? 'true' : 'false'}</show_referred_tables>`);
    lines.push(`\t\t\t<categories>`);
    for (const cat of diagram.categories || []) {
        const isSel = diagram.categorySettings?.selectedCategoryId
            ? diagram.categorySettings.selectedCategoryId === cat.id
            : Boolean(cat.selected);
        lines.push(`\t\t\t\t<category>`);
        lines.push(`\t\t\t\t\t<id>${escapeXml(cat.id)}</id>`);
        lines.push(`\t\t\t\t\t<height>${Math.round(cat.height || 300)}</height>`);
        lines.push(`\t\t\t\t\t<width>${Math.round(cat.width || 400)}</width>`);
        lines.push(`\t\t\t\t\t<font_name></font_name>`);
        lines.push(`\t\t\t\t\t<font_size>9</font_size>`);
        lines.push(`\t\t\t\t\t<x>${Math.round(cat.x)}</x>`);
        lines.push(`\t\t\t\t\t<y>${Math.round(cat.y)}</y>`);
        serializeColor(lines, "\t\t\t\t\t", cat.color, { r: 137, g: 180, b: 250 });
        lines.push(`\t\t\t\t\t<name>${escapeXml(cat.name)}</name>`);
        lines.push(`\t\t\t\t\t<selected>${isSel ? "true" : "false"}</selected>`);
        for (const nodeId of cat.nodeElementIds || []) {
            lines.push(`\t\t\t\t\t<node_element>${escapeXml(nodeId)}</node_element>`);
        }
        lines.push(`\t\t\t\t</category>`);
    }
    lines.push(`\t\t\t</categories>`);
    lines.push(`\t\t</category_settings>`);
    if (diagram.modelProperties) {
        const mp = diagram.modelProperties;
        lines.push(`\t\t<model_properties>`);
        if (mp.id)
            lines.push(`\t\t\t<id>${escapeXml(mp.id)}</id>`);
        lines.push(`\t\t\t<height>${Math.round(mp.height || 120)}</height>`);
        lines.push(`\t\t\t<width>${Math.round(mp.width || 220)}</width>`);
        lines.push(`\t\t\t<font_name></font_name>`);
        lines.push(`\t\t\t<font_size>9</font_size>`);
        lines.push(`\t\t\t<x>${Math.round(mp.x)}</x>`);
        lines.push(`\t\t\t<y>${Math.round(mp.y)}</y>`);
        serializeColor(lines, "\t\t\t", mp.color, { r: 255, g: 255, b: 255 });
        lines.push(`\t\t\t<display>${mp.display ? "true" : "false"}</display>`);
        if (mp.creationDate)
            lines.push(`\t\t\t<creation_date>${escapeXml(mp.creationDate)}</creation_date>`);
        if (mp.updatedDate)
            lines.push(`\t\t\t<updated_date>${escapeXml(mp.updatedDate)}</updated_date>`);
        for (const prop of mp.properties || []) {
            lines.push(`\t\t\t<model_property>`);
            lines.push(`\t\t\t\t<name>${escapeXml(prop.name)}</name>`);
            lines.push(`\t\t\t\t<value>${escapeXml(prop.value)}</value>`);
            lines.push(`\t\t\t</model_property>`);
        }
        lines.push(`\t\t</model_properties>`);
    }
    lines.push(`\t</settings>`);
    // Dictionary: merge explicit dictionary words + any unmapped table/view/group columns
    const wordList = [...(diagram.dictionary || [])];
    const existingWordIds = new Set(wordList.map((w) => w.id));
    const wordKeyMap = new Map();
    let nextWordId = 0;
    for (const w of wordList) {
        const numId = Number(w.id);
        if (!isNaN(numId) && numId >= nextWordId)
            nextWordId = numId + 1;
        wordKeyMap.set(`${w.physicalName}_${w.logicalName}_${w.type}`, w.id);
    }
    const ensureWordForColumn = (col) => {
        if (col.wordId && existingWordIds.has(col.wordId)) {
            return col.wordId;
        }
        const key = `${col.physicalName}_${col.logicalName}_${col.type}`;
        const existing = wordKeyMap.get(key);
        if (existing)
            return existing;
        const newId = String(nextWordId++);
        wordKeyMap.set(key, newId);
        existingWordIds.add(newId);
        wordList.push({
            id: newId,
            physicalName: col.physicalName || "",
            logicalName: col.logicalName || "",
            description: col.description || "",
            type: col.type || "varchar",
            length: col.length,
            decimal: col.decimal,
        });
        return newId;
    };
    for (const t of diagram.tables) {
        t.columns.forEach(ensureWordForColumn);
    }
    for (const v of diagram.views || []) {
        v.columns.forEach(ensureWordForColumn);
    }
    for (const cg of diagram.columnGroups || []) {
        cg.columns.forEach(ensureWordForColumn);
    }
    lines.push(`\t<dictionary>`);
    for (const w of wordList) {
        lines.push(`\t\t<word>`);
        lines.push(`\t\t\t<id>${escapeXml(w.id)}</id>`);
        lines.push(`\t\t\t<length>${w.length ?? "null"}</length>`);
        lines.push(`\t\t\t<decimal>${w.decimal ?? "null"}</decimal>`);
        lines.push(`\t\t\t<array>${w.array ? "true" : "false"}</array>`);
        lines.push(`\t\t\t<array_dimension>${w.arrayDimension ?? "null"}</array_dimension>`);
        lines.push(`\t\t\t<unsigned>${w.unsigned ? "true" : "false"}</unsigned>`);
        lines.push(`\t\t\t<zerofill>${w.zerofill ? "true" : "false"}</zerofill>`);
        lines.push(`\t\t\t<binary>${w.binary ? "true" : "false"}</binary>`);
        lines.push(`\t\t\t<args>${escapeXml(w.args || "")}</args>`);
        lines.push(`\t\t\t<char_semantics>${w.charSemantics ? "true" : "false"}</char_semantics>`);
        lines.push(`\t\t\t<description>${escapeXml(w.description || "")}</description>`);
        lines.push(`\t\t\t<logical_name>${escapeXml(w.logicalName || "")}</logical_name>`);
        lines.push(`\t\t\t<physical_name>${escapeXml(w.physicalName || "")}</physical_name>`);
        lines.push(`\t\t\t<type>${escapeXml(w.type || "varchar")}</type>`);
        lines.push(`\t\t</word>`);
    }
    lines.push(`\t</dictionary>`);
    // Tablespaces
    lines.push(`\t<tablespace_set>`);
    for (const ts of diagram.tablespaces || []) {
        lines.push(`\t\t<tablespace>`);
        lines.push(`\t\t\t<id>${escapeXml(ts.id)}</id>`);
        lines.push(`\t\t\t<name>${escapeXml(ts.name)}</name>`);
        if (ts.description)
            lines.push(`\t\t\t<description>${escapeXml(ts.description)}</description>`);
        if (ts.properties) {
            lines.push(`\t\t\t<properties>`);
            for (const [k, v] of Object.entries(ts.properties)) {
                if (v !== undefined && v !== null) {
                    lines.push(`\t\t\t\t<${k}>${escapeXml(String(v))}</${k}>`);
                }
            }
            lines.push(`\t\t\t</properties>`);
        }
        lines.push(`\t\t</tablespace>`);
    }
    lines.push(`\t</tablespace_set>`);
    // Contents
    lines.push(`\t<contents>`);
    let colIdCounter = 0;
    // Tables
    for (let tIndex = 0; tIndex < diagram.tables.length; tIndex++) {
        const table = diagram.tables[tIndex];
        const tableId = table.id || String(tIndex);
        lines.push(`\t\t<table>`);
        lines.push(`\t\t\t<id>${escapeXml(tableId)}</id>`);
        lines.push(`\t\t\t<height>${table.height || 100}</height>`);
        lines.push(`\t\t\t<width>${table.width || 160}</width>`);
        lines.push(`\t\t\t<font_name></font_name>`);
        lines.push(`\t\t\t<font_size>9</font_size>`);
        lines.push(`\t\t\t<x>${Math.round(table.x)}</x>`);
        lines.push(`\t\t\t<y>${Math.round(table.y)}</y>`);
        serializeColor(lines, "\t\t\t", table.color, { r: 128, g: 128, b: 192 });
        // Incomings (Relations + CommentConnections)
        const incomingRelations = diagram.relations.filter((r) => r.targetTableId === table.id);
        const incomingComments = (diagram.noteConnections || []).filter((c) => c.targetId === table.id);
        lines.push(`\t\t\t<connections>`);
        for (const rel of incomingRelations) {
            lines.push(`\t\t\t\t<relation>`);
            lines.push(`\t\t\t\t\t<id>${escapeXml(rel.id)}</id>`);
            lines.push(`\t\t\t\t\t<source>${escapeXml(rel.sourceTableId)}</source>`);
            lines.push(`\t\t\t\t\t<target>${escapeXml(rel.targetTableId)}</target>`);
            lines.push(`\t\t\t\t\t<name>${escapeXml(rel.name)}</name>`);
            lines.push(`\t\t\t\t\t<parent_cardinality>${escapeXml(rel.parentCardinality || "1")}</parent_cardinality>`);
            lines.push(`\t\t\t\t\t<child_cardinality>${escapeXml(rel.childCardinality || "0..n")}</child_cardinality>`);
            lines.push(`\t\t\t\t\t<reference_for_pk>${rel.referenceForPK ? "true" : "false"}</reference_for_pk>`);
            if (rel.referencedComplexUniqueKeyId) {
                lines.push(`\t\t\t\t\t<referenced_complex_unique_key>${escapeXml(rel.referencedComplexUniqueKeyId)}</referenced_complex_unique_key>`);
            }
            lines.push(`\t\t\t\t\t<on_delete_action>${escapeXml(rel.onDeleteAction || "RESTRICT")}</on_delete_action>`);
            lines.push(`\t\t\t\t\t<on_update_action>${escapeXml(rel.onUpdateAction || "RESTRICT")}</on_update_action>`);
            if (rel.sourceColumnIds && rel.sourceColumnIds.length > 0) {
                lines.push(`\t\t\t\t\t<source_column_ids>`);
                for (const cid of rel.sourceColumnIds) {
                    lines.push(`\t\t\t\t\t\t<column_id>${escapeXml(cid)}</column_id>`);
                }
                lines.push(`\t\t\t\t\t</source_column_ids>`);
            }
            if (rel.targetColumnIds && rel.targetColumnIds.length > 0) {
                lines.push(`\t\t\t\t\t<target_column_ids>`);
                for (const cid of rel.targetColumnIds) {
                    lines.push(`\t\t\t\t\t\t<column_id>${escapeXml(cid)}</column_id>`);
                }
                lines.push(`\t\t\t\t\t</target_column_ids>`);
            }
            if (rel.bendpoints && rel.bendpoints.length > 0) {
                lines.push(`\t\t\t\t\t<bendpoint_list>`);
                for (const bp of rel.bendpoints) {
                    lines.push(`\t\t\t\t\t\t<bendpoint>`);
                    lines.push(`\t\t\t\t\t\t\t<relative>${bp.relative ? "true" : "false"}</relative>`);
                    lines.push(`\t\t\t\t\t\t\t<x>${bp.x}</x>`);
                    lines.push(`\t\t\t\t\t\t\t<y>${bp.y}</y>`);
                    lines.push(`\t\t\t\t\t\t</bendpoint>`);
                }
                lines.push(`\t\t\t\t\t</bendpoint_list>`);
            }
            lines.push(`\t\t\t\t</relation>`);
        }
        serializeCommentConnections(lines, "\t\t\t\t", incomingComments);
        lines.push(`\t\t\t</connections>`);
        lines.push(`\t\t\t<physical_name>${escapeXml(table.physicalName)}</physical_name>`);
        lines.push(`\t\t\t<logical_name>${escapeXml(table.logicalName)}</logical_name>`);
        lines.push(`\t\t\t<description>${escapeXml(table.description || "")}</description>`);
        lines.push(`\t\t\t<constraint>${escapeXml(table.constraint || "")}</constraint>`);
        lines.push(`\t\t\t<primary_key_name>${escapeXml(table.primaryKeyName || "")}</primary_key_name>`);
        lines.push(`\t\t\t<option>${escapeXml(table.option || "")}</option>`);
        // Columns + ColumnGroups
        lines.push(`\t\t\t<columns>`);
        for (const col of table.columns) {
            const wordId = ensureWordForColumn(col);
            const colId = col.id || String(colIdCounter++);
            serializeNormalColumn(lines, "\t\t\t\t", col, wordId, colId);
        }
        for (const cgId of table.columnGroupIds || []) {
            lines.push(`\t\t\t\t<column_group>${escapeXml(cgId)}</column_group>`);
        }
        lines.push(`\t\t\t</columns>`);
        // Indexes
        lines.push(`\t\t\t<indexes>`);
        for (const idx of table.indexes || []) {
            lines.push(`\t\t\t\t<inidex>`);
            lines.push(`\t\t\t\t\t<full_text>${idx.fullText ? "true" : "false"}</full_text>`);
            lines.push(`\t\t\t\t\t<non_unique>${idx.nonUnique ? "true" : "false"}</non_unique>`);
            lines.push(`\t\t\t\t\t<name>${escapeXml(idx.name)}</name>`);
            lines.push(`\t\t\t\t\t<type>${escapeXml(idx.type || "")}</type>`);
            lines.push(`\t\t\t\t\t<description>${escapeXml(idx.description || "")}</description>`);
            lines.push(`\t\t\t\t\t<columns>`);
            for (const ic of idx.columns) {
                lines.push(`\t\t\t\t\t\t<column>`);
                lines.push(`\t\t\t\t\t\t\t<id>${escapeXml(ic.columnId)}</id>`);
                lines.push(`\t\t\t\t\t\t\t<desc>${ic.order === "DESC" ? "true" : "false"}</desc>`);
                lines.push(`\t\t\t\t\t\t</column>`);
            }
            lines.push(`\t\t\t\t\t</columns>`);
            lines.push(`\t\t\t\t</inidex>`);
        }
        lines.push(`\t\t\t</indexes>`);
        // Complex Unique Keys
        lines.push(`\t\t\t<complex_unique_key_list>`);
        for (const cuk of table.complexUniqueKeys || []) {
            lines.push(`\t\t\t\t<complex_unique_key>`);
            lines.push(`\t\t\t\t\t<id>${escapeXml(cuk.id)}</id>`);
            lines.push(`\t\t\t\t\t<name>${escapeXml(cuk.name)}</name>`);
            lines.push(`\t\t\t\t\t<columns>`);
            for (const colId of cuk.columns) {
                lines.push(`\t\t\t\t\t\t<column>`);
                lines.push(`\t\t\t\t\t\t\t<id>${escapeXml(colId)}</id>`);
                lines.push(`\t\t\t\t\t\t</column>`);
            }
            lines.push(`\t\t\t\t\t</columns>`);
            lines.push(`\t\t\t\t</complex_unique_key>`);
        }
        lines.push(`\t\t\t</complex_unique_key_list>`);
        // Table Properties
        if (table.tableProperties) {
            const tp = table.tableProperties;
            lines.push(`\t\t\t<table_properties>`);
            if (tp.tablespaceId)
                lines.push(`\t\t\t\t<tablespace_id>${escapeXml(tp.tablespaceId)}</tablespace_id>`);
            lines.push(`\t\t\t\t<schema>${escapeXml(tp.schema || "")}</schema>`);
            if (tp.characterSet)
                lines.push(`\t\t\t\t<character_set>${escapeXml(tp.characterSet)}</character_set>`);
            if (tp.collation)
                lines.push(`\t\t\t\t<collation>${escapeXml(tp.collation)}</collation>`);
            if (tp.storageEngine)
                lines.push(`\t\t\t\t<storage_engine>${escapeXml(tp.storageEngine)}</storage_engine>`);
            if (tp.primaryKeyLengthOfText !== undefined) {
                lines.push(`\t\t\t\t<primary_key_length_of_text>${tp.primaryKeyLengthOfText}</primary_key_length_of_text>`);
            }
            lines.push(`\t\t\t\t<without_oids>${tp.withoutOIDs ? "true" : "false"}</without_oids>`);
            lines.push(`\t\t\t</table_properties>`);
        }
        lines.push(`\t\t</table>`);
    }
    // Views
    for (let vIndex = 0; vIndex < (diagram.views || []).length; vIndex++) {
        const view = diagram.views[vIndex];
        const viewId = view.id || `view_${vIndex}`;
        lines.push(`\t\t<view>`);
        lines.push(`\t\t\t<id>${escapeXml(viewId)}</id>`);
        lines.push(`\t\t\t<height>${view.height || 120}</height>`);
        lines.push(`\t\t\t<width>${view.width || 180}</width>`);
        lines.push(`\t\t\t<font_name></font_name>`);
        lines.push(`\t\t\t<font_size>9</font_size>`);
        lines.push(`\t\t\t<x>${Math.round(view.x)}</x>`);
        lines.push(`\t\t\t<y>${Math.round(view.y)}</y>`);
        serializeColor(lines, "\t\t\t", view.color, { r: 166, g: 227, b: 161 });
        const incomingComments = (diagram.noteConnections || []).filter((c) => c.targetId === view.id);
        lines.push(`\t\t\t<connections>`);
        serializeCommentConnections(lines, "\t\t\t\t", incomingComments);
        lines.push(`\t\t\t</connections>`);
        lines.push(`\t\t\t<physical_name>${escapeXml(view.physicalName)}</physical_name>`);
        lines.push(`\t\t\t<logical_name>${escapeXml(view.logicalName)}</logical_name>`);
        lines.push(`\t\t\t<description>${escapeXml(view.description || "")}</description>`);
        lines.push(`\t\t\t<sql>${escapeXml(view.sql || "")}</sql>`);
        lines.push(`\t\t\t<columns>`);
        for (const col of view.columns || []) {
            const wordId = ensureWordForColumn(col);
            const colId = col.id || String(colIdCounter++);
            serializeNormalColumn(lines, "\t\t\t\t", col, wordId, colId);
        }
        for (const cgId of view.columnGroupIds || []) {
            lines.push(`\t\t\t\t<column_group>${escapeXml(cgId)}</column_group>`);
        }
        lines.push(`\t\t\t</columns>`);
        lines.push(`\t\t\t<view_properties>`);
        lines.push(`\t\t\t\t<schema>${escapeXml(view.schema || "")}</schema>`);
        lines.push(`\t\t\t</view_properties>`);
        lines.push(`\t\t</view>`);
    }
    // Notes
    for (let nIndex = 0; nIndex < diagram.notes.length; nIndex++) {
        const note = diagram.notes[nIndex];
        const incomingComments = (diagram.noteConnections || []).filter((c) => c.targetId === note.id);
        lines.push(`\t\t<note>`);
        lines.push(`\t\t\t<id>${escapeXml(note.id || String(nIndex))}</id>`);
        lines.push(`\t\t\t<height>${note.height || 80}</height>`);
        lines.push(`\t\t\t<width>${note.width || 150}</width>`);
        lines.push(`\t\t\t<font_name></font_name>`);
        lines.push(`\t\t\t<font_size>9</font_size>`);
        lines.push(`\t\t\t<x>${Math.round(note.x)}</x>`);
        lines.push(`\t\t\t<y>${Math.round(note.y)}</y>`);
        serializeColor(lines, "\t\t\t", note.color, { r: 255, g: 255, b: 128 });
        lines.push(`\t\t\t<connections>`);
        serializeCommentConnections(lines, "\t\t\t\t", incomingComments);
        lines.push(`\t\t\t</connections>`);
        lines.push(`\t\t\t<text>${escapeXml(note.text)}</text>`);
        lines.push(`\t\t</note>`);
    }
    // Images
    for (let iIndex = 0; iIndex < (diagram.images || []).length; iIndex++) {
        const img = diagram.images[iIndex];
        const incomingComments = (diagram.noteConnections || []).filter((c) => c.targetId === img.id);
        lines.push(`\t\t<image>`);
        lines.push(`\t\t\t<id>${escapeXml(img.id || `img_${iIndex}`)}</id>`);
        lines.push(`\t\t\t<height>${Math.round(img.height || 150)}</height>`);
        lines.push(`\t\t\t<width>${Math.round(img.width || 200)}</width>`);
        lines.push(`\t\t\t<font_name></font_name>`);
        lines.push(`\t\t\t<font_size>9</font_size>`);
        lines.push(`\t\t\t<x>${Math.round(img.x)}</x>`);
        lines.push(`\t\t\t<y>${Math.round(img.y)}</y>`);
        serializeColor(lines, "\t\t\t", img.color, { r: 255, g: 255, b: 255 });
        lines.push(`\t\t\t<connections>`);
        serializeCommentConnections(lines, "\t\t\t\t", incomingComments);
        lines.push(`\t\t\t</connections>`);
        lines.push(`\t\t\t<data>${escapeXml(img.data)}</data>`);
        lines.push(`\t\t\t<hue>${img.hue ?? 0}</hue>`);
        lines.push(`\t\t\t<saturation>${img.saturation ?? 0}</saturation>`);
        lines.push(`\t\t\t<brightness>${img.brightness ?? 0}</brightness>`);
        lines.push(`\t\t\t<alpha>${img.alpha ?? 255}</alpha>`);
        lines.push(`\t\t\t<fix_aspect_ratio>${img.fixAspectRatio !== false ? "true" : "false"}</fix_aspect_ratio>`);
        lines.push(`\t\t</image>`);
    }
    lines.push(`\t</contents>`);
    // Column Groups
    lines.push(`\t<column_groups>`);
    for (const cg of diagram.columnGroups || []) {
        lines.push(`\t\t<column_group>`);
        lines.push(`\t\t\t<id>${escapeXml(cg.id)}</id>`);
        lines.push(`\t\t\t<group_name>${escapeXml(cg.groupName)}</group_name>`);
        lines.push(`\t\t\t<columns>`);
        for (const col of cg.columns) {
            const wordId = ensureWordForColumn(col);
            const colId = col.id || String(colIdCounter++);
            serializeNormalColumn(lines, "\t\t\t\t", col, wordId, colId);
        }
        lines.push(`\t\t\t</columns>`);
        lines.push(`\t\t</column_group>`);
    }
    lines.push(`\t</column_groups>`);
    // Test Data List
    lines.push(`\t<test_data_list>`);
    for (const td of diagram.testDataList || []) {
        lines.push(`\t\t<test_data>`);
        lines.push(`\t\t\t<name>${escapeXml(td.name)}</name>`);
        for (const ttd of td.tableTestData || []) {
            lines.push(`\t\t\t<table_test_data>`);
            lines.push(`\t\t\t\t<table_id>${escapeXml(ttd.tableId)}</table_id>`);
            lines.push(`\t\t\t\t<direct_test_data>`);
            for (const row of ttd.directTestData || []) {
                lines.push(`\t\t\t\t\t<data>`);
                for (const [colId, val] of Object.entries(row.values)) {
                    lines.push(`\t\t\t\t\t\t<column_data>`);
                    lines.push(`\t\t\t\t\t\t\t<column_id>${escapeXml(colId)}</column_id>`);
                    lines.push(`\t\t\t\t\t\t\t<value>${escapeXml(val)}</value>`);
                    lines.push(`\t\t\t\t\t\t</column_data>`);
                }
                lines.push(`\t\t\t\t\t</data>`);
            }
            lines.push(`\t\t\t\t</direct_test_data>`);
            lines.push(`\t\t\t</table_test_data>`);
        }
        lines.push(`\t\t</test_data>`);
    }
    lines.push(`\t</test_data_list>`);
    // Sequence Set
    lines.push(`\t<sequence_set>`);
    for (const seq of diagram.sequences || []) {
        lines.push(`\t\t<sequence>`);
        lines.push(`\t\t\t<name>${escapeXml(seq.name)}</name>`);
        lines.push(`\t\t\t<schema>${escapeXml(seq.schema || "")}</schema>`);
        lines.push(`\t\t\t<increment>${seq.increment ?? ""}</increment>`);
        lines.push(`\t\t\t<min_value>${seq.minValue ?? ""}</min_value>`);
        lines.push(`\t\t\t<max_value>${seq.maxValue ?? ""}</max_value>`);
        lines.push(`\t\t\t<start>${seq.start ?? ""}</start>`);
        lines.push(`\t\t\t<cache>${seq.cache ?? ""}</cache>`);
        lines.push(`\t\t\t<nocache>${seq.nocache ? "true" : "false"}</nocache>`);
        lines.push(`\t\t\t<cycle>${seq.cycle ? "true" : "false"}</cycle>`);
        lines.push(`\t\t\t<order>${seq.order ? "true" : "false"}</order>`);
        lines.push(`\t\t\t<description>${escapeXml(seq.description || "")}</description>`);
        lines.push(`\t\t\t<data_type>${escapeXml(seq.dataType || "")}</data_type>`);
        lines.push(`\t\t\t<decimal_size>${seq.decimalSize ?? ""}</decimal_size>`);
        lines.push(`\t\t</sequence>`);
    }
    lines.push(`\t</sequence_set>`);
    // Trigger Set
    lines.push(`\t<trigger_set>`);
    for (const trg of diagram.triggers || []) {
        lines.push(`\t\t<trigger>`);
        lines.push(`\t\t\t<name>${escapeXml(trg.name)}</name>`);
        lines.push(`\t\t\t<schema>${escapeXml(trg.schema || "")}</schema>`);
        lines.push(`\t\t\t<sql>${escapeXml(trg.sql)}</sql>`);
        lines.push(`\t\t\t<description>${escapeXml(trg.description || "")}</description>`);
        lines.push(`\t\t</trigger>`);
    }
    lines.push(`\t</trigger_set>`);
    lines.push(`\t<change_tracking_list>`);
    for (const ct of diagram.changeTrackingList || []) {
        lines.push(`\t\t<change_tracking>`);
        lines.push(`\t\t\t<comment>${escapeXml(ct.comment)}</comment>`);
        lines.push(`\t\t\t<updated_date>${escapeXml(ct.updatedDate)}</updated_date>`);
        lines.push(`\t\t\t<table_count>${ct.tableCount}</table_count>`);
        lines.push(`\t\t\t<column_count>${ct.columnCount}</column_count>`);
        for (const tn of ct.tableNames || []) {
            lines.push(`\t\t\t<table_name>${escapeXml(tn)}</table_name>`);
        }
        lines.push(`\t\t</change_tracking>`);
    }
    lines.push(`\t</change_tracking_list>`);
    lines.push(`</diagram>`);
    return lines.join("\n");
}
//# sourceMappingURL=ermSerializer.js.map