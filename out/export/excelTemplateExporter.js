"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuiltinTemplates = getBuiltinTemplates;
exports.exportExcelFromTemplate = exportExcelFromTemplate;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function getBuiltinTemplates(extensionPath) {
    const templatesDir = path.join(extensionPath, 'templates');
    const candidates = [
        { id: 'template_ko.xls', label: '한국어 기본 템플릿 (template_ko.xls)' },
        { id: 'template_en.xls', label: '영어 기본 템플릿 (template_en.xls)' },
        { id: 'template_ja.xls', label: '일본어 기본 템플릿 (template_ja.xls)' }
    ];
    return candidates
        .map((c) => ({
        ...c,
        filePath: path.join(templatesDir, c.id),
        isBuiltin: true
    }))
        .filter((t) => fs.existsSync(t.filePath));
}
async function exportExcelFromTemplate(extensionPath, diagram, templatePath, outputPath, useLogicalNameAsSheetName, imageDataUrl) {
    const jdbcClassDir = path.join(extensionPath, 'dist', 'jdbc');
    const poiJar = path.join(extensionPath, 'lib', 'poi-3.7-20101029.jar');
    const cp = `${jdbcClassDir}${path.delimiter}${poiJar}`;
    const tableById = new Map(diagram.tables.map((t) => [t.id, t]));
    const imageBase64 = imageDataUrl
        ? imageDataUrl.replace(/^data:image\/png;base64,/, '')
        : '';
    const payload = {
        templatePath,
        outputPath,
        useLogicalNameAsSheetName,
        imageBase64,
        tables: diagram.tables.map((t) => {
            const incomingRels = (diagram.relations || []).filter((r) => r.targetTableId === t.id);
            return {
                physicalName: t.physicalName || '',
                logicalName: t.logicalName || '',
                description: t.description || '',
                constraint: t.constraint || '',
                columns: t.columns.map((c) => {
                    let fkTargetTablePhysical = '';
                    let fkTargetTableLogical = '';
                    let fkTargetColPhysical = '';
                    let fkTargetColLogical = '';
                    let fkName = '';
                    for (const rel of incomingRels) {
                        const tgtIdx = (rel.targetColumnIds || []).indexOf(c.id);
                        if (tgtIdx >= 0) {
                            const srcTable = tableById.get(rel.sourceTableId);
                            const srcColId = (rel.sourceColumnIds || [])[tgtIdx];
                            const srcCol = srcTable?.columns.find((sc) => sc.id === srcColId);
                            fkTargetTablePhysical = srcTable?.physicalName || '';
                            fkTargetTableLogical = srcTable?.logicalName || '';
                            fkTargetColPhysical = srcCol?.physicalName || '';
                            fkTargetColLogical = srcCol?.logicalName || '';
                            fkName = rel.name || '';
                            break;
                        }
                    }
                    return {
                        id: c.id || '',
                        physicalName: c.physicalName || '',
                        logicalName: c.logicalName || '',
                        type: c.type || '',
                        length: c.length !== undefined ? String(c.length) : '',
                        decimal: c.decimal !== undefined ? String(c.decimal) : '',
                        primaryKey: Boolean(c.primaryKey),
                        notNull: Boolean(c.notNull),
                        uniqueKey: Boolean(c.uniqueKey),
                        foreignKey: Boolean(c.foreignKey) || Boolean(fkTargetTablePhysical),
                        autoIncrement: Boolean(c.autoIncrement),
                        defaultValue: c.defaultValue || '',
                        description: c.description || '',
                        fkTargetTablePhysical,
                        fkTargetTableLogical,
                        fkTargetColPhysical,
                        fkTargetColLogical,
                        fkName
                    };
                }),
                indexes: (t.indexes || []).map((idx) => ({
                    name: idx.name || '',
                    columns: (idx.columns || []).map((ic) => {
                        const col = t.columns.find((c) => c.id === ic.columnId);
                        return col ? col.physicalName : ic.columnId || '';
                    })
                })),
                complexUniqueKeys: (t.complexUniqueKeys || []).map((cuk) => ({
                    name: cuk.name || '',
                    columns: cuk.columns || []
                }))
            };
        }),
        indexes: diagram.tables.flatMap((t) => (t.indexes || []).map((idx) => ({
            name: idx.name || '',
            type: idx.type || '',
            nonUnique: Boolean(idx.nonUnique),
            description: idx.description || '',
            tablePhysical: t.physicalName || '',
            tableLogical: t.logicalName || '',
            columns: (idx.columns || [])
                .map((ic) => {
                const col = t.columns.find((c) => c.id === ic.columnId);
                return col ? col.physicalName : ic.columnId || '';
            })
                .join(', ')
        }))),
        views: (diagram.views || []).map((v) => ({
            physicalName: v.physicalName || '',
            logicalName: v.logicalName || '',
            description: v.description || '',
            sql: v.sql || '',
            columns: (v.columns || []).map((c) => ({
                physicalName: c.physicalName || '',
                logicalName: c.logicalName || '',
                type: c.type || '',
                length: c.length !== undefined ? String(c.length) : '',
                decimal: c.decimal !== undefined ? String(c.decimal) : '',
                description: c.description || ''
            }))
        })),
        sequences: (diagram.sequences || []).map((s) => ({
            name: s.name || '',
            description: s.description || '',
            increment: s.increment !== undefined ? String(s.increment) : '',
            minValue: s.minValue !== undefined ? String(s.minValue) : '',
            maxValue: s.maxValue !== undefined ? String(s.maxValue) : '',
            start: s.start !== undefined ? String(s.start) : '',
            cache: s.cache !== undefined ? String(s.cache) : '',
            cycle: Boolean(s.cycle)
        })),
        triggers: (diagram.triggers || []).map((tr) => ({
            name: tr.name || '',
            description: tr.description || '',
            sql: tr.sql || ''
        })),
        categories: (diagram.categories || []).map((cat) => ({
            name: cat.name || ''
        })),
        history: (diagram.changeTrackingList || []).map((h) => ({
            date: h.updatedDate || '',
            comment: h.comment || ''
        }))
    };
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)('java', ['-cp', cp, 'ExcelTemplateExporter'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
        child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });
        child.on('error', (err) => {
            reject(new Error(`Java 실행 실패: ${err.message}`));
        });
        child.on('close', (code) => {
            const trimmed = stdout.trim();
            if (!trimmed) {
                reject(new Error(stderr.trim() || `Excel 생성 프로세스 종료 코드 ${code}`));
                return;
            }
            try {
                const res = JSON.parse(trimmed.split(/\r?\n/).pop() || '{}');
                if (!res.ok) {
                    reject(new Error(res.error || 'Excel 템플릿 내보내기 실패'));
                    return;
                }
                resolve();
            }
            catch (e) {
                reject(new Error(`응답 파싱 실패: ${trimmed}`));
            }
        });
        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
    });
}
//# sourceMappingURL=excelTemplateExporter.js.map