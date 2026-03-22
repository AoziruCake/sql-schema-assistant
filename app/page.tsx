"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import SqlPreview from "@/components/sql-preview";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getMessages, type Locale } from "@/lib/locales";
import {
  generateCreateTableSql,
  generateInsertSql,
  generateUpdateSql,
  generateSelectSql,
  explainPrefixForDialect,
  type ColumnDefinition,
  type SqlDialect
} from "@/lib/sql-generator";
import { DIALECTS } from "@/lib/dialects";
import {
  validateIdentifier,
  type IdentifierErrorCode
} from "@/lib/identifiers";
import {
  Activity,
  AlertTriangle,
  Copy,
  Github,
  GripVertical,
  Save
} from "lucide-react";
import { APP_VERSION } from "@/lib/app-version";
import {
  createExportPayload,
  ImportServiceError,
  parseImportedProjectJson,
  type ImportedProject
} from "@/lib/import-service";
import { formatImportedSchemaDetail } from "@/lib/import-error-details";

const SUGGESTED_COLUMN_NAMES = [
  "id",
  "user_id",
  "username",
  "email",
  "updated_at",
  "created_at"
];

const COLUMN_TYPES = [
  "INT",
  "BIGINT",
  "TEXT",
  "VARCHAR(255)",
  "BOOLEAN",
  "TIMESTAMP"
];

const COLUMN_TYPES_BY_DIALECT: Record<SqlDialect, string[]> = {
  postgres: [
    "SERIAL",
    "BIGSERIAL",
    "INTEGER",
    "BIGINT",
    "TEXT",
    "VARCHAR(255)",
    "BOOLEAN",
    "TIMESTAMPTZ"
  ],
  mysql: [
    "INT",
    "BIGINT",
    "INT AUTO_INCREMENT",
    "BIGINT AUTO_INCREMENT",
    "VARCHAR(255)",
    "TEXT",
    "TINYINT(1)",
    "DATETIME",
    "TIMESTAMP"
  ],
  sqlite: ["INTEGER", "TEXT", "REAL", "NUMERIC", "BLOB", "DATETIME"]
};

const LOCAL_STORAGE_KEY = "local-sql-schema-assistant:v1";

type ColumnLabels = {
  columnName: string;
  columnType: string;
  columnAlias: string;
  columnAliasPlaceholder: string;
  constraintPrimaryKey: string;
  constraintNotNull: string;
  constraintIndex: string;
  duplicateColumnName: string;
  identifierErrorReservedWord: string;
  identifierErrorStartsWithDigit: string;
  identifierErrorInvalidChars: string;
  identifierErrorTooLong: string;
  columnNamePlaceholder: string;
  deleteColumnLabel: string;
};

function identifierErrorText(
  code: IdentifierErrorCode,
  t: ReturnType<typeof getMessages>
): string {
  switch (code) {
    case "reservedWord":      return t.identifierErrorReservedWord;
    case "startsWithDigit":   return t.identifierErrorStartsWithDigit;
    case "invalidChars":      return t.identifierErrorInvalidChars;
    case "tooLong":           return t.identifierErrorTooLong;
  }
}

function createColumnId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function tokenizeBulkPatterns(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let round = 0;
  let curly = 0;
  let square = 0;

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) tokens.push(trimmed);
    current = "";
  };

  for (const ch of input) {
    if (ch === "(") round++;
    if (ch === ")") round = Math.max(0, round - 1);
    if (ch === "{") curly++;
    if (ch === "}") curly = Math.max(0, curly - 1);
    if (ch === "[") square++;
    if (ch === "]") square = Math.max(0, square - 1);

    if ((ch === "," || ch === "\n") && round === 0 && curly === 0 && square === 0) {
      flush();
      continue;
    }

    current += ch;
  }

  flush();

  // さらに空白区切りも扱う
  return tokens
    .flatMap((t) => t.split(/\s+/))
    .map((t) => t.trim())
    .filter(Boolean);
}

function expandBulkPattern(token: string): string[] {
  // range: name[1-3]
  const rangeMatch = token.match(/^(.*)\[(\d+)-(\d+)\](.*)$/);
  if (rangeMatch) {
    const [, prefix, startStr, endStr, suffix] = rangeMatch;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    const step = start <= end ? 1 : -1;
    const result: string[] = [];
    for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
      result.push(`${prefix}${i}${suffix}`);
    }
    return result;
  }

  // braces: name{a,b,c}
  const braceMatch = token.match(/^(.*)\{([^}]+)\}(.*)$/);
  if (braceMatch) {
    const [, prefix, inner, suffix] = braceMatch;
    return inner
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => `${prefix}${v}${suffix}`);
  }

  // alternation: user_(id|name|email)
  const altMatch = token.match(/^(.*)\(([^)]+)\)(.*)$/);
  if (altMatch) {
    const [, prefix, inner, suffix] = altMatch;
    return inner
      .split("|")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => `${prefix}${v}${suffix}`);
  }

  return [token];
}

type SortableColumnRowProps = {
  column: ColumnDefinition;
  index: number;
  dialect: SqlDialect;
  labels: ColumnLabels;
  availableTypes: string[];
  autoFocusName?: boolean;
  isCreateTab: boolean;
  isSelectTab: boolean;
  isLastRow: boolean;
  isDuplicate: boolean;
  isFlashing: boolean;
  nameValidationError: IdentifierErrorCode | null;
  aliasValidationError: IdentifierErrorCode | null;
  onChange: (index: number, changes: Partial<ColumnDefinition>) => void;
  onToggleConstraint: (
    index: number,
    key: "primaryKey" | "notNull" | "index"
  ) => void;
  onDelete: (index: number) => void;
  onAddColumn: () => void;
};

