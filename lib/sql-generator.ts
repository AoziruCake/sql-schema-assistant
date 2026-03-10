export type SqlDialect = "postgres" | "mysql" | "sqlite";

export type ColumnConstraint = {
  primaryKey?: boolean;
  notNull?: boolean;
  index?: boolean;
};

export type ColumnDefinition = {
  // optional UI identifier (for drag & drop, etc.)
  id?: string;
  name: string;
  type: string;
  alias?: string;
  constraints: ColumnConstraint;
};

export type TableDefinition = {
  schemaName?: string;
  tableName: string;
  columns: ColumnDefinition[];
  dialect: SqlDialect;
};

function sanitizeIdentifier(
  name: string,
  fallback: string,
  dialect: SqlDialect
): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const quote = dialect === "mysql" ? "`" : '"';
  const escaped = trimmed.replace(new RegExp(quote, "g"), quote + quote);
  return `${quote}${escaped}${quote}`;
}

function getTableIdentifier(def: TableDefinition): string {
  const tableIdentifierBase = sanitizeIdentifier(
    def.tableName,
    "my_table",
    def.dialect
  );
  let tableIdentifier = tableIdentifierBase;

  if (def.schemaName && def.schemaName.trim().length > 0) {
    const schemaIdentifier = sanitizeIdentifier(
      def.schemaName,
      "public",
      def.dialect
    );
    tableIdentifier = `${schemaIdentifier}.${tableIdentifierBase}`;
  }
  return tableIdentifier;
}

export function generateCreateTableSql(def: TableDefinition): string {
  const tableIdentifier = getTableIdentifier(def);
  if (!def.columns.length) {
    return `-- Define at least one column to generate a CREATE TABLE statement.\nCREATE TABLE ${tableIdentifier} (\n  -- column_name DATA_TYPE\n);`;
  }

  const columnLines = def.columns.map((col) => {
    const name = sanitizeIdentifier(col.name, "column_name", def.dialect);
    const type = col.type.trim() || defaultTypeForDialect(def.dialect);
    const constraints: string[] = [];

    if (col.constraints.primaryKey) {
      constraints.push("PRIMARY KEY");
    }
    if (col.constraints.notNull) {
      constraints.push("NOT NULL");
    }

    const constraintSql = constraints.length ? " " + constraints.join(" ") : "";
    return `  ${name} ${type}${constraintSql}`;
  });

  const columnsSql = columnLines.join(",\n");

  const createTable = `CREATE TABLE ${tableIdentifier} (\n${columnsSql}\n);`;

  const indexLines = def.columns
    .filter((col) => col.constraints.index && !col.constraints.primaryKey)
    .map((col) => {
      const rawColName = col.name.trim() || "column_name";
      const rawTableName = def.tableName.trim() || "my_table";
      const colIdentifier = sanitizeIdentifier(rawColName, "column_name", def.dialect);
      const indexName = `idx_${rawTableName}_${rawColName}`.replace(/[^a-zA-Z0-9_]/g, "_");
      return `CREATE INDEX ${indexName} ON ${tableIdentifier} (${colIdentifier});`;
    });

  if (!indexLines.length) return createTable;
  return `${createTable}\n\n${indexLines.join("\n")}`;
}

function defaultTypeForDialect(dialect: SqlDialect): string {
  switch (dialect) {
    case "postgres":
      return "TEXT";
    case "mysql":
      return "VARCHAR(255)";
    case "sqlite":
      return "TEXT";
  }
}

