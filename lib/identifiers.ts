/**
 * SQL identifier validation utilities.
 * Rules:
 *  - Not a SQL reserved word (case-insensitive)
 *  - Does not start with a digit
 *  - Contains only [a-zA-Z0-9_]
 *  - At most 63 characters (PostgreSQL / MySQL / SQLite practical limit)
 */

export const SQL_RESERVED_WORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "ORDER", "BY", "HAVING",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS", "FULL",
  "ON", "AS", "UNION", "ALL", "DISTINCT", "INTO", "VALUES",
  "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER",
  "TABLE", "INDEX", "VIEW", "SCHEMA", "DATABASE",
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "CONSTRAINT",
  "DEFAULT", "CHECK", "UNIQUE", "NOT", "NULL", "AND", "OR", "IN",
  "IS", "LIKE", "BETWEEN", "EXISTS", "CASE", "WHEN", "THEN", "ELSE",
  "END", "SET", "LIMIT", "OFFSET", "WITH", "RETURNING",
]);

export type IdentifierErrorCode =
  | "reservedWord"
  | "startsWithDigit"
  | "invalidChars"
  | "tooLong";

/**
 * Returns an error code if the identifier is invalid, or null if it is valid.
 * Pass skipEmpty=true to allow empty strings (used for optional alias).
 */
export function validateIdentifier(
  value: string,
  skipEmpty = false
): IdentifierErrorCode | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return skipEmpty ? null : "invalidChars";
  }

  if (trimmed.length > 63) {
    return "tooLong";
  }

  if (/^\d/.test(trimmed)) {
    return "startsWithDigit";
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return "invalidChars";
  }

  if (SQL_RESERVED_WORDS.has(trimmed.toUpperCase())) {
    return "reservedWord";
  }

  return null;
}
