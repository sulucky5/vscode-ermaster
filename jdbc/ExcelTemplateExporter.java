import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFCellStyle;
import org.apache.poi.hssf.usermodel.HSSFClientAnchor;
import org.apache.poi.hssf.usermodel.HSSFHyperlink;
import org.apache.poi.hssf.usermodel.HSSFPatriarch;
import org.apache.poi.hssf.usermodel.HSSFPicture;
import org.apache.poi.hssf.usermodel.HSSFRichTextString;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddress;

public class ExcelTemplateExporter {

    private static final Set<String> TEMPLATE_SHEETS = new HashSet<>(Arrays.asList(
        "table_template", "all_tables_template", "index_template", "all_indices_template",
        "sequence_template", "all_sequences_template", "view_template", "all_views_template", "all_view_template",
        "trigger_template", "all_triggers_template", "all_trigger_template", "column_template", "sheet_index_template",
        "category_template", "history_template", "loops", "words"
    ));

    private static boolean isTemplateSheet(String name) {
        return name != null && (TEMPLATE_SHEETS.contains(name) || name.endsWith("_template"));
    }

    static class SheetMeta {
        String sheetName;
        String sheetType;
        String logicalName;
        String physicalName;
        String description;

        SheetMeta(String sheetName, String sheetType, String logicalName, String physicalName, String description) {
            this.sheetName = sheetName;
            this.sheetType = sheetType;
            this.logicalName = logicalName;
            this.physicalName = physicalName;
            this.description = description;
        }
    }

    static class LoopDef {
        int startLine;
        int spaceLine;
        String sheetName;

        LoopDef(int startLine, int spaceLine, String sheetName) {
            this.startLine = startLine;
            this.spaceLine = spaceLine;
            this.sheetName = sheetName;
        }
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            Map<String, Object> root = (Map<String, Object>) new JsonParser(sb.toString()).parse();

            String templatePath = str(root.get("templatePath"));
            String outputPath = str(root.get("outputPath"));
            boolean useLogicalSheet = bool(root.get("useLogicalNameAsSheetName"));
            String imageBase64 = str(root.get("imageBase64"));

            List<Map<String, Object>> tables = listOfMaps(root.get("tables"));
            List<Map<String, Object>> indexes = listOfMaps(root.get("indexes"));
            List<Map<String, Object>> views = listOfMaps(root.get("views"));
            List<Map<String, Object>> sequences = listOfMaps(root.get("sequences"));
            List<Map<String, Object>> triggers = listOfMaps(root.get("triggers"));
            List<Map<String, Object>> categories = listOfMaps(root.get("categories"));
            List<Map<String, Object>> history = listOfMaps(root.get("history"));

            HSSFWorkbook wb;
            try (FileInputStream fis = new FileInputStream(templatePath)) {
                wb = new HSSFWorkbook(fis);
            }

            Map<String, String> words = readWordsSheet(wb);
            Map<String, LoopDef> loops = readLoopsSheet(wb);
            Set<String> usedSheetNames = new HashSet<>();
            for (int i = 0; i < wb.getNumberOfSheets(); i++) {
                String n = wb.getSheetName(i);
                if (!isTemplateSheet(n)) {
                    usedSheetNames.add(n);
                }
            }

            int pictureIdx = -1;
            if (!imageBase64.isEmpty()) {
                byte[] imgBytes = Base64.getDecoder().decode(imageBase64);
                pictureIdx = wb.addPicture(imgBytes, HSSFWorkbook.PICTURE_TYPE_PNG);
            }

            List<SheetMeta> createdSheets = new ArrayList<>();

            // 1. table_template
            int tableTplIdx = wb.getSheetIndex("table_template");
            if (tableTplIdx >= 0) {
                for (Map<String, Object> t : tables) {
                    HSSFSheet sheet = wb.cloneSheet(tableTplIdx);
                    String rawName = useLogicalSheet && !str(t.get("logicalName")).isEmpty()
                        ? str(t.get("logicalName")) : str(t.get("physicalName"));
                    String safeName = makeUniqueSheetName(rawName, usedSheetNames);
                    wb.setSheetName(wb.getSheetIndex(sheet), safeName);
                    fillTableSheet(sheet, t, words);
                    createdSheets.add(new SheetMeta(
                        safeName,
                        words.getOrDefault("sheet.type.table", "Table"),
                        str(t.get("logicalName")),
                        str(t.get("physicalName")),
                        str(t.get("description"))
                    ));
                }
            }

            // 2. all_tables_template
            int allTablesIdx = wb.getSheetIndex("all_tables_template");
            if (allTablesIdx >= 0 && !tables.isEmpty()) {
                LoopDef ld = loops.getOrDefault("all_tables_template", new LoopDef(1, 2, "All Tables"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "All Tables", usedSheetNames);
                HSSFSheet tplSheet = wb.getSheetAt(allTablesIdx);
                HSSFSheet newSheet = wb.cloneSheet(allTablesIdx);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                fillAllTablesSheet(tplSheet, newSheet, tables, ld, words);
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.all_tables", "All Tables"),
                    targetName, targetName, ""
                ));
            }

            // 3. view_template & all_views_template
            int viewTplIdx = wb.getSheetIndex("view_template");
            if (viewTplIdx >= 0) {
                for (Map<String, Object> v : views) {
                    HSSFSheet sheet = wb.cloneSheet(viewTplIdx);
                    String rawName = useLogicalSheet && !str(v.get("logicalName")).isEmpty()
                        ? str(v.get("logicalName")) : str(v.get("physicalName"));
                    String safeName = makeUniqueSheetName(rawName, usedSheetNames);
                    wb.setSheetName(wb.getSheetIndex(sheet), safeName);
                    fillViewSheet(sheet, v);
                    createdSheets.add(new SheetMeta(
                        safeName,
                        words.getOrDefault("sheet.type.view", "View"),
                        str(v.get("logicalName")),
                        str(v.get("physicalName")),
                        str(v.get("description"))
                    ));
                }
            }