function SortableColumnRow({
  column,
  index,
  dialect,
  labels,
  availableTypes,
  autoFocusName,
  isCreateTab,
  isSelectTab,
  isLastRow,
  isDuplicate,
  isFlashing,
  nameValidationError,
  aliasValidationError,
  onChange,
  onToggleConstraint,
  onDelete,
  onAddColumn
}: SortableColumnRowProps) {
  const identifierErrorMessage = (code: IdentifierErrorCode | null) => {
    if (!code) return null;
    switch (code) {
      case "reservedWord":    return labels.identifierErrorReservedWord;
      case "startsWithDigit": return labels.identifierErrorStartsWithDigit;
      case "invalidChars":    return labels.identifierErrorInvalidChars;
      case "tooLong":         return labels.identifierErrorTooLong;
    }
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id ?? index
  });

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocusName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [autoFocusName]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-slate-800/80 bg-slate-950 p-3.5",
        isDragging && "border-sky-500/70 bg-slate-900/80 shadow-lg"
      )}
    >
      {/* ── Mobile layout (sm未満): ドラッグハンドル非表示、Name+Typeを横並びにコンパクト化 ── */}
      <div className="flex items-start gap-2 sm:hidden">
        <div className="grid flex-1 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-slate-400">
              {labels.columnName}
            </span>
            <Input
              ref={nameInputRef}
              value={column.name}
              list="column-name-suggestions"
              data-col-name-input={index}
              onChange={(e) => onChange(index, { ...column, name: e.target.value })}
              onClear={() => onChange(index, { ...column, name: "" })}
              className={cn(
                (isDuplicate || nameValidationError) &&
                  "border-red-500 focus-visible:ring-red-500/40",
                isFlashing && "animate-flash-error border-red-500"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) {
                    e.preventDefault();
                    if (index > 0) {
                      document.querySelector<HTMLInputElement>(`[data-col-name-input="${index - 1}"]`)?.focus();
                    }
                  } else if (isLastRow) {
                    if (column.name.trim() !== "") { e.preventDefault(); onAddColumn(); }
                  } else {
                    e.preventDefault();
                    document.querySelector<HTMLInputElement>(`[data-col-name-input="${index + 1}"]`)?.focus();
                  }
                }
              }}
              placeholder={labels.columnNamePlaceholder}
            />
            {isDuplicate && (
              <p className="text-[10px] font-medium text-red-400">{labels.duplicateColumnName}</p>
            )}
            {!isDuplicate && nameValidationError && (
              <p className="text-[10px] font-medium text-red-400">{identifierErrorMessage(nameValidationError)}</p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-slate-400">
              {isSelectTab ? labels.columnAlias : labels.columnType}
            </span>
            {isSelectTab ? (
              <>
                <Input
                  value={column.alias ?? ""}
                  onChange={(e) => onChange(index, { ...column, alias: e.target.value })}
                  placeholder={labels.columnAliasPlaceholder}
                  onClear={() => onChange(index, { ...column, alias: "" })}
                  className={cn(aliasValidationError && "border-red-500 focus-visible:ring-red-500/40")}
                />
                {aliasValidationError && (
                  <p className="text-[10px] font-medium text-red-400">{identifierErrorMessage(aliasValidationError)}</p>
                )}
              </>
            ) : (
              <Select
                value={column.type}
                onChange={(e) => onChange(index, { ...column, type: e.target.value })}
              >
                <option value="">{labels.columnType}</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            )}
          </div>
        </div>
        {/* 削除ボタン: 右端・タップしやすいサイズ */}
        <button
          type="button"
          className="mt-5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/60"
          title={labels.deleteColumnLabel}
          onClick={() => onDelete(index)}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M9 3h6m-7 3h8m-7 0v11a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10 10v6m4-6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Desktop layout (sm以上): ドラッグハンドル + 従来レイアウト維持 ── */}
      <div className="hidden items-start justify-between gap-3 sm:flex">
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-[auto_minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="flex items-center justify-center md:pt-5">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-800"
              {...attributes}
              {...listeners}
              aria-label="Reorder column"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400">
              {labels.columnName}
            </span>
            <Input
              ref={nameInputRef}
              value={column.name}
              list="column-name-suggestions"
              data-col-name-input={index}
              onChange={(e) =>
                onChange(index, {
                  ...column,
                  name: e.target.value
                })
              }
              onClear={() => onChange(index, { ...column, name: "" })}
              className={cn(
                (isDuplicate || nameValidationError) &&
                  "border-red-500 focus-visible:ring-red-500/40",
                isFlashing && "animate-flash-error border-red-500"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) {
                    // Shift+Enter: move focus to the previous row
                    e.preventDefault();
                    if (index > 0) {
                      document
                        .querySelector<HTMLInputElement>(
                          `[data-col-name-input="${index - 1}"]`
                        )
                        ?.focus();
                    }
                  } else if (isLastRow) {
                    // Enter on last row: add new column (guard: non-empty name)
                    if (column.name.trim() !== "") {
                      e.preventDefault();
                      onAddColumn();
                    }
                  } else {
                    // Enter on non-last row: move focus to the next row
                    e.preventDefault();
                    document
                      .querySelector<HTMLInputElement>(
                        `[data-col-name-input="${index + 1}"]`
                      )
                      ?.focus();
                  }
                }
              }}
              placeholder={labels.columnNamePlaceholder}
            />
            {isDuplicate && (
              <p className="text-[10px] font-medium text-red-400">
                {labels.duplicateColumnName}
              </p>
            )}
            {!isDuplicate && nameValidationError && (
              <p className="text-[10px] font-medium text-red-400">
                {identifierErrorMessage(nameValidationError)}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400">
              {isSelectTab ? labels.columnAlias : labels.columnType}
            </span>
            {isSelectTab ? (
              <>
              <Input
                value={column.alias ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    ...column,
                    alias: e.target.value
                  })
                }
                placeholder={labels.columnAliasPlaceholder}
                onClear={() => onChange(index, { ...column, alias: "" })}
                className={cn(
                  aliasValidationError &&
                    "border-red-500 focus-visible:ring-red-500/40"
                )}
              />
              {aliasValidationError && (
                <p className="text-[10px] font-medium text-red-400">
                  {identifierErrorMessage(aliasValidationError)}
                </p>
              )}
              </>
            ) : (
              <Select
                value={column.type}
                onChange={(e) =>
                  onChange(index, {
                    ...column,
                    type: e.target.value
                  })
                }
              >
                <option value="">{labels.columnType}</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>
        <button
          type="button"
          className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/60"
          title={labels.deleteColumnLabel}
          onClick={() => onDelete(index)}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              d="M9 3h6m-7 3h8m-7 0v11a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M10 10v6m4-6v6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {isCreateTab && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <input
              id={`pk-${index}`}
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              checked={Boolean(column.constraints.primaryKey)}
              onChange={() => onToggleConstraint(index, "primaryKey")}
            />
            <label
              htmlFor={`pk-${index}`}
              className="cursor-pointer select-none"
            >
              {labels.constraintPrimaryKey}
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <input
              id={`nn-${index}`}
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              checked={Boolean(column.constraints.notNull)}
              onChange={() => onToggleConstraint(index, "notNull")}
            />
            <label
              htmlFor={`nn-${index}`}
              className="cursor-pointer select-none"
            >
              {labels.constraintNotNull}
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <input
              id={`idx-${index}`}
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              checked={Boolean(column.constraints.index)}
              onChange={() => onToggleConstraint(index, "index")}
            />
            <label
              htmlFor={`idx-${index}`}
              className="cursor-pointer select-none"
            >
              {labels.constraintIndex}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = getMessages(locale);

  const [dialect, setDialect] = useState<SqlDialect>("postgres");
  const [tableName, setTableName] = useState("users");
  const [schemaName, setSchemaName] = useState("");
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    {
      id: createColumnId(),
      name: "id",
      type: "SERIAL",
      constraints: { primaryKey: true, notNull: true }
    },
    {
      id: createColumnId(),
      name: "email",
      type: "TEXT",
      constraints: { notNull: true }
    },
    {
      id: createColumnId(),
      name: "created_at",
      type: "TIMESTAMP",
      constraints: { notNull: true }
    }
  ]);
  const [copied, setCopied] = useState(false);
  const [copyBlocked, setCopyBlocked] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [suspendPersist, setSuspendPersist] = useState(false);
  const [dirtyColumns, setDirtyColumns] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [activeSqlTab, setActiveSqlTab] = useState<
    "create" | "insert" | "update" | "select"
  >("create");
  const [mounted, setMounted] = useState(false);
  const [lastAddedColumnId, setLastAddedColumnId] = useState<string | null>(null);
  const [includeExplain, setIncludeExplain] = useState(false);
  const [bulkPatternInput, setBulkPatternInput] = useState("");
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  type BulkValidationError = {
    name: string;
    reason: "empty" | "duplicateInBatch" | "duplicateWithExisting" | IdentifierErrorCode;
  };
  const [bulkValidationErrors, setBulkValidationErrors] = useState<BulkValidationError[]>([]);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("error");
  const [importCardDragActive, setImportCardDragActive] = useState(false);
  const [projectStorageOpen, setProjectStorageOpen] = useState(false);
  const [projectStorageImportError, setProjectStorageImportError] = useState<
    string | null
  >(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync html[lang] and meta[description] with the active locale
  useEffect(() => {
    document.documentElement.lang = locale;
    const metaDesc = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    if (metaDesc) metaDesc.content = t.seoDescription;
  }, [locale, t]);

  const baseDefinition = useMemo(
    () => ({
      tableName,
      schemaName,
      columns,
      dialect
    }),
    [tableName, schemaName, columns, dialect]
  );

  const createSql = useMemo(
    () => generateCreateTableSql(baseDefinition),
    [baseDefinition]
  );
  const insertSql = useMemo(
    () => generateInsertSql(baseDefinition),
    [baseDefinition]
  );
  const updateSql = useMemo(
    () => generateUpdateSql(baseDefinition),
    [baseDefinition]
  );
  const selectSql = useMemo(
    () => generateSelectSql(baseDefinition),
    [baseDefinition]
  );

  const baseSql =
    activeSqlTab === "create"
      ? createSql
      : activeSqlTab === "insert"
      ? insertSql
      : activeSqlTab === "update"
      ? updateSql
      : selectSql;

  // Build a Set of column names that appear more than once (empty name is ignored)
  const duplicateNames = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const col of columns) {
      const name = col.name.trim();
      if (!name) continue;
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return new Set(
      Object.entries(counts)
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [columns]);

  // In SELECT mode, also detect duplicate non-empty aliases
  const duplicateAliases = useMemo(() => {
    if (activeSqlTab !== "select") return new Set<string>();
    const counts: Record<string, number> = {};
    for (const col of columns) {
      const alias = (col.alias ?? "").trim();
      if (!alias) continue;
      counts[alias] = (counts[alias] ?? 0) + 1;
    }
    return new Set(
      Object.entries(counts)
        .filter(([, count]) => count > 1)
        .map(([alias]) => alias)
    );
  }, [columns, activeSqlTab]);

  const hasDuplicates =
    duplicateNames.size > 0 ||
    (activeSqlTab === "select" && duplicateAliases.size > 0);

  const hasEmptyName = columns.some((c) => c.name.trim() === "");

  // Per-column identifier validation: Map<columnId, { name, alias }>
  const identifierErrors = useMemo(() => {
    const map = new Map<
      string,
      { name: IdentifierErrorCode | null; alias: IdentifierErrorCode | null }
    >();
    for (const col of columns) {
      const id = col.id ?? "";
      map.set(id, {
        name: validateIdentifier(col.name),
        alias: validateIdentifier(col.alias ?? "", true)
      });
    }
    return map;
  }, [columns]);

  // Table name / Schema name validation (both optional when empty)
  const tableNameError: IdentifierErrorCode | null = validateIdentifier(tableName, true);
  const schemaNameError: IdentifierErrorCode | null = validateIdentifier(schemaName, true);

  const hasInvalidIdentifiers = useMemo(
    () =>
      tableNameError !== null ||
      schemaNameError !== null ||
      Array.from(identifierErrors.values()).some(
        (e) => e.name !== null || e.alias !== null
      ),
    [tableNameError, schemaNameError, identifierErrors]
  );

  const sql = useMemo(() => {
    if (!includeExplain) return baseSql;
    if (activeSqlTab === "create") return baseSql;
    const prefix = explainPrefixForDialect(dialect);
    return `${prefix}${baseSql}`;
  }, [includeExplain, baseSql, activeSqlTab, dialect]);

  const totalColumns = columns.length;
  const primaryKeyColumns = columns.filter(
    (c) => c.constraints.primaryKey
  ).length;
  const notNullColumns = columns.filter((c) => c.constraints.notNull).length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4
      }
    })
  );

  const handleColumnChange = (
    index: number,
    changes: Partial<ColumnDefinition>
  ) => {
    setColumns((prev) =>
      prev.map((col, i) => {
        if (i !== index) return col;
        const updated: ColumnDefinition = {
          ...col,
          ...changes,
          constraints: {
            ...col.constraints,
            ...(changes as ColumnDefinition).constraints
          }
        };

        // マークを「触られた」状態に更新（名前かエイリアスが変更された場合）
        if (
          Object.prototype.hasOwnProperty.call(changes, "name") ||
          Object.prototype.hasOwnProperty.call(changes, "alias")
        ) {
          const id = updated.id ?? col.id;
          if (id) {
            setDirtyColumns((prevDirty) => {
              const next = new Set(prevDirty);
              next.add(id);
              return next;
            });
          }
        }

        return updated;
      })
    );
  };

  const handleToggleConstraint = (
    index: number,
    key: "primaryKey" | "notNull" | "index"
  ) => {
    setColumns((prev) =>
      prev.map((col, i) =>
        i === index
          ? {
              ...col,
              constraints: {
                ...col.constraints,
                [key]: !col.constraints[key]
              }
            }
          : col
      )
    );
  };

  const handleAddColumn = () => {
    const id = createColumnId();
    setLastAddedColumnId(id);
    setColumns((prev) => [
      ...prev,
      {
        id,
        name: "",
        type: "",
        constraints: {}
      }
    ]);
  };

  const handleBulkAddColumns = () => {
    const tokens = tokenizeBulkPatterns(bulkPatternInput);
    const expanded = tokens.flatMap(expandBulkPattern);
    if (!expanded.length) return;

    // バリデーション
    const errors: BulkValidationError[] = [];
    const seenInBatch = new Set<string>();
    const existingNames = new Set(columns.map((c) => c.name.trim().toLowerCase()));

    for (const name of expanded) {
      const trimmed = name.trim();

      if (!trimmed) {
        errors.push({ name: "(empty)", reason: "empty" });
        continue;
      }

      const lower = trimmed.toLowerCase();

      if (seenInBatch.has(lower)) {
        errors.push({ name: trimmed, reason: "duplicateInBatch" });
        continue;
      }
      seenInBatch.add(lower);

      if (existingNames.has(lower)) {
        errors.push({ name: trimmed, reason: "duplicateWithExisting" });
        continue;
      }

      const identifierError = validateIdentifier(trimmed);
      if (identifierError) {
        errors.push({ name: trimmed, reason: identifierError });
      }
    }

    if (errors.length > 0) {
      setBulkValidationErrors(errors);
      return;
    }

    setBulkValidationErrors([]);

    setColumns((prev) => {
      const next = [...prev];
      let firstNewId: string | null = null;
      for (const name of expanded) {
        const id = createColumnId();
        if (!firstNewId) firstNewId = id;
        next.push({
          id,
          name,
          type: "TEXT",
          constraints: {}
        });
      }
      if (firstNewId) {
        setLastAddedColumnId(firstNewId);
      }
      return next;
    });

    setBulkPatternInput("");
    setBulkAddOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { altKey, ctrlKey, metaKey, shiftKey, code } = event;
      const key = (event.key || "").toLowerCase();

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target as HTMLElement | null)?.isContentEditable;
      if (isEditable) return;

      // Add column: Alt/Option+N
      const isAddViaAltN =
        altKey && !ctrlKey && !metaKey && (key === "n" || code === "KeyN");

      // Bulk add: Ctrl+B / Cmd+B / Ctrl+Shift+B
      const isBulkViaCtrlB =
        ctrlKey && !altKey && (key === "b" || code === "KeyB");
      const isBulkViaCtrlShiftB =
        ctrlKey && !altKey && shiftKey && (key === "b" || code === "KeyB");
      const isBulkViaCmdB =
        metaKey && !altKey && (key === "b" || code === "KeyB");

      const isAddShortcut = isAddViaAltN;
      const isBulkShortcut =
        isBulkViaCtrlB || isBulkViaCtrlShiftB || isBulkViaCmdB;

      if (isAddShortcut) {
        event.preventDefault();
        event.stopPropagation();
        handleAddColumn();
        return;
      }

      if (isBulkShortcut) {
        event.preventDefault();
        event.stopPropagation();
        setBulkAddOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleAddColumn]);

  const handleToggleExplain = () => {
    if (activeSqlTab === "create") return;
    setIncludeExplain((prev) => !prev);
  };

  const handleDeleteColumn = (index: number) => {
    setColumns((prev) => {
      const toRemove = prev[index];
      if (toRemove?.id) {
        setDirtyColumns((prevDirty) => {
          const next = new Set(prevDirty);
          next.delete(toRemove.id as string);
          return next;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const showToast = (message: string, tone: "success" | "error" = "error") => {
    setToastTone(tone);
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportProject = () => {
    const payload = createExportPayload({
      dialect,
      tableName,
      schemaName,
      columns
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `sql-schema-v${APP_VERSION}_${datePart}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSuccess = (project: ImportedProject) => {
    const hasCurrentData =
      tableName.trim() !== "" ||
      schemaName.trim() !== "" ||
      columns.some((c) => c.name.trim() !== "" || c.type.trim() !== "");
    if (hasCurrentData) {
      const confirmed = window.confirm(t.projectStorageImportConfirmOverwrite);
      if (!confirmed) return;
    }

    const firstTable = project.data.tables[0];
    if (!firstTable) {
      setProjectStorageImportError(t.projectStorageImportErrorInvalidSchema);
      showToast(t.projectStorageImportFailedToast, "error");
      return;
    }

    setSuspendPersist(true);
    setDialect(project.data.dialect);
    setTableName(firstTable.name.slice(0, 256));
    setSchemaName((firstTable.schemaName ?? "").slice(0, 256));
    setColumns(
      firstTable.columns.map((c) => ({
        id: createColumnId(),
        name: c.name.slice(0, 256),
        type: c.type.slice(0, 128),
        alias: c.alias?.slice(0, 256),
        constraints: {
          primaryKey: Boolean(c.constraints.primaryKey),
          notNull: Boolean(c.constraints.notNull),
          index: Boolean(c.constraints.index)
        }
      }))
    );
    setDirtyColumns(new Set());
    setProjectStorageImportError(null);
    showToast(t.projectStorageImportSuccess, "success");
  };

  const handleImportError = (code: string, details?: string) => {
    const formatImportDetails = (rawDetails?: string) => {
      if (!rawDetails) return null;
      return formatImportedSchemaDetail(rawDetails, t);
    };

    const shortToast = () => showToast(t.projectStorageImportFailedToast, "error");

    switch (code) {
      case "FILE_TOO_LARGE":
        setProjectStorageImportError(t.projectStorageImportErrorFileTooLarge);
        shortToast();
        break;
      case "INVALID_JSON":
        setProjectStorageImportError(t.projectStorageImportErrorInvalidJson);
        shortToast();
        break;
      case "VERSION_TOO_NEW": {
        const fileVersion = details ?? "";
        const msg = t.projectStorageImportErrorVersionTooNew.replace(
          "{fileVersion}",
          fileVersion
        );
        setProjectStorageImportError(msg);
        shortToast();
        break;
      }
      default:
        setProjectStorageImportError(
          details
            ? `${t.projectStorageImportErrorInvalidSchema} (${formatImportDetails(details) ?? details})`
            : t.projectStorageImportErrorInvalidSchema
        );
        shortToast();
        break;
    }
  };

  const processImportFile = async (file: File) => {
    setProjectStorageImportError(null);
    if (file.size > 2 * 1024 * 1024) {
      handleImportError("FILE_TOO_LARGE");
      return;
    }
    try {
      const text = await file.text();
      const imported = parseImportedProjectJson(text);
      handleImportSuccess(imported);
    } catch (err) {
      if (err instanceof ImportServiceError) {
        handleImportError(err.code, err.details);
        return;
      }
      handleImportError("INVALID_SCHEMA");
    }
  };

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    await processImportFile(file);
  };

  const handleImportCardDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setImportCardDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await processImportFile(file);
  };

  const flashColumns = (ids: string[]) => {
    const idSet = new Set(ids);
    setFlashingIds(idSet);
    setTimeout(() => setFlashingIds(new Set()), 1200);
  };

  const triggerCopyBlocked = () => {
    setCopyBlocked(true);
    setTimeout(() => setCopyBlocked(false), 1600);
  };

  const handleCopy = async () => {
    if (hasEmptyName) {
      triggerCopyBlocked();
      showToast(t.copyBlockedEmptyName);
      flashColumns(
        columns
          .filter((c) => c.name.trim() === "")
          .map((c) => c.id ?? "")
          .filter(Boolean)
      );
      return;
    }
    if (hasDuplicates) {
      triggerCopyBlocked();
      showToast(t.copyBlockedDuplicate);
      flashColumns(
        columns
          .filter(
            (c) =>
              duplicateNames.has(c.name.trim()) ||
              (activeSqlTab === "select" &&
                duplicateAliases.has((c.alias ?? "").trim()))
          )
          .map((c) => c.id ?? "")
          .filter(Boolean)
      );
      return;
    }
    if (hasInvalidIdentifiers) {
      triggerCopyBlocked();
      showToast(t.copyBlockedInvalidIdentifier);
      flashColumns(
        columns
          .filter((c) => {
            const e = identifierErrors.get(c.id ?? "");
            return e && (e.name !== null || e.alias !== null);
          })
          .map((c) => c.id ?? "")
          .filter(Boolean)
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // no-op
    }
  };

  const handleSetLocale = (next: Locale) => {
    setLocale(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumns((prev) => {
      const oldIndex = prev.findIndex(
        (c) => (c.id ?? "") === (active.id as string)
      );
      const newIndex = prev.findIndex(
        (c) => (c.id ?? "") === (over.id as string)
      );
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;

      // Runtime shape validation — never trust raw storage data
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      const p = parsed as Record<string, unknown>;

      if (typeof p.tableName === "string" && p.tableName) {
        setTableName(p.tableName.slice(0, 256));
      }
      if (typeof p.schemaName === "string") {
        setSchemaName(p.schemaName.slice(0, 256));
      }
      const VALID_DIALECTS: SqlDialect[] = ["postgres", "mysql", "sqlite"];
      if (typeof p.dialect === "string" && VALID_DIALECTS.includes(p.dialect as SqlDialect)) {
        setDialect(p.dialect as SqlDialect);
      }
      const VALID_LOCALES: Locale[] = ["en", "ja", "es"];
      if (typeof p.locale === "string" && VALID_LOCALES.includes(p.locale as Locale)) {
        setLocale(p.locale as Locale);
      }
      if (Array.isArray(p.columns)) {
        setColumns(
          p.columns
            .filter((c) => c && typeof c === "object" && !Array.isArray(c))
            .map((c: Record<string, unknown>) => ({
              id: typeof c.id === "string" ? c.id : createColumnId(),
              name: typeof c.name === "string" ? c.name.slice(0, 256) : "",
              type: typeof c.type === "string" ? c.type.slice(0, 128) : "",
              alias: typeof c.alias === "string" ? c.alias.slice(0, 256) : undefined,
              constraints: {
                primaryKey: c.constraints != null &&
                  typeof c.constraints === "object" &&
                  Boolean((c.constraints as Record<string, unknown>).primaryKey),
                notNull: c.constraints != null &&
                  typeof c.constraints === "object" &&
                  Boolean((c.constraints as Record<string, unknown>).notNull),
                index: c.constraints != null &&
                  typeof c.constraints === "object" &&
                  Boolean((c.constraints as Record<string, unknown>).index),
              }
            }))
        );
      }
    } catch {
      // Silently discard corrupted or tampered storage data
    } finally {
      setInitialized(true);
    }
  }, []);

  // Persist to localStorage whenever important state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!initialized) return;
    if (suspendPersist) {
      setSuspendPersist(false);
      return;
    }
    try {
      const payload = {
        tableName,
        schemaName,
        columns,
        dialect,
        locale
      };
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      setJustSaved(true);
      const timeout = window.setTimeout(() => setJustSaved(false), 1200);
      return () => window.clearTimeout(timeout);
    } catch {
      // ignore quota / access issues
    }
  }, [tableName, columns, dialect, locale, suspendPersist]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/70 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-[10px] font-semibold tracking-tight text-slate-100">
              SQL
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-100">
                  {t.appTitle}
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="hidden items-center rounded-full border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400 transition-colors duration-150 hover:border-slate-600 hover:bg-slate-900/80 hover:text-slate-100 md:inline-flex"
                    >
                      {t.headerBadge}
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.securityDialogTitle}</DialogTitle>
                      <DialogDescription asChild>
                        <div className="space-y-3 pt-2 text-xs text-slate-400">
                          <p>{t.securityDialogLocalProcessing}</p>
                          <p>{t.securityDialogPrivacyAnalytics}</p>
                          <p>{t.securityDialogOpenSource}</p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-end">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-slate-700 bg-slate-900/80 text-[11px] text-slate-100"
                        >
                          {t.securityDialogCloseLabel}
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="hidden text-[11px] text-slate-500 md:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden cursor-default items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] text-slate-400 md:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono">Local only</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="whitespace-nowrap text-[11px]">
                  {t.localOnlyTooltip}
                </span>
              </TooltipContent>
            </Tooltip>
            <div className="hidden items-center gap-1 text-[10px] text-slate-500 md:flex">
              <span>{t.saveStatusLabel}</span>
              {justSaved && (
                <span className="text-emerald-400">{t.saveStatusSaved}</span>
              )}
            </div>
            <div
              className="flex items-center rounded-md border border-slate-700 bg-slate-900 p-0.5 text-[11px]"
              aria-label={t.languageToggleLabel}
            >
              {(["en", "ja", "es"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleSetLocale(lang)}
                  className={cn(
                    "rounded px-2 py-0.5 font-medium transition-colors",
                    locale === lang
                      ? "bg-slate-700 text-slate-100"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {lang === "en" ? "EN" : lang === "ja" ? "JPN" : "ES"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Dialog
                open={projectStorageOpen}
                onOpenChange={(open) => {
                  setProjectStorageOpen(open);
                  if (!open) setProjectStorageImportError(null);
                }}
              >
                <div className="flex items-center gap-2">
                  {/* Mobile: icon-only Project Storage trigger */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-800/80 bg-slate-900/60 text-slate-300 shadow-sm backdrop-blur hover:border-slate-700 hover:bg-slate-900/90 sm:hidden"
                          aria-label={t.projectStorageSectionTitle}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span className="whitespace-nowrap text-[11px]">
                        {t.projectStorageButtonTooltip}
                      </span>
                    </TooltipContent>
                  </Tooltip>

                  {/* Desktop: text + icon Project Storage trigger */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="hidden items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/60 px-3 py-1 text-[10px] text-slate-300 shadow-sm backdrop-blur hover:border-slate-700 hover:bg-slate-900/90 sm:inline-flex"
                        >
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/80 text-[9px] text-slate-200">
                            ⌘
                          </span>
                          <span className="font-medium tracking-wide">
                            {t.projectStorageSectionTitle}
                          </span>
                        </button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span className="whitespace-nowrap text-[11px]">
                        {t.projectStorageButtonTooltip}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.projectStorageDialogTitle}</DialogTitle>
                    <DialogDescription>
                      {t.projectStorageDialogBody}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <input
                      ref={importInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={handleImportFileChange}
                    />

                    <div className="grid grid-cols-1 gap-3 text-[11px] text-slate-500 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleExportProject}
                        className="cursor-pointer rounded-lg border border-slate-800/70 bg-slate-950/80 px-3 py-3 text-left transition-colors hover:bg-slate-800/70"
                      >
                        <p className="font-mono text-[10px] text-slate-300">
                          {t.projectStorageExportLabel}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          JSON snapshot of your current schema.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => importInputRef.current?.click()}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setImportCardDragActive(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!importCardDragActive) setImportCardDragActive(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setImportCardDragActive(false);
                        }}
                        onDrop={handleImportCardDrop}
                        className={cn(
                          "cursor-pointer rounded-lg border bg-slate-950/80 px-3 py-3 text-left transition-colors hover:bg-slate-800/70",
                          importCardDragActive
                            ? "border-sky-500 ring-1 ring-sky-500/40"
                            : "border-slate-800/70"
                        )}
                      >
                        <p className="font-mono text-[10px] text-slate-300">
                          {t.projectStorageImportLabel}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Restore or fork a saved project configuration.
                        </p>
                        <p className="mt-2 text-[10px] text-slate-400">
                          {t.projectStorageImportDropLabel}
                        </p>
                      </button>
                    </div>

                    {projectStorageImportError && (
                      <div
                        className="flex gap-2.5 rounded-md border border-red-900/60 bg-red-950/40 p-2.5 text-xs shadow-sm"
                        role="alert"
                      >
                        <AlertTriangle
                          className="mt-0.5 h-4 w-4 shrink-0 text-red-200"
                          aria-hidden
                        />
                        <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-white">
                          {projectStorageImportError}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-slate-700 bg-slate-900/80 text-[11px] text-slate-100"
                        >
                          {t.projectStorageCloseLabel}
                        </Button>
                      </DialogClose>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 md:gap-6 md:px-6 md:py-8">
        <Dialog open={bulkAddOpen} onOpenChange={(open) => { setBulkAddOpen(open); if (!open) setBulkValidationErrors([]); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.bulkAddDialogTitle}</DialogTitle>
              <DialogDescription>{t.bulkAddExamplesHint}</DialogDescription>
            </DialogHeader>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-300">
                  {t.bulkAddTextareaLabel}
                </label>
                <Textarea
                  rows={4}
                  value={bulkPatternInput}
                  onChange={(e) => { setBulkPatternInput(e.target.value); setBulkValidationErrors([]); }}
                  placeholder={t.bulkAddTextareaPlaceholder}
                  className={cn(
                    "resize-none bg-slate-950 text-xs",
                    bulkValidationErrors.length > 0 && "border-red-500 focus-visible:ring-red-500/40"
                  )}
                />
              </div>

              {bulkValidationErrors.length > 0 && (
                <div className="rounded-md border border-red-900/60 bg-red-950/30 p-2.5 text-xs">
                  <p className="mb-1.5 font-medium text-red-400">
                    {t.bulkAddValidationTitle}
                  </p>
                  <ul className="space-y-1">
                    {bulkValidationErrors.map((err, i) => {
                      const reasonLabel = (() => {
                        switch (err.reason) {
                          case "empty":                  return t.bulkAddErrorEmpty;
                          case "duplicateInBatch":       return t.bulkAddErrorDuplicateInBatch;
                          case "duplicateWithExisting":  return t.bulkAddErrorDuplicateWithExisting;
                          case "reservedWord":           return t.identifierErrorReservedWord;
                          case "startsWithDigit":        return t.identifierErrorStartsWithDigit;
                          case "invalidChars":           return t.identifierErrorInvalidChars;
                          case "tooLong":                return t.identifierErrorTooLong;
                        }
                      })();
                      return (
                        <li key={i} className="flex gap-1.5 text-red-300">
                          <span className="font-mono font-semibold">{err.name}</span>
                          <span className="text-red-400/80">—</span>
                          <span>{reasonLabel}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-[11px] text-slate-300 hover:bg-slate-900"
                  >
                    {t.bulkAddCancel}
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  size="sm"
                  className="text-[11px]"
                  onClick={handleBulkAddColumns}
                >
                  {t.bulkAddApply}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* compact stats row to give a dashboard feel (desktop only) */}
        {/* overview cards */}
        <section className="hidden grid-cols-1 gap-2 text-xs md:grid md:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2">
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Columns
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {totalColumns}
              </p>
            </div>
            <div className="text-[10px] text-slate-500">schema fields</div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2">
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Primary keys
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {primaryKeyColumns}
              </p>
            </div>
            <div className="text-[10px] text-slate-500">PK columns</div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2">
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                NOT NULL
              </p>
              <p className="text-sm font-semibold text-slate-100">
                {notNullColumns}
              </p>
            </div>
            <div className="text-[10px] text-slate-500">required fields</div>
          </div>
        </section>

        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-6">
          {/* Left: Table definition editor */}
          <section className="flex flex-col rounded-xl border border-slate-800/80 bg-slate-950 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {t.tableDefinition}
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-100">
                  {t.tableNameLabel} &amp; {t.columnsLabel}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      {t.tableNameLabel}
                    </label>
                    <Input
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder={t.tableNamePlaceholder}
                      onClear={() => setTableName("")}
                      className={tableNameError ? "border-red-500 focus-visible:ring-red-500/40" : ""}
                    />
                    {tableNameError && (
                      <p className="text-[10px] font-medium text-red-400">
                        {identifierErrorText(tableNameError, t)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      {t.schemaNameLabel}
                    </label>
                    <Input
                      value={schemaName}
                      onChange={(e) => setSchemaName(e.target.value)}
                      placeholder={t.schemaNamePlaceholder}
                      onClear={() => setSchemaName("")}
                      className={schemaNameError ? "border-red-500 focus-visible:ring-red-500/40" : ""}
                    />
                    {schemaNameError && (
                      <p className="text-[10px] font-medium text-red-400">
                        {identifierErrorText(schemaNameError, t)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-300">
                    {t.columnsLabel}
                  </label>
                  <div className="inline-flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="subtle"
                          type="button"
                          onClick={handleAddColumn}
                        >
                          {t.addColumn}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <span className="whitespace-nowrap text-[11px]">
                          {t.shortcutAddColumnHint}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          className="border-slate-700 text-slate-200 hover:bg-slate-900"
                          onClick={() => setBulkAddOpen(true)}
                        >
                          {t.bulkAddLabel}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <span className="whitespace-nowrap text-[11px]">
                          {t.shortcutBulkAddHint}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      className="border-red-500/60 text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        if (!columns.length) return;
                        if (window.confirm(t.clearAllConfirmMessage)) {
                          setSuspendPersist(true);
                          setColumns([]);
                          setDirtyColumns(new Set());
                          if (typeof window !== "undefined") {
                            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
                          }
                        }
                      }}
                    >
                      {t.clearAllColumnsLabel}
                    </Button>
                  </div>
                </div>

                <datalist id="column-name-suggestions">
                  {SUGGESTED_COLUMN_NAMES.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                {mounted && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={columns.map((c) => c.id ?? "")}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {columns.map((column, index) => (
                          <SortableColumnRow
                            key={column.id ?? index}
                            column={column}
                            index={index}
                            autoFocusName={column.id === lastAddedColumnId}
                            isCreateTab={activeSqlTab === "create"}
                            isSelectTab={activeSqlTab === "select"}
                            isLastRow={index === columns.length - 1}
                            isDuplicate={
                              duplicateNames.has(column.name.trim()) ||
                              (activeSqlTab === "select" &&
                                duplicateAliases.has((column.alias ?? "").trim()))
                            }
                            isFlashing={flashingIds.has(column.id ?? "")}
                            dialect={dialect}
                            nameValidationError={
                              dirtyColumns.has(column.id ?? "")
                                ? identifierErrors.get(column.id ?? "")?.name ?? null
                                : null
                            }
                            aliasValidationError={
                              dirtyColumns.has(column.id ?? "")
                                ? identifierErrors.get(column.id ?? "")?.alias ?? null
                                : null
                            }
                            labels={{
                              columnName: t.columnName,
                              columnType: t.columnType,
                              columnAlias: t.columnAlias,
                              columnAliasPlaceholder: t.columnAliasPlaceholder,
                              constraintPrimaryKey: t.constraintPrimaryKey,
                              constraintNotNull: t.constraintNotNull,
                              constraintIndex: t.constraintIndex,
                              duplicateColumnName: t.duplicateColumnName,
                              identifierErrorReservedWord: t.identifierErrorReservedWord,
                              identifierErrorStartsWithDigit: t.identifierErrorStartsWithDigit,
                              identifierErrorInvalidChars: t.identifierErrorInvalidChars,
                              identifierErrorTooLong: t.identifierErrorTooLong,
                              columnNamePlaceholder: t.columnNamePlaceholder,
                              deleteColumnLabel: t.deleteColumnLabel
                            }}
                            availableTypes={
                              COLUMN_TYPES_BY_DIALECT[dialect] ?? COLUMN_TYPES
                            }
                            onChange={handleColumnChange}
                            onToggleConstraint={handleToggleConstraint}
                            onDelete={handleDeleteColumn}
                            onAddColumn={handleAddColumn}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {columns.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="inline-flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="subtle"
                            type="button"
                            onClick={handleAddColumn}
                          >
                            {t.addColumn}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <span className="whitespace-nowrap text-[11px]">
                            {t.shortcutAddColumnHint}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            className="border-slate-700 text-slate-200 hover:bg-slate-900"
                            onClick={() => setBulkAddOpen(true)}
                          >
                            {t.bulkAddLabel}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <span className="whitespace-nowrap text-[11px]">
                            {t.shortcutBulkAddHint}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right: SQL preview */}
          <section className="flex flex-col rounded-xl border border-slate-800/80 bg-slate-950 p-4 md:p-5">
            <div className="mb-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {t.sqlPreview}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {columns.length === 0 ? t.noColumnsHint : " "}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-2 py-1">
                  <span className="text-[10px] text-slate-500">
                    {t.sqlDialectLabel}
                  </span>
                  <div className="flex gap-1 text-[10px]">
                    {DIALECTS.map((d) => (
                      <Tooltip key={d.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "rounded-full px-2 py-0.5",
                              dialect === d.id
                                ? "bg-slate-100 text-slate-900"
                                : "text-slate-400"
                            )}
                            onClick={() => setDialect(d.id)}
                          >
                            {d.nameKey === "dialectPostgres"
                              ? t.dialectPostgres
                              : d.nameKey === "dialectMySQL"
                              ? t.dialectMySQL
                              : t.dialectSQLite}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <span className="whitespace-nowrap">
                            {d.compatByLocale[locale]}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 p-0.5 text-[10px] text-slate-400">
                  <button
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1",
                      activeSqlTab === "create"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-400"
                    )}
                    onClick={() => setActiveSqlTab("create")}
                  >
                    {t.sqlTabCreate}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1",
                      activeSqlTab === "insert"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-400"
                    )}
                    onClick={() => setActiveSqlTab("insert")}
                  >
                    {t.sqlTabInsert}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1",
                      activeSqlTab === "update"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-400"
                    )}
                    onClick={() => setActiveSqlTab("update")}
                  >
                    {t.sqlTabUpdate}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1",
                      activeSqlTab === "select"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-400"
                    )}
                    onClick={() => setActiveSqlTab("select")}
                  >
                    SELECT
                  </button>
                  <div className="ml-2 flex items-center gap-1 border-l border-slate-800 pl-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleToggleExplain}
                          disabled={activeSqlTab === "create"}
                          aria-pressed={includeExplain}
                          aria-label={
                            includeExplain
                              ? t.includeExplainTooltipOn
                              : t.includeExplainTooltipOff
                          }
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-slate-500/80 transition-colors duration-150 hover:text-slate-100",
                            includeExplain &&
                              activeSqlTab !== "create" &&
                              "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30",
                            activeSqlTab === "create" &&
                              "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-500/80"
                          )}
                        >
                          <Activity className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <span className="whitespace-nowrap text-[11px]">
                          {includeExplain
                            ? t.includeExplainTooltipOn
                            : t.includeExplainTooltipOff}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="relative">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">{t.copyToClipboard}</span>
                  </Button>
                  {copied && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-slate-950/90 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/60">
                      {t.copied}
                    </span>
                  )}
                  {copyBlocked && !copied && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 rounded-md bg-slate-950/90 text-[11px] font-medium text-red-400 ring-1 ring-red-500/60">
                      <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="currentColor" aria-hidden="true">
                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z"/>
                      </svg>
                      Error
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative flex-1 min-h-[280px] rounded-xl border border-slate-800/80 bg-slate-950/80">
              <div className="absolute inset-0 overflow-y-auto overflow-x-hidden rounded-xl">
                <SqlPreview sql={sql} />
              </div>
            </div>
          </section>
        </div>

        <footer className="pb-4 text-center text-[11px] text-slate-500">
          <div className="flex flex-col items-center gap-1.5 text-[10px] text-slate-500">
            <span className="font-mono">
              Runs entirely in your browser · No network calls
            </span>
            <span className="font-mono text-slate-600">
              {t.shortcutsFooter}
            </span>

            {/* Changelog link row */}
            <a
              href="/changelog"
              className="mt-1 font-mono text-slate-500 transition-colors duration-150 hover:text-sky-400"
            >
              v{APP_VERSION} · {t.changelogViewReleaseNotes}
            </a>

            {/* GitHub / X buttons */}
            <div className="mt-0.5 flex items-center gap-3">
              <a
                href="https://github.com/AoziruCake/sql-schema-assistant"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-800/80 px-2 py-1 text-[10px] text-slate-500 transition-colors duration-150 hover:border-slate-600 hover:text-slate-200"
                aria-label="View on GitHub"
              >
                <Github className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View on GitHub</span>
              </a>
              <a
                href="https://x.com/Sugirep"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-800/80 px-2 py-1 text-[10px] text-slate-500 transition-colors duration-150 hover:border-slate-600 hover:text-slate-200"
                aria-label="View on X"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                >
                  <path
                    d="M18.5 3H21l-6.5 7.4L21.5 21H16l-4-5.3L7 21H3.5L10.2 13.1 3.5 3H9l3.6 4.8L18.5 3Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="hidden sm:inline">Visit X</span>
              </a>
            </div>

            <p className="mt-3 text-[10px] text-slate-600">
              {t.footerCopyright}
            </p>
          </div>
        </footer>
      </main>

      {/* Toast notification */}
      {toastMessage && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-medium shadow-lg ring-1",
              toastTone === "success"
                ? "border border-emerald-500/40 text-emerald-300 ring-emerald-500/20"
                : "border border-red-500/40 text-red-300 ring-red-500/20"
            )}
          >
            {toastTone === "success" ? (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-emerald-400" fill="none" aria-hidden="true">
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM11 6.4a.75.75 0 1 1 1.06 1.06L7.5 12.02a.75.75 0 0 1-1.06 0L3.94 9.52A.75.75 0 0 1 5 8.46l1.97 1.97L11 6.4Z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-red-400" fill="none" aria-hidden="true">
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Z" fill="currentColor" fillOpacity="0.3"/>
                <path d="M8 4.75a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.75ZM8 11a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11Z" fill="currentColor"/>
              </svg>
            )}
            {toastMessage}
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}

