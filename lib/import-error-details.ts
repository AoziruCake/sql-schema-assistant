import type { Messages } from "@/lib/locales";
import {
  isIdentifierErrorCode,
  type IdentifierErrorCode
} from "@/lib/identifiers";

/** Zod が返す英語メッセージ（import-service の details 末尾）と辞書キーの対応 */
const ZOD_IMPORT_DETAIL_KEYS: Record<string, keyof Messages> = {
  'Invalid option: expected one of "postgres"|"mysql"|"sqlite"':
    "projectStorageImportDetailInvalidDialect",
  "Too small: expected string to have >=1 characters":
    "projectStorageImportDetailStringTooSmall",
  "Too small: expected array to have >=1 items":
    "projectStorageImportDetailArrayTooSmall"
};

function translateIdentifierCode(
  code: IdentifierErrorCode,
  t: Messages
): string {
  switch (code) {
    case "reservedWord":
      return t.identifierErrorReservedWord;
    case "startsWithDigit":
      return t.identifierErrorStartsWithDigit;
    case "invalidChars":
      return t.identifierErrorInvalidChars;
    case "tooLong":
      return t.identifierErrorTooLong;
  }
}

/**
 * インポート失敗時の `details`（例: `data.tables.0.name: reservedWord`）を、
 * パスはそのまま・末尾の検証メッセージだけロケール向けに置き換える。
 */
export function formatImportedSchemaDetail(rawDetails: string, t: Messages): string {
  const sep = ": ";
  const idx = rawDetails.indexOf(sep);
  if (idx === -1) return rawDetails;

  const pathPart = rawDetails.slice(0, idx);
  const messagePart = rawDetails.slice(idx + sep.length).trim();

  let translated: string;
  if (isIdentifierErrorCode(messagePart)) {
    translated = translateIdentifierCode(messagePart, t);
  } else {
    const zodKey = ZOD_IMPORT_DETAIL_KEYS[messagePart];
    if (zodKey) {
      translated = t[zodKey];
    } else if (messagePart.startsWith("Invalid input:")) {
      translated = t.projectStorageImportDetailInvalidInput;
    } else {
      translated = messagePart;
    }
  }

  return `${pathPart}: ${translated}`;
}
