import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.DriverPropertyInfo;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JdbcReverseEngineer {

    static class DriverShim implements Driver {
        private final Driver driver;
        DriverShim(Driver d) { this.driver = d; }
        public boolean acceptsURL(String u) throws SQLException { return driver.acceptsURL(u); }
        public Connection connect(String u, Properties p) throws SQLException { return driver.connect(u, p); }
        public int getMajorVersion() { return driver.getMajorVersion(); }
        public int getMinorVersion() { return driver.getMinorVersion(); }
        public DriverPropertyInfo[] getPropertyInfo(String u, Properties p) throws SQLException { return driver.getPropertyInfo(u, p); }
        public boolean jdbcCompliant() { return driver.jdbcCompliant(); }
        public Logger getParentLogger() throws SQLFeatureNotSupportedException { return driver.getParentLogger(); }
    }

    public static void main(String[] args) {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            Map<String, Object> req = parseSimpleJsonObject(sb.toString());
            String action = str(req.get("action"));
            String driverClass = str(req.get("driverClass"));
            String url = str(req.get("url"));
            String user = str(req.get("user"));
            String password = str(req.get("password"));
            List<String> jarPaths = strList(req.get("jarPaths"));
            List<String> schemas = strList(req.get("schemas"));
            List<String> selectedTables = strList(req.get("selectedTables"));
            List<String> selectedViews = strList(req.get("selectedViews"));
            String ddlSql = str(req.get("ddlSql"));

            try (Connection con = connect(jarPaths, driverClass, url, user, password)) {
                DatabaseMetaData meta = con.getMetaData();
                if ("listSchemas".equals(action)) {
                    List<String> result = listSchemas(meta, con);
                    System.out.println("{\"ok\":true,\"schemas\":" + toJsonArray(result) + "}");
                } else if ("listObjects".equals(action)) {
                    Map<String, List<String>> objs = listObjects(meta, schemas);
                    System.out.println("{\"ok\":true,\"tables\":" + toJsonArray(objs.get("tables"))
                            + ",\"views\":" + toJsonArray(objs.get("views")) + "}");
                } else if ("importObjects".equals(action)) {
                    String json = importObjects(meta, schemas, selectedTables, selectedViews);
                    System.out.println(json);
                } else if ("executeDdl".equals(action)) {
                    int executed = executeDdl(con, ddlSql);
                    System.out.println("{\"ok\":true,\"executedCount\":" + executed + "}");
                } else {
                    System.out.println("{\"ok\":false,\"error\":\"Unknown action: " + esc(action) + "\"}");
                }
            }
        } catch (Throwable t) {
            String msg = t.getMessage() != null ? t.getMessage() : t.getClass().getName();
            System.out.println("{\"ok\":false,\"error\":\"" + esc(msg) + "\"}");
        }
    }

    private static Connection connect(List<String> jarPaths, String driverClass, String url, String user, String password) throws Exception {
        if (jarPaths != null && !jarPaths.isEmpty()) {
            List<URL> urls = new ArrayList<>();
            for (String p : jarPaths) {
                File f = new File(p);
                if (f.exists()) {
                    urls.add(f.toURI().toURL());
                }
            }
            if (!urls.isEmpty()) {
                URLClassLoader cl = new URLClassLoader(urls.toArray(new URL[0]), JdbcReverseEngineer.class.getClassLoader());
                Driver d = (Driver) Class.forName(driverClass, true, cl).getDeclaredConstructor().newInstance();
                DriverManager.registerDriver(new DriverShim(d));
            }
        } else if (driverClass != null && !driverClass.isEmpty()) {
            Class.forName(driverClass);
        }
        Properties props = new Properties();
        if (user != null) props.setProperty("user", user);
        if (password != null) props.setProperty("password", password);
        return DriverManager.getConnection(url, props);
    }

    private static List<String> listSchemas(DatabaseMetaData meta, Connection con) throws SQLException {
        Set<String> set = new HashSet<>();
        List<String> list = new ArrayList<>();
        try (ResultSet rs = meta.getSchemas()) {
            while (rs.next()) {
                String s = rs.getString("TABLE_SCHEM");
                if (s != null && !s.isEmpty() && set.add(s)) {
                    list.add(s);
                }
            }
        } catch (SQLException ignored) {}
        if (list.isEmpty()) {
            try (ResultSet rs = meta.getCatalogs()) {
                while (rs.next()) {
                    String c = rs.getString("TABLE_CAT");
                    if (c != null && !c.isEmpty() && set.add(c)) {
                        list.add(c);
                    }
                }
            } catch (SQLException ignored) {}
        }
        return list;
    }

    private static Map<String, List<String>> listObjects(DatabaseMetaData meta, List<String> schemas) throws SQLException {
        List<String> tables = new ArrayList<>();
        List<String> views = new ArrayList<>();
        List<String> targetSchemas = (schemas == null || schemas.isEmpty()) ? java.util.Collections.singletonList(null) : schemas;

        for (String schema : targetSchemas) {
            try (ResultSet rs = meta.getTables(null, schema, "%", new String[]{"TABLE", "VIEW"})) {
                while (rs.next()) {
                    String type = rs.getString("TABLE_TYPE");
                    String name = rs.getString("TABLE_NAME");
                    String schem = rs.getString("TABLE_SCHEM");
                    if (schem == null || schem.isEmpty()) schem = rs.getString("TABLE_CAT");
                    String qualified = (schem != null && !schem.isEmpty()) ? schem + "." + name : name;
                    if ("VIEW".equalsIgnoreCase(type)) {
                        if (!views.contains(qualified)) views.add(qualified);
                    } else {
                        if (!tables.contains(qualified)) tables.add(qualified);
                    }
                }
            }
        }
        Map<String, List<String>> res = new HashMap<>();
        res.put("tables", tables);
        res.put("views", views);
        return res;
    }

    private static String importObjects(
            DatabaseMetaData meta,
            List<String> schemas,
            List<String> selectedTables,
            List<String> selectedViews
    ) throws SQLException {
        StringBuilder tablesJson = new StringBuilder("[");
        boolean firstTable = true;
        StringBuilder relationsJson = new StringBuilder("[");
        boolean firstRel = true;

        for (String qualified : selectedTables) {
            String[] parts = splitQualified(qualified);
            String schema = parts[0];
            String tableName = parts[1];

            String tableRemarks = "";
            try (ResultSet trs = meta.getTables(null, schema, tableName, new String[]{"TABLE"})) {
                if (trs.next()) {
                    tableRemarks = nonNull(trs.getString("REMARKS"));
                }
            }

            Set<String> pks = new HashSet<>();
            try (ResultSet pkRs = meta.getPrimaryKeys(null, schema, tableName)) {
                while (pkRs.next()) {
                    pks.add(pkRs.getString("COLUMN_NAME"));
                }
            }

            // Indexes
            Map<String, List<String[]>> idxColsMap = new LinkedHashMap<>();
            Map<String, Boolean> idxNonUniqueMap = new HashMap<>();
            try (ResultSet idxRs = meta.getIndexInfo(null, schema, tableName, false, true)) {
                while (idxRs.next()) {
                    String idxName = idxRs.getString("INDEX_NAME");
                    String colName = idxRs.getString("COLUMN_NAME");
                    if (idxName == null || colName == null) continue;
                    boolean nonUnique = idxRs.getBoolean("NON_UNIQUE");
                    String ascDesc = idxRs.getString("ASC_OR_DESC");
                    String order = "D".equalsIgnoreCase(ascDesc) ? "DESC" : "ASC";
                    idxNonUniqueMap.put(idxName, nonUnique);
                    idxColsMap.computeIfAbsent(idxName, k -> new ArrayList<>()).add(new String[]{colName, order});
                }
            } catch (SQLException ignored) {}

            // Columns
            StringBuilder colsJson = new StringBuilder("[");
            boolean firstCol = true;
            try (ResultSet colRs = meta.getColumns(null, schema, tableName, "%")) {
                while (colRs.next()) {
                    String colName = colRs.getString("COLUMN_NAME");
                    String typeName = nonNull(colRs.getString("TYPE_NAME"));
                    int colSize = colRs.getInt("COLUMN_SIZE");
                    int decDigits = colRs.getInt("DECIMAL_DIGITS");
                    int nullable = colRs.getInt("NULLABLE");
                    String defVal = nonNull(colRs.getString("COLUMN_DEF"));
                    String remarks = nonNull(colRs.getString("REMARKS"));
                    String autoInc = "";
                    try { autoInc = nonNull(colRs.getString("IS_AUTOINCREMENT")); } catch (SQLException ignored) {}

                    if (!firstCol) colsJson.append(",");
                    firstCol = false;
                    colsJson.append("{")
                            .append("\"physicalName\":\"").append(esc(colName)).append("\",")
                            .append("\"logicalName\":\"").append(esc(remarks.isEmpty() ? colName : remarks)).append("\",")
                            .append("\"type\":\"").append(esc(typeName.toLowerCase())).append("\",")
                            .append("\"length\":").append(colSize > 0 ? colSize : "null").append(",")
                            .append("\"decimal\":").append(decDigits > 0 ? decDigits : "null").append(",")
                            .append("\"primaryKey\":").append(pks.contains(colName)).append(",")
                            .append("\"notNull\":").append(nullable == DatabaseMetaData.columnNoNulls || pks.contains(colName)).append(",")
                            .append("\"autoIncrement\":").append("YES".equalsIgnoreCase(autoInc)).append(",")
                            .append("\"defaultValue\":\"").append(esc(defVal)).append("\",")
                            .append("\"description\":\"").append(esc(remarks)).append("\"")
                            .append("}");
                }
            }
            colsJson.append("]");

            StringBuilder idxsJson = new StringBuilder("[");
            boolean firstIdx = true;
            for (Map.Entry<String, List<String[]>> entry : idxColsMap.entrySet()) {
                if (!firstIdx) idxsJson.append(",");
                firstIdx = false;
                String idxName = entry.getKey();
                boolean nonUnique = Boolean.TRUE.equals(idxNonUniqueMap.get(idxName));
                idxsJson.append("{")
                        .append("\"name\":\"").append(esc(idxName)).append("\",")
                        .append("\"nonUnique\":").append(nonUnique).append(",\"columns\":[");
                boolean firstIc = true;
                for (String[] ic : entry.getValue()) {
                    if (!firstIc) idxsJson.append(",");
                    firstIc = false;
                    idxsJson.append("{\"columnName\":\"").append(esc(ic[0])).append("\",\"order\":\"").append(ic[1]).append("\"}");
                }
                idxsJson.append("]}");
            }
            idxsJson.append("]");

            if (!firstTable) tablesJson.append(",");
            firstTable = false;
            tablesJson.append("{")
                    .append("\"qualifiedName\":\"").append(esc(qualified)).append("\",")
                    .append("\"schema\":\"").append(esc(nonNull(schema))).append("\",")
                    .append("\"physicalName\":\"").append(esc(tableName)).append("\",")
                    .append("\"logicalName\":\"").append(esc(tableRemarks.isEmpty() ? tableName : tableRemarks)).append("\",")
                    .append("\"description\":\"").append(esc(tableRemarks)).append("\",")
                    .append("\"columns\":").append(colsJson).append(",")
                    .append("\"indexes\":").append(idxsJson)
                    .append("}");

            // Foreign Keys
            try (ResultSet fkRs = meta.getImportedKeys(null, schema, tableName)) {
                while (fkRs.next()) {
                    String pkTable = fkRs.getString("PKTABLE_NAME");
                    String pkSchem = fkRs.getString("PKTABLE_SCHEM");
                    if (pkSchem == null || pkSchem.isEmpty()) pkSchem = fkRs.getString("PKTABLE_CAT");
                    String pkQualified = (pkSchem != null && !pkSchem.isEmpty()) ? pkSchem + "." + pkTable : pkTable;
                    String fkName = nonNull(fkRs.getString("FK_NAME"));
                    int delRule = fkRs.getInt("DELETE_RULE");
                    int updRule = fkRs.getInt("UPDATE_RULE");

                    if (!firstRel) relationsJson.append(",");
                    firstRel = false;
                    relationsJson.append("{")
                            .append("\"name\":\"").append(esc(fkName)).append("\",")
                            .append("\"sourceQualified\":\"").append(esc(pkQualified)).append("\",")
                            .append("\"sourceTable\":\"").append(esc(pkTable)).append("\",")
                            .append("\"targetQualified\":\"").append(esc(qualified)).append("\",")
                            .append("\"targetTable\":\"").append(esc(tableName)).append("\",")
                            .append("\"onDeleteAction\":\"").append(fkAction(delRule)).append("\",")
                            .append("\"onUpdateAction\":\"").append(fkAction(updRule)).append("\"")
                            .append("}");
                }
            } catch (SQLException ignored) {}
        }
        tablesJson.append("]");
        relationsJson.append("]");

        // Views
        StringBuilder viewsJson = new StringBuilder("[");
        boolean firstView = true;
        for (String qualified : selectedViews) {
            String[] parts = splitQualified(qualified);
            String schema = parts[0];
            String viewName = parts[1];
            String viewRemarks = "";
            try (ResultSet vrs = meta.getTables(null, schema, viewName, new String[]{"VIEW"})) {
                if (vrs.next()) viewRemarks = nonNull(vrs.getString("REMARKS"));
            }
            StringBuilder colsJson = new StringBuilder("[");
            boolean firstCol = true;
            try (ResultSet colRs = meta.getColumns(null, schema, viewName, "%")) {
                while (colRs.next()) {
                    String colName = colRs.getString("COLUMN_NAME");
                    String typeName = nonNull(colRs.getString("TYPE_NAME"));
                    int colSize = colRs.getInt("COLUMN_SIZE");
                    if (!firstCol) colsJson.append(",");
                    firstCol = false;
                    colsJson.append("{")
                            .append("\"physicalName\":\"").append(esc(colName)).append("\",")
                            .append("\"logicalName\":\"").append(esc(colName)).append("\",")
                            .append("\"type\":\"").append(esc(typeName.toLowerCase())).append("\",")
                            .append("\"length\":").append(colSize > 0 ? colSize : "null")
                            .append("}");
                }
            }
            colsJson.append("]");

            if (!firstView) viewsJson.append(",");
            firstView = false;
            viewsJson.append("{")
                    .append("\"schema\":\"").append(esc(nonNull(schema))).append("\",")
                    .append("\"physicalName\":\"").append(esc(viewName)).append("\",")
                    .append("\"logicalName\":\"").append(esc(viewRemarks.isEmpty() ? viewName : viewRemarks)).append("\",")
                    .append("\"description\":\"").append(esc(viewRemarks)).append("\",")
                    .append("\"columns\":").append(colsJson)
                    .append("}");
        }
        viewsJson.append("]");

        return "{\"ok\":true,\"tables\":" + tablesJson + ",\"views\":" + viewsJson + ",\"relations\":" + relationsJson + "}";
    }

    private static int executeDdl(Connection con, String ddlSql) throws SQLException {
        if (ddlSql == null || ddlSql.trim().isEmpty()) return 0;
        String[] rawStatements = ddlSql.split(";\\s*(?=\\r?\\n|$)");
        int count = 0;
        try (Statement st = con.createStatement()) {
            for (String raw : rawStatements) {
                String s = raw.replaceAll("(?m)^--.*$", "").trim();
                if (s.isEmpty() || "/".equals(s)) continue;
                st.execute(s);
                count++;
            }
        }
        return count;
    }

    private static String fkAction(int rule) {
        switch (rule) {
            case DatabaseMetaData.importedKeyCascade: return "CASCADE";
            case DatabaseMetaData.importedKeySetNull: return "SET NULL";
            case DatabaseMetaData.importedKeySetDefault: return "SET DEFAULT";
            case DatabaseMetaData.importedKeyNoAction: return "NO ACTION";
            default: return "RESTRICT";
        }
    }

    private static String[] splitQualified(String q) {
        int idx = q.indexOf('.');
        if (idx > 0) return new String[]{q.substring(0, idx), q.substring(idx + 1)};
        return new String[]{null, q};
    }

    private static String nonNull(String s) { return s == null ? "" : s; }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }

    private static String toJsonArray(List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(esc(list.get(i))).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }

    @SuppressWarnings("unchecked")
    private static List<String> strList(Object o) {
        if (o instanceof List) return (List<String>) o;
        return new ArrayList<>();
    }

    // Minimal JSON object parser for flat string / string-array fields
    private static Map<String, Object> parseSimpleJsonObject(String json) {
        Map<String, Object> map = new HashMap<>();
        Pattern p = Pattern.compile("\"([^\"]+)\"\\s*:\\s*(\\[[^\\]]*\\]|\"(?:\\\\.|[^\"\\\\])*\")");
        Matcher m = p.matcher(json);
        while (m.find()) {
            String key = m.group(1);
            String val = m.group(2).trim();
            if (val.startsWith("[")) {
                List<String> items = new ArrayList<>();
                Matcher im = Pattern.compile("\"(?:\\\\.|[^\"\\\\])*\"").matcher(val);
                while (im.find()) {
                    items.add(unescapeJson(im.group().substring(1, im.group().length() - 1)));
                }
                map.put(key, items);
            } else if (val.startsWith("\"")) {
                map.put(key, unescapeJson(val.substring(1, val.length() - 1)));
            }
        }
        return map;
    }

    private static String unescapeJson(String s) {
        return s.replace("\\\"", "\"").replace("\\\\", "\\").replace("\\n", "\n").replace("\\r", "\r").replace("\\t", "\t");
    }
}
