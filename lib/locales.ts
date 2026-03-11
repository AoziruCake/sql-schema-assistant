export type Locale = "en" | "ja";

type Messages = {
  appTitle: string;
  appSubtitle: string;
  headerBadge: string;
  languageToggleLabel: string;
  sqlDialectLabel: string;
  tableDefinition: string;
  tableNameLabel: string;
  tableNamePlaceholder: string;
  schemaNameLabel: string;
  schemaNamePlaceholder: string;
  columnsLabel: string;
  addColumn: string;
  columnName: string;
  columnType: string;
  columnConstraints: string;
  constraintPrimaryKey: string;
  constraintNotNull: string;
  constraintIndex: string;
  columnAlias: string;
  columnAliasPlaceholder: string;
  duplicateColumnName: string;
  duplicateColumnsSqlError: string;
  copyBlockedEmptyName: string;
  copyBlockedDuplicate: string;
  copyBlockedInvalidIdentifier: string;
  identifierErrorReservedWord: string;
  identifierErrorStartsWithDigit: string;
  identifierErrorInvalidChars: string;
  identifierErrorTooLong: string;
  deleteColumnLabel: string;
  clearAllColumnsLabel: string;
  clearAllConfirmMessage: string;
  saveStatusLabel: string;
  saveStatusSaved: string;
  sqlPreview: string;
  sqlTabCreate: string;
  sqlTabInsert: string;
  sqlTabUpdate: string;
  dialectPostgres: string;
  dialectMySQL: string;
  dialectSQLite: string;
  copyToClipboard: string;
  copied: string;
  noColumnsHint: string;
  columnNamePlaceholder: string;
  columnTypePlaceholder: string;
  projectStorageSectionTitle: string;
  projectStorageExportLabel: string;
  projectStorageImportLabel: string;
  projectStorageButtonTooltip: string;
  projectStorageDialogTitle: string;
  projectStorageDialogBody: string;
  localOnlyTooltip: string;
  includeExplainTooltipOn: string;
  includeExplainTooltipOff: string;
  bulkAddLabel: string;
  bulkAddDialogTitle: string;
  bulkAddTextareaLabel: string;
  bulkAddTextareaPlaceholder: string;
  bulkAddExamplesHint: string;
  bulkAddApply: string;
  bulkAddCancel: string;
  shortcutsFooter: string;
  shortcutAddColumnHint: string;
  shortcutBulkAddHint: string;
  securityDialogTitle: string;
  securityDialogLocalProcessing: string;
  securityDialogPrivacyAnalytics: string;
  securityDialogOpenSource: string;
  securityDialogCloseLabel: string;
};