function dummyValueForType(
  type: string,
  dialect: SqlDialect,
  columnName?: string
): string {
  const col = (columnName ?? "").toLowerCase();

  if (col.includes("email")) {
    return "'user@example.com'";
  }
  if (col === "created_at") {
    if (dialect === "sqlite") {
      return "CURRENT_TIMESTAMP";
    }
    return "NOW()";
  }

  const upper = type.toUpperCase();

  const isNumeric =
    /\b(INT|SERIAL|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|REAL|DOUBLE)\b/.test(
      upper
    );
  const isBoolean =
    /\b(BOOL|BOOLEAN|TINYINT\(1\))\b/.test(upper) ||
    (dialect === "mysql" && upper.startsWith("TINYINT(1)"));
  const isText =
    /\b(CHAR|VARCHAR|TEXT|UUID|JSON|JSONB|ENUM)\b/.test(upper) ||
    upper === "" ||
    !/\b(INT|SERIAL|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|REAL|DOUBLE|DATE|TIME|TIMESTAMP|DATETIME)\b/.test(
      upper
    );
  const isDateTime =
    /\b(DATE|TIME|TIMESTAMP|DATETIME|TIMESTAMPTZ)\b/.test(upper);

  if (isBoolean) {
    return dialect === "mysql" ? "0" : "FALSE";
  }
  if (isNumeric) {
    return "0";
  }
  if (isDateTime) {
    if (dialect === "mysql") {
      return "'2024-01-01 00:00:00'";
    }
    return "'2024-01-01T00:00:00Z'";
  }
  if (isText) {
    return "'example_value'";
  }
  return "NULL";
}

export function generateInsertSql(def: TableDefinition): string {
  const tableIdentifier = getTableIdentifier(def);
  if (!def.columns.length) {
    return `-- Define at least one column to generate an INSERT statement.\nINSERT INTO ${tableIdentifier} (-- columns ...) VALUES (-- values ...);`;
  }

  const columnsSql = def.columns
    .map((col) => sanitizeIdentifier(col.name, "column_name", def.dialect))
    .join(", ");

  const valuesSql = def.columns
    .map((col) =>
      dummyValueForType(
        col.type || defaultTypeForDialect(def.dialect),
        def.dialect,
        col.name
      )
    )
    .join(", ");

  return `INSERT INTO ${tableIdentifier} (${columnsSql})\nVALUES (${valuesSql});`;
}

export function generateUpdateSql(def: TableDefinition): string {
  const tableIdentifier = getTableIdentifier(def);
  if (!def.columns.length) {
    return `-- Define at least one column to generate an UPDATE statement.\nUPDATE ${tableIdentifier} SET -- column = value ... WHERE /* condition */;`;
  }

  const pkColumns = def.columns.filter((c) => c.constraints.primaryKey);
  const nonPkColumns = def.columns.filter(
    (c) => !c.constraints.primaryKey
  );

  const setTargetColumns =
    nonPkColumns.length > 0 ? nonPkColumns : def.columns.slice(0, 1);

  const setSql = setTargetColumns
    .map((col) => {
      const name = sanitizeIdentifier(col.name, "column_name", def.dialect);
      const value = dummyValueForType(
        col.type || defaultTypeForDialect(def.dialect),
        def.dialect,
        col.name
      );
      return `  ${name} = ${value}`;
    })
    .join(",\n");

  const whereColumns = pkColumns.length ? pkColumns : def.columns.slice(0, 1);

  const whereSql = whereColumns
    .map((col) => {
      const name = sanitizeIdentifier(col.name, "column_name", def.dialect);
      const value =
        col.type.toUpperCase().includes("INT") ||
        col.type.toUpperCase().includes("SERIAL")
          ? "1"
          : dummyValueForType(
              col.type || defaultTypeForDialect(def.dialect),
              def.dialect,
              col.name
            );
      return `${name} = ${value}`;
    })
    .join(" AND ");

  return `UPDATE ${tableIdentifier}\nSET\n${setSql}\nWHERE ${whereSql};`;
}

export function generateSelectSql(def: TableDefinition): string {
  const tableIdentifier = getTableIdentifier(def);
  if (!def.columns.length) {
    return `SELECT\n  *\nFROM ${tableIdentifier};`;
  }

  const columnLines = def.columns
    .map((col) => {
      const name = sanitizeIdentifier(col.name, "column_name", def.dialect);
      const alias = col.alias?.trim();
      if (alias) {
        const aliasSanitized = sanitizeIdentifier(alias, "alias", def.dialect);
        return `  ${name} AS ${aliasSanitized}`;
      }
      return `  ${name}`;
    })
    .join(",\n");

  return `SELECT\n${columnLines}\nFROM ${tableIdentifier};`;
}

export function explainPrefixForDialect(dialect: SqlDialect): string {
  switch (dialect) {
    case "postgres":
      return "EXPLAIN ANALYZE ";
    case "mysql":
      return "EXPLAIN ";
    case "sqlite":
      return "EXPLAIN QUERY PLAN ";
  }
}