            int allViewsIdx = wb.getSheetIndex("all_views_template");
            if (allViewsIdx < 0) allViewsIdx = wb.getSheetIndex("all_view_template");
            if (allViewsIdx >= 0 && !views.isEmpty()) {
                String tplName = wb.getSheetName(allViewsIdx);
                LoopDef ld = loops.getOrDefault(tplName, new LoopDef(1, 2, "All Views"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "All Views", usedSheetNames);
                HSSFSheet tplSheet = wb.getSheetAt(allViewsIdx);
                HSSFSheet newSheet = wb.cloneSheet(allViewsIdx);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                fillAllViewsSheet(tplSheet, newSheet, views, ld);
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.all_views", "All Views"),
                    targetName, targetName, ""
                ));
            }

            // 4. index_template & all_indices_template
            int idxTpl = wb.getSheetIndex("index_template");
            if (idxTpl >= 0) {
                for (Map<String, Object> ix : indexes) {
                    HSSFSheet sheet = wb.cloneSheet(idxTpl);
                    String safeName = makeUniqueSheetName(str(ix.get("name")), usedSheetNames);
                    wb.setSheetName(wb.getSheetIndex(sheet), safeName);
                    fillIndexEntitySheet(sheet, ix, words);
                    createdSheets.add(new SheetMeta(
                        safeName,
                        words.getOrDefault("sheet.type.index", "Index"),
                        str(ix.get("name")),
                        str(ix.get("name")),
                        str(ix.get("description"))
                    ));
                }
            }

            int allIdxTpl = wb.getSheetIndex("all_indices_template");
            if (allIdxTpl >= 0 && !indexes.isEmpty()) {
                LoopDef ld = loops.getOrDefault("all_indices_template", new LoopDef(1, 1, "All Indices"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "All Indices", usedSheetNames);
                HSSFSheet newSheet = wb.cloneSheet(allIdxTpl);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                fillListTemplateSheet(newSheet, indexes, (row, item, ord) -> replaceIndexRow(row, item, ord, words),
                    "$PIN", "$PTN", "$PCN");
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.all_indices", "All Indices"),
                    targetName, targetName, ""
                ));
            }

            // 5. sequence_template & all_sequences_template
            int seqTpl = wb.getSheetIndex("sequence_template");
            if (seqTpl >= 0) {
                for (Map<String, Object> seq : sequences) {
                    HSSFSheet sheet = wb.cloneSheet(seqTpl);
                    String safeName = makeUniqueSheetName(str(seq.get("name")), usedSheetNames);
                    wb.setSheetName(wb.getSheetIndex(sheet), safeName);
                    fillSequenceSheet(sheet, seq, words);
                    createdSheets.add(new SheetMeta(
                        safeName,
                        words.getOrDefault("sheet.type.sequence", "Sequence"),
                        str(seq.get("name")),
                        str(seq.get("name")),
                        str(seq.get("description"))
                    ));
                }
            }

            int allSeqTpl = wb.getSheetIndex("all_sequences_template");
            if (allSeqTpl >= 0 && !sequences.isEmpty()) {
                LoopDef ld = loops.getOrDefault("all_sequences_template", new LoopDef(1, 1, "All Sequences"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "All Sequences", usedSheetNames);
                HSSFSheet newSheet = wb.cloneSheet(allSeqTpl);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                fillListTemplateSheet(newSheet, sequences, (row, item, ord) -> replaceSequenceRow(row, item, ord, words),
                    "$PSN", "$INC", "$STR");
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.all_sequences", "All Sequences"),
                    targetName, targetName, ""
                ));
            }

            // 6. trigger_template & all_triggers_template
            int trgTpl = wb.getSheetIndex("trigger_template");
            if (trgTpl >= 0) {
                for (Map<String, Object> trg : triggers) {
                    HSSFSheet sheet = wb.cloneSheet(trgTpl);
                    String safeName = makeUniqueSheetName(str(trg.get("name")), usedSheetNames);
                    wb.setSheetName(wb.getSheetIndex(sheet), safeName);
                    fillTriggerSheet(sheet, trg);
                    createdSheets.add(new SheetMeta(
                        safeName,
                        words.getOrDefault("sheet.type.trigger", "Trigger"),
                        str(trg.get("name")),
                        str(trg.get("name")),
                        str(trg.get("description"))
                    ));
                }
            }

            int allTrgTpl = wb.getSheetIndex("all_triggers_template");
            if (allTrgTpl < 0) allTrgTpl = wb.getSheetIndex("all_trigger_template");
            if (allTrgTpl >= 0 && !triggers.isEmpty()) {
                String tplName = wb.getSheetName(allTrgTpl);
                LoopDef ld = loops.getOrDefault(tplName, new LoopDef(1, 1, "All Triggers"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "All Triggers", usedSheetNames);
                HSSFSheet newSheet = wb.cloneSheet(allTrgTpl);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                fillListTemplateSheet(newSheet, triggers, (row, item, ord) -> replaceTriggerRow(row, item, ord),
                    "$PTGN", "$TGDSC", "$SQL");
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.all_triggers", "All Triggers"),
                    targetName, targetName, ""
                ));
            }

            // 7. column_template
            int colTpl = wb.getSheetIndex("column_template");
            if (colTpl >= 0 && !tables.isEmpty()) {
                LoopDef ld = loops.getOrDefault("column_template", new LoopDef(1, 1, "Columns"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "Columns", usedSheetNames);
                HSSFSheet newSheet = wb.cloneSheet(colTpl);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                List<Map<String, Object>> flatCols = new ArrayList<>();
                for (Map<String, Object> t : tables) {
                    for (Map<String, Object> c : listOfMaps(t.get("columns"))) {
                        Map<String, Object> entry = new LinkedHashMap<>(c);
                        entry.put("_tablePhysical", str(t.get("physicalName")));
                        entry.put("_tableLogical", str(t.get("logicalName")));
                        entry.put("_tableDesc", str(t.get("description")));
                        entry.put("_tableConstraint", str(t.get("constraint")));
                        flatCols.add(entry);
                    }
                }
                fillListTemplateSheet(newSheet, flatCols, (row, col, ord) -> {
                    Map<String, Object> pseudoTable = new HashMap<>();
                    pseudoTable.put("physicalName", str(col.get("_tablePhysical")));
                    pseudoTable.put("logicalName", str(col.get("_tableLogical")));
                    pseudoTable.put("description", str(col.get("_tableDesc")));
                    pseudoTable.put("constraint", str(col.get("_tableConstraint")));
                    replaceTableRowPlaceholders(row, pseudoTable, col, ord, words);
                }, "$PCN", "$LCN");
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.column", "Columns"),
                    targetName, targetName, ""
                ));
            }

            // 8. category_template
            int catTpl = wb.getSheetIndex("category_template");
            if (catTpl >= 0 && !categories.isEmpty()) {
                LoopDef ld = loops.getOrDefault("category_template", new LoopDef(1, 1, "Categories"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "Categories", usedSheetNames);
                HSSFSheet newSheet = wb.cloneSheet(catTpl);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                fillListTemplateSheet(newSheet, categories, (row, cat, ord) -> {
                    for (int c = 0; c < row.getLastCellNum(); c++) {
                        HSSFCell cell = row.getCell(c);
                        if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
                        String v = cell.getStringCellValue();
                        if (!v.contains("$")) continue;
                        v = v.replace("$ORD", String.valueOf(ord))
                             .replace("$CTN", str(cat.get("name")))
                             .replace("$NAM", str(cat.get("name")));
                        cell.setCellValue(new HSSFRichTextString(v));
                    }
                }, "$CTN", "$NAM");
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.category", "Categories"),
                    targetName, targetName, ""
                ));
            }

            // 9. history_template
            int histTpl = wb.getSheetIndex("history_template");
            if (histTpl >= 0 && !history.isEmpty()) {
                LoopDef ld = loops.getOrDefault("history_template", new LoopDef(1, 1, "History"));
                String targetName = makeUniqueSheetName(
                    !ld.sheetName.isEmpty() ? ld.sheetName : "History", usedSheetNames);
                HSSFSheet newSheet = wb.cloneSheet(histTpl);
                wb.setSheetName(wb.getSheetIndex(newSheet), targetName);
                fillListTemplateSheet(newSheet, history, (row, h, ord) -> {
                    for (int c = 0; c < row.getLastCellNum(); c++) {
                        HSSFCell cell = row.getCell(c);
                        if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
                        String v = cell.getStringCellValue();
                        if (!v.contains("$")) continue;
                        v = v.replace("$ORD", String.valueOf(ord))
                             .replace("$DATE", str(h.get("date")))
                             .replace("$CON", str(h.get("comment")));
                        cell.setCellValue(new HSSFRichTextString(v));
                    }
                }, "$DATE", "$CON");
                createdSheets.add(new SheetMeta(
                    targetName,
                    words.getOrDefault("sheet.type.history", "History"),
                    targetName, targetName, ""
                ));
            }

            // 10. Insert ER Diagram image ($ER) or remove empty $ER diagram sheet
            boolean picturePlaced = false;
            if (pictureIdx >= 0) {
                for (int i = 0; i < wb.getNumberOfSheets(); i++) {
                    HSSFSheet s = wb.getSheetAt(i);
                    if (isTemplateSheet(s.getSheetName())) continue;
                    if (insertPictureAtKeyword(wb, s, pictureIdx)) {
                        picturePlaced = true;
                    }
                }
                if (!picturePlaced) {
                    String picSheetName = makeUniqueSheetName("ER Diagram", usedSheetNames);
                    HSSFSheet picSheet = wb.createSheet(picSheetName);
                    HSSFPatriarch patriarch = picSheet.createDrawingPatriarch();
                    HSSFClientAnchor anchor = new HSSFClientAnchor(0, 0, 0, 0, (short) 1, 1, (short) 15, 30);
                    anchor.setAnchorType(2);
                    HSSFPicture pic = patriarch.createPicture(anchor, pictureIdx);
                    pic.resize();
                    createdSheets.add(0, new SheetMeta(picSheetName, "Diagram", picSheetName, picSheetName, "ER Diagram"));
                }
            } else {
                for (int i = wb.getNumberOfSheets() - 1; i >= 0; i--) {
                    HSSFSheet s = wb.getSheetAt(i);
                    if (!isTemplateSheet(s.getSheetName()) && findRowWithKeywords(s, 0, s.getLastRowNum(), "$ER") >= 0) {
                        wb.removeSheetAt(i);
                    }
                }
            }

            // 11. sheet_index_template
            int idxSheetTpl = wb.getSheetIndex("sheet_index_template");
            if (idxSheetTpl >= 0 && !createdSheets.isEmpty()) {
                LoopDef ld = loops.getOrDefault("sheet_index_template", new LoopDef(1, 1, "목차"));
                HSSFSheet idxSheet = wb.cloneSheet(idxSheetTpl);
                String idxTitle = makeUniqueSheetName(!ld.sheetName.isEmpty() ? ld.sheetName : "목차", usedSheetNames);
                wb.setSheetName(wb.getSheetIndex(idxSheet), idxTitle);
                fillSheetIndex(idxSheet, createdSheets);
            }

            // 12. Remove template/metadata sheets
            for (int i = wb.getNumberOfSheets() - 1; i >= 0; i--) {
                if (isTemplateSheet(wb.getSheetName(i))) {
                    wb.removeSheetAt(i);
                }
            }

            for (int i = 0; i < wb.getNumberOfSheets(); i++) {
                wb.getSheetAt(i).setSelected(false);
            }
            if (wb.getNumberOfSheets() > 0) {
                wb.getSheetAt(0).setSelected(true);
                wb.setActiveSheet(0);
                wb.setFirstVisibleTab(0);
            }

            try (FileOutputStream fos = new FileOutputStream(outputPath)) {
                wb.write(fos);
            }
            System.out.println("{\"ok\":true}");
        } catch (Throwable t) {
            String msg = t.getMessage() != null ? t.getMessage() : t.getClass().getName();
            System.out.println("{\"ok\":false,\"error\":\"" + escJson(msg) + "\"}");
        }
    }

    interface RowFiller {
        void fill(HSSFRow row, Map<String, Object> item, int ord);
    }

    private static void fillListTemplateSheet(
        HSSFSheet sheet,
        List<Map<String, Object>> items,
        RowFiller filler,
        String... keywords
    ) {
        int tplRowIdx = findRowWithKeywords(sheet, 0, sheet.getLastRowNum(), keywords);
        if (tplRowIdx < 0) return;

        if (items.size() > 1) {
            if (tplRowIdx + 1 <= sheet.getLastRowNum()) {
                sheet.shiftRows(tplRowIdx + 1, sheet.getLastRowNum(), items.size() - 1, true, false);
            }
            HSSFRow srcRow = sheet.getRow(tplRowIdx);
            for (int i = 1; i < items.size(); i++) {
                HSSFRow dstRow = sheet.createRow(tplRowIdx + i);
                copyRowStyleAndValues(sheet, srcRow, dstRow);
            }
        }
        for (int i = 0; i < items.size(); i++) {
            HSSFRow row = sheet.getRow(tplRowIdx + i);
            if (row != null) {
                filler.fill(row, items.get(i), i + 1);
            }
        }
    }

    private static void fillTableSheet(HSSFSheet sheet, Map<String, Object> table, Map<String, String> words) {
        List<Map<String, Object>> cols = listOfMaps(table.get("columns"));
        int colTplRowIdx = findRowWithKeywords(sheet, 0, sheet.getLastRowNum(), "$PCN", "$LCN");
        if (colTplRowIdx >= 0 && cols.size() > 1) {
            int extra = cols.size() - 1;
            if (colTplRowIdx + 1 <= sheet.getLastRowNum()) {
                sheet.shiftRows(colTplRowIdx + 1, sheet.getLastRowNum(), extra, true, false);
            }
            HSSFRow srcRow = sheet.getRow(colTplRowIdx);
            for (int i = 1; i <= extra; i++) {
                HSSFRow dstRow = sheet.createRow(colTplRowIdx + i);
                copyRowStyleAndValues(sheet, srcRow, dstRow);
            }
        }

        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            HSSFRow row = sheet.getRow(r);
            if (row == null) continue;
            boolean isColRow = colTplRowIdx >= 0 && r >= colTplRowIdx && r < colTplRowIdx + Math.max(1, cols.size());
            Map<String, Object> col = null;
            int colOrd = 0;
            if (isColRow && !cols.isEmpty()) {
                colOrd = r - colTplRowIdx + 1;
                col = cols.get(colOrd - 1);
            }
            replaceTableRowPlaceholders(row, table, col, colOrd, words);
        }

        List<Map<String, Object>> tblIndexes = listOfMaps(table.get("indexes"));
        List<Map<String, Object>> tblCuks = listOfMaps(table.get("complexUniqueKeys"));
        fillMatrixSection(sheet, 0, sheet.getLastRowNum(), "$LIDX", cols, tblIndexes, true);
        fillMatrixSection(sheet, 0, sheet.getLastRowNum(), "$PIDX", cols, tblIndexes, false);
        fillMatrixSection(sheet, 0, sheet.getLastRowNum(), "$LCUK", cols, tblCuks, true);
        fillMatrixSection(sheet, 0, sheet.getLastRowNum(), "$PCUK", cols, tblCuks, false);
    }

    private static void fillAllTablesSheet(
        HSSFSheet tplSheet,
        HSSFSheet targetSheet,
        List<Map<String, Object>> tables,
        LoopDef ld,
        Map<String, String> words
    ) {
        int startRow = Math.max(0, ld.startLine - 1);
        int endRow = Math.max(startRow, tplSheet.getLastRowNum());
        int spaceLines = Math.max(1, ld.spaceLine);
        int cursor = startRow;

        for (int i = 0; i < tables.size(); i++) {
            Map<String, Object> t = tables.get(i);
            List<Map<String, Object>> cols = listOfMaps(t.get("columns"));
            if (i > 0) {
                copyBlock(tplSheet, targetSheet, startRow, endRow, cursor);
            }
            int blockEnd = cursor + (endRow - startRow);
            int colTplRowIdx = findRowWithKeywords(targetSheet, cursor, blockEnd, "$PCN", "$LCN");
            int extraCols = Math.max(0, cols.size() - 1);
            if (colTplRowIdx >= 0 && extraCols > 0) {
                if (colTplRowIdx + 1 <= targetSheet.getLastRowNum()) {
                    targetSheet.shiftRows(colTplRowIdx + 1, targetSheet.getLastRowNum(), extraCols, true, false);
                }
                HSSFRow srcRow = targetSheet.getRow(colTplRowIdx);
                for (int cIdx = 1; cIdx <= extraCols; cIdx++) {
                    HSSFRow dstRow = targetSheet.createRow(colTplRowIdx + cIdx);
                    copyRowStyleAndValues(targetSheet, srcRow, dstRow);
                }
                blockEnd += extraCols;
            }

            for (int r = cursor; r <= blockEnd; r++) {
                HSSFRow row = targetSheet.getRow(r);
                if (row == null) continue;
                boolean isColRow = colTplRowIdx >= 0 && r >= colTplRowIdx && r < colTplRowIdx + Math.max(1, cols.size());
                Map<String, Object> col = null;
                int colOrd = 0;
                if (isColRow && !cols.isEmpty()) {
                    colOrd = r - colTplRowIdx + 1;
                    col = cols.get(colOrd - 1);
                }
                replaceTableRowPlaceholders(row, t, col, colOrd, words);
            }
            List<Map<String, Object>> tblIndexes = listOfMaps(t.get("indexes"));
            List<Map<String, Object>> tblCuks = listOfMaps(t.get("complexUniqueKeys"));
            blockEnd += fillMatrixSection(targetSheet, cursor, blockEnd, "$LIDX", cols, tblIndexes, true);
            blockEnd += fillMatrixSection(targetSheet, cursor, blockEnd, "$PIDX", cols, tblIndexes, false);
            blockEnd += fillMatrixSection(targetSheet, cursor, blockEnd, "$LCUK", cols, tblCuks, true);
            blockEnd += fillMatrixSection(targetSheet, cursor, blockEnd, "$PCUK", cols, tblCuks, false);
            cursor = blockEnd + spaceLines + 1;
        }
    }

    private static void fillViewSheet(HSSFSheet sheet, Map<String, Object> view) {
        List<Map<String, Object>> cols = listOfMaps(view.get("columns"));
        int colTplRowIdx = findRowWithKeywords(sheet, 0, sheet.getLastRowNum(), "$PCN", "$LCN");
        if (colTplRowIdx >= 0 && cols.size() > 1) {
            int extra = cols.size() - 1;
            if (colTplRowIdx + 1 <= sheet.getLastRowNum()) {
                sheet.shiftRows(colTplRowIdx + 1, sheet.getLastRowNum(), extra, true, false);
            }
            HSSFRow srcRow = sheet.getRow(colTplRowIdx);
            for (int i = 1; i <= extra; i++) {
                HSSFRow dstRow = sheet.createRow(colTplRowIdx + i);
                copyRowStyleAndValues(sheet, srcRow, dstRow);
            }
        }
        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            HSSFRow row = sheet.getRow(r);
            if (row == null) continue;
            Map<String, Object> col = null;
            int colOrd = 0;
            if (colTplRowIdx >= 0 && r >= colTplRowIdx && r < colTplRowIdx + Math.max(1, cols.size()) && !cols.isEmpty()) {
                colOrd = r - colTplRowIdx + 1;
                col = cols.get(colOrd - 1);
            }
            replaceViewRow(row, view, col, colOrd);
        }
    }

    private static void fillAllViewsSheet(HSSFSheet tplSheet, HSSFSheet targetSheet, List<Map<String, Object>> views, LoopDef ld) {
        int startRow = Math.max(0, ld.startLine - 1);
        int endRow = Math.max(startRow, tplSheet.getLastRowNum());
        int spaceLines = Math.max(1, ld.spaceLine);
        int cursor = startRow;

        for (int i = 0; i < views.size(); i++) {
            Map<String, Object> v = views.get(i);
            if (i > 0) {
                copyBlock(tplSheet, targetSheet, startRow, endRow, cursor);
            }
            int blockEnd = cursor + (endRow - startRow);
            for (int r = cursor; r <= blockEnd; r++) {
                HSSFRow row = targetSheet.getRow(r);
                if (row != null) replaceViewRow(row, v, null, i + 1);
            }
            cursor = blockEnd + spaceLines + 1;
        }
    }

    private static void fillIndexEntitySheet(HSSFSheet sheet, Map<String, Object> ix, Map<String, String> words) {
        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            HSSFRow row = sheet.getRow(r);
            if (row != null) replaceIndexRow(row, ix, 1, words);
        }
    }

    private static void fillSequenceSheet(HSSFSheet sheet, Map<String, Object> seq, Map<String, String> words) {
        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            HSSFRow row = sheet.getRow(r);
            if (row != null) replaceSequenceRow(row, seq, 1, words);
        }
    }

    private static void fillTriggerSheet(HSSFSheet sheet, Map<String, Object> trg) {
        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            HSSFRow row = sheet.getRow(r);
            if (row != null) replaceTriggerRow(row, trg, 1);
        }
    }

    private static void fillSheetIndex(HSSFSheet sheet, List<SheetMeta> sheets) {
        int tplRowIdx = findRowWithKeywords(sheet, 0, sheet.getLastRowNum(), "$SHTN", "$NAM", "$PTN", "$LTN", "$SHTT");
        if (tplRowIdx < 0) return;

        if (sheets.size() > 1) {
            if (tplRowIdx + 1 <= sheet.getLastRowNum()) {
                sheet.shiftRows(tplRowIdx + 1, sheet.getLastRowNum(), sheets.size() - 1, true, false);
            }
            HSSFRow srcRow = sheet.getRow(tplRowIdx);
            for (int i = 1; i < sheets.size(); i++) {
                HSSFRow dstRow = sheet.createRow(tplRowIdx + i);
                copyRowStyleAndValues(sheet, srcRow, dstRow);
            }
        }

        for (int i = 0; i < sheets.size(); i++) {
            HSSFRow row = sheet.getRow(tplRowIdx + i);
            if (row == null) continue;
            SheetMeta meta = sheets.get(i);
            for (int c = 0; c < row.getLastCellNum(); c++) {
                HSSFCell cell = row.getCell(c);
                if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
                String v = cell.getStringCellValue();
                boolean hasLinkTarget = v.contains("$NAM") || v.contains("$SHTN") || v.contains("$PTN") || v.contains("$LTN");
                v = v.replace("$ORD", String.valueOf(i + 1))
                     .replace("$SNO", String.valueOf(i + 1))
                     .replace("$SHTT", meta.sheetType)
                     .replace("$NAM", meta.sheetName)
                     .replace("$SHTN", meta.sheetName)
                     .replace("$PTN", meta.physicalName)
                     .replace("$LTN", meta.logicalName)
                     .replace("$DSC", meta.description)
                     .replace("$TDSC", meta.description)
                     .replace("$SDSC", meta.description);
                cell.setCellValue(new HSSFRichTextString(v));
                if (hasLinkTarget) {
                    HSSFHyperlink link = new HSSFHyperlink(HSSFHyperlink.LINK_DOCUMENT);
                    link.setAddress("'" + meta.sheetName.replace("'", "''") + "'!A1");
                    cell.setHyperlink(link);
                }
            }
        }
    }

    private static void replaceTableRowPlaceholders(
        HSSFRow row,
        Map<String, Object> t,
        Map<String, Object> col,
        int ord,
        Map<String, String> words
    ) {
        String pkMark = words.getOrDefault("primary_key", "PK");
        String nnMark = words.getOrDefault("not_null", "NN");
        String ukMark = words.getOrDefault("unique_key", "UK");
        String fkMark = words.getOrDefault("foreign_key", "FK");
        String aiMark = words.getOrDefault("auto_increment", "AI");

        for (int c = 0; c < row.getLastCellNum(); c++) {
            HSSFCell cell = row.getCell(c);
            if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
            String v = cell.getStringCellValue();
            if (!v.contains("$")) continue;

            v = v.replace("$LTN", str(t.get("logicalName")))
                 .replace("$PTN", str(t.get("physicalName")))
                 .replace("$TDSC", str(t.get("description")))
                 .replace("$TCON", str(t.get("constraint")));

            if (col != null) {
                String type = str(col.get("type"));
                String len = str(col.get("length"));
                String dec = str(col.get("decimal"));
                String fullType = type + (!len.isEmpty() ? "(" + len + (!dec.isEmpty() ? "," + dec : "") + ")" : "");
                String fkTblP = str(col.get("fkTargetTablePhysical"));
                String fkTblL = str(col.get("fkTargetTableLogical"));
                String fkColP = str(col.get("fkTargetColPhysical"));
                String fkColL = str(col.get("fkTargetColLogical"));
                String fkJoinP = !fkTblP.isEmpty() && !fkColP.isEmpty() ? fkTblP + "." + fkColP : fkTblP;
                String fkJoinL = !fkTblL.isEmpty() && !fkColL.isEmpty() ? fkTblL + "." + fkColL : fkTblL;

                v = v.replace("$ORD", String.valueOf(ord))
                     .replace("$LCN", str(col.get("logicalName")))
                     .replace("$PCN", str(col.get("physicalName")))
                     .replace("$TYE", fullType)
                     .replace("$TYP", type)
                     .replace("$LEN", len)
                     .replace("$DEC", dec)
                     .replace("$PK", bool(col.get("primaryKey")) ? pkMark : "")
                     .replace("$NN", bool(col.get("notNull")) ? nnMark : "")
                     .replace("$UK", bool(col.get("uniqueKey")) ? ukMark : "")
                     .replace("$FK", bool(col.get("foreignKey")) ? fkMark : "")
                     .replace("$INC", bool(col.get("autoIncrement")) ? aiMark : "")
                     .replace("$DEF", str(col.get("defaultValue")))
                     .replace("$CDSC", str(col.get("description")))
                     .replace("$LRFTC", fkJoinL)
                     .replace("$PRFTC", fkJoinP)
                     .replace("$LRFT", fkTblL)
                     .replace("$PRFT", fkTblP)
                     .replace("$LRFC", fkColL)
                     .replace("$PRFC", fkColP)
                     .replace("$LFKN", str(col.get("fkName")))
                     .replace("$PFKN", str(col.get("fkName")));
            } else {
                v = v.replaceAll("\\$(?!LIDX|PIDX|LCUK|PCUK)[A-Z0-9_]+", "");
            }
            cell.setCellValue(new HSSFRichTextString(v));
        }
    }

    private static void replaceViewRow(HSSFRow row, Map<String, Object> view, Map<String, Object> col, int ord) {
        for (int c = 0; c < row.getLastCellNum(); c++) {
            HSSFCell cell = row.getCell(c);
            if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
            String v = cell.getStringCellValue();
            if (!v.contains("$")) continue;

            v = v.replace("$LVN", str(view.get("logicalName")))
                 .replace("$PVN", str(view.get("physicalName")))
                 .replace("$VDSC", str(view.get("description")))
                 .replace("$SQL", str(view.get("sql")));

            if (col != null) {
                String type = str(col.get("type"));
                String len = str(col.get("length"));
                String dec = str(col.get("decimal"));
                String fullType = type + (!len.isEmpty() ? "(" + len + (!dec.isEmpty() ? "," + dec : "") + ")" : "");
                v = v.replace("$ORD", String.valueOf(ord))
                     .replace("$LCN", str(col.get("logicalName")))
                     .replace("$PCN", str(col.get("physicalName")))
                     .replace("$TYE", fullType)
                     .replace("$TYP", type)
                     .replace("$LEN", len)
                     .replace("$DEC", dec)
                     .replace("$CDSC", str(col.get("description")));
            } else {
                v = v.replace("$ORD", String.valueOf(ord)).replaceAll("\\$[A-Z0-9_]+", "");
            }
            cell.setCellValue(new HSSFRichTextString(v));
        }
    }

    private static void replaceIndexRow(HSSFRow row, Map<String, Object> ix, int ord, Map<String, String> words) {
        String uniqueMark = words.getOrDefault("unique_index", "UNIQUE");
        for (int c = 0; c < row.getLastCellNum(); c++) {
            HSSFCell cell = row.getCell(c);
            if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
            String v = cell.getStringCellValue();
            if (!v.contains("$")) continue;
            v = v.replace("$ORD", String.valueOf(ord))
                 .replace("$PIN", str(ix.get("name")))
                 .replace("$ITYP", str(ix.get("type")))
                 .replace("$IU", !bool(ix.get("nonUnique")) ? uniqueMark : "")
                 .replace("$IDSC", str(ix.get("description")))
                 .replace("$PTN", str(ix.get("tablePhysical")))
                 .replace("$LTN", str(ix.get("tableLogical")))
                 .replace("$PCN", str(ix.get("columns")))
                 .replace("$LCN", str(ix.get("columns")));
            cell.setCellValue(new HSSFRichTextString(v));
        }
    }

    private static void replaceSequenceRow(HSSFRow row, Map<String, Object> seq, int ord, Map<String, String> words) {
        String cycleMark = words.getOrDefault("cycle", "Y");
        for (int c = 0; c < row.getLastCellNum(); c++) {
            HSSFCell cell = row.getCell(c);
            if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
            String v = cell.getStringCellValue();
            if (!v.contains("$")) continue;
            v = v.replace("$ORD", String.valueOf(ord))
                 .replace("$PSN", str(seq.get("name")))
                 .replace("$SDSC", str(seq.get("description")))
                 .replace("$INC", str(seq.get("increment")))
                 .replace("$MIN", str(seq.get("minValue")))
                 .replace("$MAX", str(seq.get("maxValue")))
                 .replace("$STR", str(seq.get("start")))
                 .replace("$CACHE", str(seq.get("cache")))
                 .replace("$CYC", bool(seq.get("cycle")) ? cycleMark : "");
            cell.setCellValue(new HSSFRichTextString(v));
        }
    }

    private static void replaceTriggerRow(HSSFRow row, Map<String, Object> trg, int ord) {
        for (int c = 0; c < row.getLastCellNum(); c++) {
            HSSFCell cell = row.getCell(c);
            if (cell == null || cell.getCellType() != HSSFCell.CELL_TYPE_STRING) continue;
            String v = cell.getStringCellValue();
            if (!v.contains("$")) continue;
            v = v.replace("$ORD", String.valueOf(ord))
                 .replace("$PTGN", str(trg.get("name")))
                 .replace("$TGDSC", str(trg.get("description")))
                 .replace("$SQL", str(trg.get("sql")));
            cell.setCellValue(new HSSFRichTextString(v));
        }
    }

    private static boolean insertPictureAtKeyword(HSSFWorkbook wb, HSSFSheet sheet, int pictureIdx) {
        for (int r = 0; r <= sheet.getLastRowNum(); r++) {
            HSSFRow row = sheet.getRow(r);
            if (row == null) continue;
            for (int c = 0; c < row.getLastCellNum(); c++) {
                HSSFCell cell = row.getCell(c);
                if (cell != null && cell.getCellType() == HSSFCell.CELL_TYPE_STRING) {
                    String v = cell.getStringCellValue();
                    if (v != null && v.contains("$ER")) {
                        cell.setCellValue(new HSSFRichTextString(""));
                        HSSFPatriarch patriarch = sheet.createDrawingPatriarch();
                        HSSFClientAnchor anchor = new HSSFClientAnchor(0, 0, 0, 0, (short) c, r, (short) (c + 12), r + 25);
                        anchor.setAnchorType(2);
                        HSSFPicture pic = patriarch.createPicture(anchor, pictureIdx);
                        pic.resize();
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static int fillMatrixSection(
        HSSFSheet sheet,
        int startRow,
        int endRow,
        String keyword,
        List<Map<String, Object>> cols,
        List<Map<String, Object>> items,
        boolean isLogical
    ) {
        int rFound = -1;
        int cFound = -1;
        int maxR = Math.min(endRow, sheet.getLastRowNum());
        for (int r = Math.max(0, startRow); r <= maxR; r++) {
            HSSFRow row = sheet.getRow(r);
            if (row == null) continue;
            for (int c = 0; c < row.getLastCellNum(); c++) {
                HSSFCell cell = row.getCell(c);
                if (cell != null && cell.getCellType() == HSSFCell.CELL_TYPE_STRING) {
                    String v = cell.getStringCellValue();
                    if (v != null && v.contains(keyword)) {
                        rFound = r;
                        cFound = c;
                        break;
                    }
                }
            }
            if (rFound >= 0) break;
        }
        if (rFound < 0) return 0;

        HSSFRow headerRow = sheet.getRow(rFound);
        HSSFCell tplCell = headerRow.getCell(cFound);
        HSSFCellStyle tplStyle = tplCell != null ? tplCell.getCellStyle() : null;

        if (items.isEmpty()) {
            if (tplCell != null) tplCell.setCellValue(new HSSFRichTextString(""));
            return 0;
        }

        if (tplCell != null) tplCell.setCellValue(new HSSFRichTextString(""));
        for (int i = 0; i < items.size(); i++) {
            HSSFCell hc = headerRow.getCell(cFound + 1 + i);
            if (hc == null) hc = headerRow.createCell(cFound + 1 + i);
            if (tplStyle != null) hc.setCellStyle(tplStyle);
            hc.setCellValue(new HSSFRichTextString(str(items.get(i).get("name"))));
        }

        int insertedRows = cols.size();
        if (insertedRows > 0 && rFound + 1 <= sheet.getLastRowNum()) {
            sheet.shiftRows(rFound + 1, sheet.getLastRowNum(), insertedRows, true, false);
        }

        for (int j = 0; j < cols.size(); j++) {
            Map<String, Object> col = cols.get(j);
            String colId = str(col.get("id"));
            String colPhys = str(col.get("physicalName"));
            String colLabel = isLogical && !str(col.get("logicalName")).isEmpty()
                ? str(col.get("logicalName")) : colPhys;

            HSSFRow row = sheet.createRow(rFound + 1 + j);
            HSSFCell nameCell = row.createCell(cFound);
            if (tplStyle != null) nameCell.setCellStyle(tplStyle);
            nameCell.setCellValue(new HSSFRichTextString(colLabel));

            for (int i = 0; i < items.size(); i++) {
                HSSFCell mc = row.createCell(cFound + 1 + i);
                if (tplStyle != null) mc.setCellStyle(tplStyle);
                List<String> targetCols = listOfStrings(items.get(i).get("columns"));
                int matchIdx = -1;
                for (int k = 0; k < targetCols.size(); k++) {
                    String tc = targetCols.get(k);
                    if ((!colId.isEmpty() && tc.equals(colId)) || (!colPhys.isEmpty() && tc.equalsIgnoreCase(colPhys))) {
                        matchIdx = k;
                        break;
                    }
                }
                if (matchIdx >= 0) {
                    mc.setCellValue(matchIdx + 1);
                }
            }
        }
        return insertedRows;
    }

    @SuppressWarnings("unchecked")
    private static List<String> listOfStrings(Object o) {
        List<String> res = new ArrayList<>();
        if (o instanceof List<?>) {
            for (Object item : (List<?>) o) {
                if (item != null) res.add(String.valueOf(item));
            }
        }
        return res;
    }

    private static int findRowWithKeywords(HSSFSheet sheet, int startRow, int endRow, String... keywords) {
        int maxR = Math.min(endRow, sheet.getLastRowNum());
        for (int r = Math.max(0, startRow); r <= maxR; r++) {
            HSSFRow row = sheet.getRow(r);
            if (row == null) continue;
            for (int c = 0; c < row.getLastCellNum(); c++) {
                HSSFCell cell = row.getCell(c);
                if (cell != null && cell.getCellType() == HSSFCell.CELL_TYPE_STRING) {
                    String v = cell.getStringCellValue();
                    if (v == null) continue;
                    for (String kw : keywords) {
                        if (v.contains(kw)) return r;
                    }
                }
            }
        }
        return -1;
    }

    private static void copyRowStyleAndValues(HSSFSheet sheet, HSSFRow src, HSSFRow dst) {
        if (src == null || dst == null) return;
        dst.setHeight(src.getHeight());
        for (int c = 0; c < src.getLastCellNum(); c++) {
            HSSFCell sc = src.getCell(c);
            if (sc == null) continue;
            HSSFCell dc = dst.createCell(c);
            HSSFCellStyle style = sc.getCellStyle();
            if (style != null) dc.setCellStyle(style);
            if (sc.getCellType() == HSSFCell.CELL_TYPE_STRING) {
                dc.setCellValue(sc.getRichStringCellValue());
            } else if (sc.getCellType() == HSSFCell.CELL_TYPE_NUMERIC) {
                dc.setCellValue(sc.getNumericCellValue());
            }
        }
        int srcRowNum = src.getRowNum();
        int dstRowNum = dst.getRowNum();
        int numMerged = sheet.getNumMergedRegions();
        for (int i = 0; i < numMerged; i++) {
            CellRangeAddress m = sheet.getMergedRegion(i);
            if (m.getFirstRow() == srcRowNum && m.getLastRow() == srcRowNum) {
                sheet.addMergedRegion(new CellRangeAddress(dstRowNum, dstRowNum, m.getFirstColumn(), m.getLastColumn()));
            }
        }
    }

    private static void copyBlock(HSSFSheet srcSheet, HSSFSheet dstSheet, int startRow, int endRow, int dstStartRow) {
        for (int r = startRow; r <= endRow; r++) {
            HSSFRow sr = srcSheet.getRow(r);
            HSSFRow dr = dstSheet.createRow(dstStartRow + (r - startRow));
            copyRowStyleAndValues(srcSheet, sr, dr);
        }
        for (int i = 0; i < srcSheet.getNumMergedRegions(); i++) {
            CellRangeAddress m = srcSheet.getMergedRegion(i);
            if (m.getFirstRow() >= startRow && m.getLastRow() <= endRow && m.getFirstRow() != m.getLastRow()) {
                int offset = dstStartRow - startRow;
                dstSheet.addMergedRegion(new CellRangeAddress(
                    m.getFirstRow() + offset, m.getLastRow() + offset,
                    m.getFirstColumn(), m.getLastColumn()
                ));
            }
        }
    }

    private static Map<String, String> readWordsSheet(HSSFWorkbook wb) {
        Map<String, String> map = new HashMap<>();
        HSSFSheet ws = wb.getSheet("words");
        if (ws == null) return map;
        for (int r = 0; r <= ws.getLastRowNum(); r++) {
            HSSFRow row = ws.getRow(r);
            if (row == null) continue;
            HSSFCell k = row.getCell(0);
            HSSFCell v = row.getCell(1);
            if (k != null && v != null && k.getCellType() == HSSFCell.CELL_TYPE_STRING && v.getCellType() == HSSFCell.CELL_TYPE_STRING) {
                map.put(k.getStringCellValue().trim(), v.getStringCellValue().trim());
            }
        }
        return map;
    }

    private static Map<String, LoopDef> readLoopsSheet(HSSFWorkbook wb) {
        Map<String, LoopDef> map = new HashMap<>();
        HSSFSheet ls = wb.getSheet("loops");
        if (ls == null) return map;
        for (int r = 0; r <= ls.getLastRowNum(); r++) {
            HSSFRow row = ls.getRow(r);
            if (row == null) continue;
            HSSFCell c0 = row.getCell(0);
            if (c0 != null && c0.getCellType() == HSSFCell.CELL_TYPE_STRING) {
                String name = c0.getStringCellValue().trim();
                int start = row.getCell(1) != null && row.getCell(1).getCellType() == HSSFCell.CELL_TYPE_NUMERIC
                    ? (int) row.getCell(1).getNumericCellValue() : 1;
                int space = row.getCell(2) != null && row.getCell(2).getCellType() == HSSFCell.CELL_TYPE_NUMERIC
                    ? (int) row.getCell(2).getNumericCellValue() : 2;
                String sName = row.getCell(3) != null && row.getCell(3).getCellType() == HSSFCell.CELL_TYPE_STRING
                    ? row.getCell(3).getStringCellValue().trim() : "";
                map.put(name, new LoopDef(start, space, sName));
            }
        }
        return map;
    }

    private static String makeUniqueSheetName(String raw, Set<String> used) {
        String clean = (raw == null ? "Sheet" : raw).replaceAll("[\\\\/?*\\[\\]:']", "_").trim();
        if (clean.isEmpty()) clean = "Sheet";
        if (clean.length() > 28) clean = clean.substring(0, 28);
        String candidate = clean;
        int n = 1;
        while (used.contains(candidate)) {
            candidate = clean + "_" + (n++);
        }
        used.add(candidate);
        return candidate;
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private static boolean bool(Object o) {
        return o instanceof Boolean && ((Boolean) o).booleanValue();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> listOfMaps(Object o) {
        List<Map<String, Object>> res = new ArrayList<>();
        if (o instanceof List<?>) {
            for (Object item : (List<?>) o) {
                if (item instanceof Map<?, ?>) {
                    res.add((Map<String, Object>) item);
                }
            }
        }
        return res;
    }

    private static String escJson(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    // Minimal recursive-descent JSON parser (zero external dependencies)
    static class JsonParser {
        private final String s;
        private int pos = 0;

        JsonParser(String s) {
            this.s = s;
        }

        Object parse() {
            skipWs();
            if (pos >= s.length()) return null;
            char ch = s.charAt(pos);
            if (ch == '{') return parseObject();
            if (ch == '[') return parseArray();
            if (ch == '"') return parseString();
            if (ch == 't' || ch == 'f') return parseBoolean();
            if (ch == 'n') { pos += 4; return null; }
            return parseNumber();
        }

        private Map<String, Object> parseObject() {
            Map<String, Object> map = new LinkedHashMap<>();
            pos++; // '{'
            skipWs();
            if (pos < s.length() && s.charAt(pos) == '}') { pos++; return map; }
            while (pos < s.length()) {
                skipWs();
                String key = parseString();
                skipWs();
                if (pos < s.length() && s.charAt(pos) == ':') pos++;
                Object val = parse();
                map.put(key, val);
                skipWs();
                if (pos < s.length() && s.charAt(pos) == ',') { pos++; continue; }
                if (pos < s.length() && s.charAt(pos) == '}') { pos++; break; }
                break;
            }
            return map;
        }

        private List<Object> parseArray() {
            List<Object> list = new ArrayList<>();
            pos++; // '['
            skipWs();
            if (pos < s.length() && s.charAt(pos) == ']') { pos++; return list; }
            while (pos < s.length()) {
                list.add(parse());
                skipWs();
                if (pos < s.length() && s.charAt(pos) == ',') { pos++; continue; }
                if (pos < s.length() && s.charAt(pos) == ']') { pos++; break; }
                break;
            }
            return list;
        }

        private String parseString() {
            pos++; // '"'
            StringBuilder sb = new StringBuilder();
            while (pos < s.length()) {
                char c = s.charAt(pos++);
                if (c == '"') break;
                if (c == '\\' && pos < s.length()) {
                    char esc = s.charAt(pos++);
                    switch (esc) {
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case '/': sb.append('/'); break;
                        case 'b': sb.append('\b'); break;
                        case 'f': sb.append('\f'); break;
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        case 'u':
                            if (pos + 4 <= s.length()) {
                                sb.append((char) Integer.parseInt(s.substring(pos, pos + 4), 16));
                                pos += 4;
                            }
                            break;
                        default: sb.append(esc); break;
                    }
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }

        private Boolean parseBoolean() {
            if (s.startsWith("true", pos)) { pos += 4; return Boolean.TRUE; }
            pos += 5;
            return Boolean.FALSE;
        }

        private Number parseNumber() {
            int start = pos;
            while (pos < s.length()) {
                char c = s.charAt(pos);
                if ((c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E') pos++;
                else break;
            }
            String num = s.substring(start, pos);
            if (num.contains(".") || num.contains("e") || num.contains("E")) return Double.parseDouble(num);
            return Long.parseLong(num);
        }

        private void skipWs() {
            while (pos < s.length() && Character.isWhitespace(s.charAt(pos))) pos++;
        }
    }
}