export const dictionaries: Record<Locale, Messages> = {
  en: {
    appTitle: "SQL Schema Assistant",
    appSubtitle:
      "Design table schemas and generate SQL statements entirely in your browser.",
    headerBadge: "🔒 100% Local & Secure",
    languageToggleLabel: "Language",
    sqlDialectLabel: "SQL dialect",
    tableDefinition: "Table definition",
    tableNameLabel: "Table name",
    tableNamePlaceholder: "e.g. users, audit_logs",
    schemaNameLabel: "Schema name",
    schemaNamePlaceholder: "e.g. public, auth",
    columnsLabel: "Columns",
    addColumn: "Add column",
    columnName: "Name",
    columnType: "Type",
    columnConstraints: "Constraints",
    constraintPrimaryKey: "Primary key",
    constraintNotNull: "NOT NULL",
    constraintIndex: "Index",
    columnAlias: "Alias (AS)",
    columnAliasPlaceholder: "e.g. total_price",
    duplicateColumnName: "Column name must be unique",
    duplicateColumnsSqlError: "-- Error: Duplicate column names detected.\n-- Please fix all duplicate names before generating SQL.",
    copyBlockedEmptyName: "Please enter all column names before copying.",
    copyBlockedDuplicate: "Duplicate column names detected. Please fix them before copying.",
    copyBlockedInvalidIdentifier: "Invalid column names or aliases detected. Please fix them before copying.",
    identifierErrorReservedWord: "This is a SQL reserved word",
    identifierErrorStartsWithDigit: "Must not start with a digit",
    identifierErrorInvalidChars: "Only letters, digits and underscores are allowed",
    identifierErrorTooLong: "Must be 63 characters or fewer",
    deleteColumnLabel: "Delete column",
    clearAllColumnsLabel: "Clear all",
    clearAllConfirmMessage:
      "This will remove all columns from the table definition. Continue?",
    saveStatusLabel: "Save status",
    saveStatusSaved: "Saved",
    sqlPreview: "Generated SQL",
    sqlTabCreate: "CREATE",
    sqlTabInsert: "INSERT",
    sqlTabUpdate: "UPDATE",
    dialectPostgres: "PostgreSQL",
    dialectMySQL: "MySQL",
    dialectSQLite: "SQLite",
    copyToClipboard: "Copy to clipboard",
    copied: "Copied",
    noColumnsHint:
      "Add at least one column to generate SQL statements (CREATE / INSERT / UPDATE / SELECT).",
    columnNamePlaceholder: "e.g. id, email, created_at",
    columnTypePlaceholder: "Select a type",
    projectStorageSectionTitle: "Project storage",
    projectStorageExportLabel: "Export project (JSON)",
    projectStorageImportLabel: "Import project",
    projectStorageButtonTooltip:
      "Export or import your schema as a JSON file.",
    projectStorageDialogTitle: "Project Storage (JSON)",
    projectStorageDialogBody:
      "Export or import your schema as a JSON file to backup or migrate your project.",
    localOnlyTooltip:
      "Your data never leaves your browser. (Data is never sent outside the browser.)",
    includeExplainTooltipOn: "Exclude EXPLAIN (enabled)",
    includeExplainTooltipOff:
      "Include EXPLAIN statement (PostgreSQL / MySQL / SQLite)",
    bulkAddLabel: "Bulk add",
    bulkAddDialogTitle: "Bulk add columns",
    bulkAddTextareaLabel: "Column patterns",
    bulkAddTextareaPlaceholder:
      "Examples:\n  id, name, email\n  flg[1-3]\n  col{a,b,c}\n  user_(id|name|email)",
    bulkAddExamplesHint:
      "Use commas, ranges like col[1-3], braces like col{1,2,3}, or alternatives like user_(id|name|email).",
    bulkAddApply: "Add columns",
    bulkAddCancel: "Cancel",
    shortcutsFooter:
      "Shortcuts: Alt+N / Option+N (Add) · Enter (Next row) · Shift+Enter (Prev row) · Ctrl+B / Cmd+B (Bulk)",
    shortcutAddColumnHint:
      "Shortcut: Alt+N / Option+N",
    shortcutBulkAddHint:
      "Shortcut: Ctrl+B / Cmd+B, Ctrl+Shift+B",
    securityDialogTitle: "Security & Privacy Policy",
    securityDialogLocalProcessing:
      "Local Processing: All SQL processing and code generation happen entirely within your browser using JavaScript. Your database schema data is never sent to our servers.",
    securityDialogPrivacyAnalytics:
      "Privacy & Analytics: We use Cloudflare Web Analytics to monitor basic site performance and visitor counts. This data is anonymized and contains no personal information or SQL data.",
    securityDialogOpenSource:
      "Open Source: You can verify our security claims by reviewing the source code on GitHub.",
    securityDialogCloseLabel: "Got it!"
  },
  ja: {
    appTitle: "SQL Schema Assistant",
    appSubtitle:
      "ブラウザ内だけでテーブル定義を設計し、SQL文を生成します。",
    headerBadge: "🔒 100% Local & Secure",
    languageToggleLabel: "言語",
    sqlDialectLabel: "SQL 方言",
    tableDefinition: "テーブル定義",
    tableNameLabel: "テーブル名",
    tableNamePlaceholder: "例: users, audit_logs",
    schemaNameLabel: "スキーマ名",
    schemaNamePlaceholder: "例: public, auth",
    columnsLabel: "カラム",
    addColumn: "カラムを追加",
    columnName: "名前",
    columnType: "型",
    columnConstraints: "制約",
    constraintPrimaryKey: "主キー",
    constraintNotNull: "NOT NULL",
    constraintIndex: "インデックス",
    columnAlias: "エイリアス (AS)",
    columnAliasPlaceholder: "例: total_price",
    duplicateColumnName: "カラム名が重複しています",
    duplicateColumnsSqlError: "-- エラー: カラム名が重複しています。\n-- すべての重複を解消してから SQL を生成してください。",
    copyBlockedEmptyName: "カラム名が空の項目があります。名前を入力してからコピーしてください。",
    copyBlockedDuplicate: "カラム名が重複しています。修正してからコピーしてください。",
    copyBlockedInvalidIdentifier: "不適切なカラム名またはエイリアス名が含まれています。修正してからコピーしてください。",
    identifierErrorReservedWord: "SQL の予約語です",
    identifierErrorStartsWithDigit: "数字から始めることはできません",
    identifierErrorInvalidChars: "英数字とアンダースコアのみ使用できます",
    identifierErrorTooLong: "63文字以内にしてください",
    deleteColumnLabel: "カラムを削除",
    clearAllColumnsLabel: "すべて削除",
    clearAllConfirmMessage:
      "すべてのカラム定義を削除します。本当に続行してよろしいですか？",
    saveStatusLabel: "保存状態",
    saveStatusSaved: "保存しました",
    sqlPreview: "生成された SQL",
    sqlTabCreate: "CREATE",
    sqlTabInsert: "INSERT",
    sqlTabUpdate: "UPDATE",
    dialectPostgres: "PostgreSQL",
    dialectMySQL: "MySQL",
    dialectSQLite: "SQLite",
    copyToClipboard: "クリップボードにコピー",
    copied: "コピーしました",
    noColumnsHint:
      "SQL を生成するには、少なくとも 1 つカラムを追加してください。（CREATE / INSERT / UPDATE / SELECT）",
    columnNamePlaceholder: "例: id, email, created_at",
    columnTypePlaceholder: "型を選択",
    projectStorageSectionTitle: "プロジェクトの保存",
    projectStorageExportLabel: "プロジェクトをエクスポート (JSON)",
    projectStorageImportLabel: "プロジェクトをインポート",
    projectStorageButtonTooltip:
      "スキーマをJSONファイルでエクスポート・インポートできます。",
    projectStorageDialogTitle: "プロジェクトの保存 (JSON)",
    projectStorageDialogBody:
      "スキーマをJSONファイルとしてエクスポートまたはインポートして、プロジェクトをバックアップまたは移行できます。",
    localOnlyTooltip:
      "Your data never leaves your browser.（データはブラウザ外に送信されません）",
    includeExplainTooltipOn: "EXPLAIN を解除する（有効中）",
    includeExplainTooltipOff:
      "EXPLAIN を含める（PostgreSQL / MySQL / SQLite）",
    bulkAddLabel: "バルク追加",
    bulkAddDialogTitle: "カラムを一括追加",
    bulkAddTextareaLabel: "カラムパターン",
    bulkAddTextareaPlaceholder:
      "例:\n  id, name, email\n  flg[1-3]\n  col{a,b,c}\n  user_(id|name|email)",
    bulkAddExamplesHint:
      "カンマ区切り、col[1-3] や col{1,2,3}、user_(id|name|email) のようなパターンが使えます。",
    bulkAddApply: "カラムを追加",
    bulkAddCancel: "キャンセル",
    shortcutsFooter:
      "ショートカット: Alt+N / Option+N（追加）· Enter（次の行へ）· Shift+Enter（前の行へ）· Ctrl+B / Cmd+B（Bulk Add）",
    shortcutAddColumnHint:
      "ショートカット: Alt+N / Option+N",
    shortcutBulkAddHint:
      "ショートカット: Ctrl+B / Cmd+B, Ctrl+Shift+B",
      securityDialogTitle: "セキュリティとプライバシーポリシー",
      securityDialogLocalProcessing:
        "ローカル処理: すべてのSQL処理およびコード生成はJavaScriptを使用し、ブラウザ内のみで完結します。データベースのスキーマデータが外部サーバーに送信されることはありません。",
      securityDialogPrivacyAnalytics:
        "プライバシーと分析: サイトの基本的なパフォーマンス測定と訪問者数の把握のために、Cloudflare Web Analyticsを使用しています。このデータは匿名化されており、個人情報やSQLデータが含まれることはありません。",
      securityDialogOpenSource:
        "オープンソース: GitHub上のソースコードを公開しています。セキュリティに関する実装内容はいつでもご確認いただけます。",
      securityDialogCloseLabel: "OK",
  }
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

