import { z } from "zod";
import type { ColumnDefinition, SqlDialect } from "@/lib/sql-generator";
import { APP_VERSION } from "@/lib/app-version";
import { sqlIdentifierSchema } from "@/lib/validators";

const dialectSchema = z.enum(["postgres", "mysql", "sqlite"]);

const constraintsSchema = z
  .object({
    primaryKey: z.boolean().optional(),
    notNull: z.boolean().optional(),
    index: z.boolean().optional()
  })
  .strip();

const columnSchema = z
  .object({
    name: sqlIdentifierSchema(false),
    type: z.string().min(1),
    alias: sqlIdentifierSchema(true).optional(),
    constraints: constraintsSchema.optional()
  })
  .strip();

const tableSchema = z
  .object({
    name: sqlIdentifierSchema(false),
    schemaName: sqlIdentifierSchema(true).optional(),
    columns: z.array(columnSchema).min(1)
  })
  .strip();

const projectSchemaV110 = z
  .object({
    version: z.string().min(1),
    exportedAt: z.string().min(1),
    data: z
      .object({
        dialect: dialectSchema,
        tables: z.array(tableSchema).min(1)
      })
      .strip()
  })
  .strip();

const legacySchemaV1 = z
  .object({
    tableName: sqlIdentifierSchema(false),
    schemaName: sqlIdentifierSchema(true).optional(),
    columns: z.array(columnSchema),
    dialect: dialectSchema,
    locale: z.enum(["en", "ja", "es"]).optional()
  })
  .strip();

export type ImportErrorCode =
  | "FILE_TOO_LARGE"
  | "INVALID_JSON"
  | "VERSION_TOO_NEW"
  | "INVALID_SCHEMA";

export class ImportServiceError extends Error {
  code: ImportErrorCode;
  details?: string;
  constructor(code: ImportErrorCode, message?: string, details?: string) {
    super(message ?? code);
    this.code = code;
    this.details = details;
    this.name = "ImportServiceError";
  }
}

export type ImportedProject = {
  version: string;
  exportedAt: string;
  data: {
    dialect: SqlDialect;
    tables: {
      name: string;
      schemaName?: string;
      columns: ColumnDefinition[];
    }[];
  };
};

export function createExportPayload(input: {
  dialect: SqlDialect;
  tableName: string;
  schemaName: string;
  columns: ColumnDefinition[];
}): ImportedProject {
  return {
    version: "1.1.0",
    exportedAt: new Date().toISOString(),
    data: {
      dialect: input.dialect,
      tables: [
        {
          name: input.tableName,
          schemaName: input.schemaName || undefined,
          columns: input.columns.map((c) => ({
            name: c.name,
            type: c.type,
            alias: c.alias,
            constraints: {
              primaryKey: Boolean(c.constraints.primaryKey),
              notNull: Boolean(c.constraints.notNull),
              index: Boolean(c.constraints.index)
            }
          }))
        }
      ]
    }
  };
}

function migrateLegacy(raw: unknown): ImportedProject | null {
  const parsed = legacySchemaV1.safeParse(raw);
  if (!parsed.success) return null;

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    data: {
      dialect: parsed.data.dialect,
      tables: [
        {
          name: parsed.data.tableName || "imported_table",
          schemaName: parsed.data.schemaName || undefined,
          columns: parsed.data.columns.map((c) => ({
            name: c.name,
            type: c.type,
            alias: c.alias,
            constraints: {
              primaryKey: Boolean(c.constraints?.primaryKey),
              notNull: Boolean(c.constraints?.notNull),
              index: Boolean(c.constraints?.index)
            }
          }))
        }
      ]
    }
  };
}

export function parseImportedProjectJson(input: string): ImportedProject {
  let raw: unknown;
  try {
    raw = JSON.parse(input);
  } catch {
    throw new ImportServiceError("INVALID_JSON");
  }

  const parsed = projectSchemaV110.safeParse(raw);
  if (parsed.success) {
    const fileVersion = parsed.data.version;
    const appVersion = APP_VERSION;

    const toParts = (v: string) =>
      v
        .trim()
        .replace(/^v/i, "")
        .split(".")
        .map((x) => parseInt(x, 10))
        .slice(0, 3);

    const compare = (a: string, b: string): number => {
      const A = toParts(a);
      const B = toParts(b);
      for (let i = 0; i < 3; i += 1) {
        const ai = Number.isFinite(A[i]) ? A[i] : 0;
        const bi = Number.isFinite(B[i]) ? B[i] : 0;
        if (ai > bi) return 1;
        if (ai < bi) return -1;
      }
      return 0;
    };

    if (compare(fileVersion, appVersion) > 0) {
      throw new ImportServiceError(
        "VERSION_TOO_NEW",
        "VERSION_TOO_NEW",
        fileVersion
      );
    }

    return {
      version: parsed.data.version,
      exportedAt: parsed.data.exportedAt,
      data: {
        dialect: parsed.data.data.dialect,
        tables: parsed.data.data.tables.map((t) => ({
          name: t.name,
          schemaName: t.schemaName,
          columns: t.columns.map((c) => ({
            name: c.name,
            type: c.type,
            alias: c.alias,
            constraints: {
              primaryKey: Boolean(c.constraints?.primaryKey),
              notNull: Boolean(c.constraints?.notNull),
              index: Boolean(c.constraints?.index)
            }
          }))
        }))
      }
    };
  }

  const migrated = migrateLegacy(raw);
  if (migrated) return migrated;

  const firstIssue = parsed.error.issues[0];
  const issuePath =
    firstIssue?.path?.length ? firstIssue.path.join(".") : "root";
  const issueMessage = firstIssue?.message ?? "Unknown schema validation error";
  throw new ImportServiceError(
    "INVALID_SCHEMA",
    "INVALID_SCHEMA",
    `${issuePath}: ${issueMessage}`
  );
}
