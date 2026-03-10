import type { Locale } from "./locales";
import type { SqlDialect } from "./sql-generator";

export type DialectId = SqlDialect;

type NameKey = "dialectPostgres" | "dialectMySQL" | "dialectSQLite";

export type DialectDefinition = {
  id: DialectId;
  nameKey: NameKey;
  compatByLocale: Record<Locale, string>;
};

export const DIALECTS: DialectDefinition[] = [
  {
    id: "postgres",
    nameKey: "dialectPostgres",
    compatByLocale: {
      en: "Compatible with v12, v13, v14, v15, v16+",
      ja: "対応バージョン: v12, v13, v14, v15, v16 以降"
    }
  },
  {
    id: "mysql",
    nameKey: "dialectMySQL",
    compatByLocale: {
      en: "Compatible with v8.0+",
      ja: "対応バージョン: v8.0 以降"
    }
  },
  {
    id: "sqlite",
    nameKey: "dialectSQLite",
    compatByLocale: {
      en: "Compatible with v3.x",
      ja: "対応バージョン: v3.x"
    }
  }
];

