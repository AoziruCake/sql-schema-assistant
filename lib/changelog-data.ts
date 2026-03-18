import type { Locale } from "./locales";

export type SectionType = "Added" | "Changed" | "Fixed" | "Security";

export type ChangelogSection = {
  type: SectionType;
  items: Record<Locale, string[]>;
};

export type VersionEntry = {
  version: string;
  date: string;
  sections: ChangelogSection[];
};

export const changelog: VersionEntry[] = [
  {
    version: "1.1.0",
    date: "2026-03-08",
    sections: [
      {
        type: "Added",
        items: {
          en: [
            "Spanish (ES) locale — full UI translation for Spanish-speaking engineers.",
            "Language selector upgraded from a binary EN/JPN toggle to a three-button segmented control (EN / JPN / ES).",
            "Bulk Add validation — column names are now validated before being added: SQL identifier rules (reserved words, digit-start, invalid chars, length), duplicate detection within the batch, and duplicate detection against existing columns.",
            "Changelog page — in-app release history at /changelog.",
          ],
          ja: [
            "スペイン語（ES）ロケール — スペイン語圏のエンジニア向けに全UIを翻訳。",
            "言語切替UIをEN/JPNのトグルスイッチから、EN / JPN / ES の3ボタンセグメントコントロールに変更。",
            "Bulk Addバリデーション — カラムを追加する前に名前を検証。SQLの予約語・数字始まり・不正文字・長さ制限・バッチ内重複・既存カラムとの重複をチェック。",
            "Changelogページ — /changelog でアプリ内リリース履歴を確認可能に。",
          ],
          es: [
            "Idioma español (ES) — traducción completa de la interfaz para ingenieros hispanohablantes.",
            "Selector de idioma mejorado: de un interruptor binario EN/JPN a un control segmentado de tres botones (EN / JPN / ES).",
            "Validación en Bulk Add — los nombres de columnas ahora se validan antes de agregarse: reglas de identificadores SQL (palabras reservadas, inicio con dígito, caracteres inválidos, longitud), duplicados dentro del lote y duplicados con columnas existentes.",
            "Página de Changelog — historial de versiones dentro de la app en /changelog.",
          ],
        },
      },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-03-08",
    sections: [
      {
        type: "Changed",
        items: {
          en: [
            "Mobile column row: drag handle hidden on small screens (below sm breakpoint). Name and Type fields laid out side-by-side in a compact two-column grid. Delete button enlarged (h-9 w-9) for easier tapping.",
            "Deferred column validation: errors for newly added empty columns no longer appear immediately. Errors show only after a column's Name or Alias field has been edited (isDirty flag).",
            "Stats cards (COLUMNS, PRIMARY KEYS, NOT NULL) hidden on mobile screens.",
            "Project Storage button shows icon-only on mobile, text + icon on desktop.",
            "SQL preview area given minimum height so it remains visible on small screens.",
            "i18n dictionaries moved from lib/locales.ts to external messages/en.json and messages/ja.json for easier language additions.",
          ],
          ja: [
            "モバイルのカラム行レイアウト改善：sm未満ではドラッグハンドルを非表示にし、名前・型フィールドを横並びのコンパクトな2カラムグリッドに。削除ボタンをタップしやすいサイズに拡大。",
            "カラムバリデーションを遅延実行：新規追加した空カラムにはすぐにエラーを表示しない。名前またはエイリアスフィールドを一度編集（isDirty）してからエラーを表示。",
            "モバイルではCOLUMNS・PRIMARY KEYS・NOT NULLの統計カードを非表示。",
            "Project Storageボタンはモバイルではアイコンのみ、デスクトップではテキスト＋アイコン表示。",
            "SQLプレビューエリアに最小高さを設定し、スマホでも表示されるように修正。",
            "i18n辞書データを lib/locales.ts から外部JSONファイル（messages/en.json、messages/ja.json）に移行。",
          ],
          es: [
            "Diseño de columna en móvil: el handle de arrastre se oculta en pantallas pequeñas (por debajo de sm). Los campos Nombre y Tipo se muestran lado a lado en una cuadrícula compacta de dos columnas. Botón de eliminar agrandado para facilitar el toque.",
            "Validación diferida de columnas: los errores en columnas vacías recién agregadas no aparecen de inmediato. Solo se muestran después de editar el campo Nombre o Alias (flag isDirty).",
            "Las tarjetas de estadísticas (COLUMNS, PRIMARY KEYS, NOT NULL) se ocultan en pantallas móviles.",
            "El botón Project Storage muestra solo el ícono en móvil y texto + ícono en escritorio.",
            "Área de vista previa SQL con altura mínima para que siga siendo visible en pantallas pequeñas.",
            "Los diccionarios i18n se migraron de lib/locales.ts a archivos JSON externos (messages/en.json y messages/ja.json).",
          ],
        },
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-03",
    sections: [
      {
        type: "Added",
        items: {
          en: [
            "Multi-mode SQL output — CREATE TABLE, INSERT INTO, UPDATE ... SET, and SELECT tabs.",
            "EXPLAIN toggle — prefixes output with the dialect-appropriate EXPLAIN keyword.",
            "Schema-qualified identifiers — schema.table notation when a schema name is provided.",
            "CREATE INDEX generation — columns marked Index automatically append CREATE INDEX statements.",
            "Dialect-aware type mapping — PostgreSQL, MySQL, SQLite with SERIAL / AUTO_INCREMENT / AUTOINCREMENT and correct quoting.",
            "Drag & drop column reordering via dnd-kit with live insertion indicator.",
            "Per-column constraints — Primary Key, NOT NULL, Index checkboxes.",
            "SELECT mode aliases — Alias (AS) input that generates column AS alias in SELECT statements.",
            "Bulk Add dialog — generate multiple columns via comma lists, ranges (col[1-3]), braces (col{a,b,c}), and alternation (user_(id|name|email)).",
            "Keyboard shortcuts — Alt+N (add column), Ctrl+B / Cmd+B (bulk add), Enter / Shift+Enter (row navigation).",
            "SQL identifier validation — reserved word check, digit-start, invalid chars, max 63 characters.",
            "Duplicate column name detection with inline error messages.",
            "Copy button with error state when copying is blocked.",
            "Full English / Japanese i18n with localStorage persistence.",
            "Automatic localStorage save/restore for table name, schema name, columns, dialect, language.",
            "Project Storage (JSON export / import) — backup and migrate schemas as local JSON files.",
            "OGP / Twitter Card metadata for social sharing.",
            "GitHub and X (Twitter) links in the footer.",
            "Security & Privacy dialog accessible from the header badge.",
            "Dark-mode dashboard design (Slate 950 base) with syntax-highlighted SQL output.",
          ],
          ja: [
            "多モードSQL出力 — CREATE TABLE・INSERT INTO・UPDATE ... SET・SELECTの4タブ。",
            "EXPLAINトグル — 方言に応じたEXPLAINキーワードを出力の先頭に付加。",
            "スキーマ修飾識別子 — スキーマ名が入力されている場合にschema.table記法を使用。",
            "CREATE INDEX生成 — Indexチェックのカラムに自動でCREATE INDEX文を追加。",
            "方言別型マッピング — PostgreSQL・MySQL・SQLiteに対応し、SERIAL/AUTO_INCREMENT/AUTOINCREMENTと適切なクォートを自動切替。",
            "dnd-kitによるドラッグ＆ドロップのカラム並び替え。",
            "カラムごとの制約 — Primary Key・NOT NULL・Indexチェックボックス。",
            "SELECTモードエイリアス — Alias (AS) 入力でcolumn AS aliasを生成。",
            "Bulk Addダイアログ — カンマ区切り・範囲指定(col[1-3])・波括弧(col{a,b,c})・交代(user_(id|name|email))による一括カラム追加。",
            "キーボードショートカット — Alt+N（カラム追加）・Ctrl+B/Cmd+B（Bulk Add）・Enter/Shift+Enter（行移動）。",
            "SQL識別子バリデーション — 予約語チェック・数字始まり・不正文字・最大63文字。",
            "重複カラム名の検出とインラインエラーメッセージ。",
            "コピーブロック時のエラー状態表示付きコピーボタン。",
            "English/Japanese完全i18n対応、localStorageへの言語設定の保存。",
            "テーブル名・スキーマ名・カラム・方言・言語のlocalStorage自動保存と復元。",
            "プロジェクトストレージ（JSONエクスポート/インポート） — スキーマをローカルJSONとしてバックアップ・移行。",
            "OGP/Twitter Cardメタデータのソーシャル共有対応。",
            "フッターへのGitHubとX（Twitter）リンク。",
            "ヘッダーバッジからアクセスできるセキュリティ&プライバシーダイアログ。",
            "Slate 950ベースのダークモードダッシュボードデザインとシンタックスハイライトSQL出力。",
          ],
          es: [
            "Salida SQL multi-modo — pestañas CREATE TABLE, INSERT INTO, UPDATE ... SET y SELECT.",
            "Toggle de EXPLAIN — agrega la palabra clave EXPLAIN correspondiente al dialecto al inicio de la salida.",
            "Identificadores con prefijo de esquema — notación schema.tabla cuando se proporciona un nombre de esquema.",
            "Generación de CREATE INDEX — las columnas marcadas como Index agregan automáticamente sentencias CREATE INDEX.",
            "Mapeo de tipos según dialecto — PostgreSQL, MySQL, SQLite con SERIAL / AUTO_INCREMENT / AUTOINCREMENT y entrecomillado correcto.",
            "Reordenamiento de columnas con arrastrar y soltar mediante dnd-kit.",
            "Restricciones por columna — checkboxes Primary Key, NOT NULL, Index.",
            "Alias en modo SELECT — campo Alias (AS) que genera column AS alias en sentencias SELECT.",
            "Diálogo Bulk Add — genera múltiples columnas con listas separadas por comas, rangos (col[1-3]), llaves (col{a,b,c}) y alternativas (user_(id|name|email)).",
            "Atajos de teclado — Alt+N (agregar columna), Ctrl+B / Cmd+B (agregar en lote), Enter / Shift+Enter (navegación por filas).",
            "Validación de identificadores SQL — verificación de palabras reservadas, inicio con dígito, caracteres inválidos, máximo 63 caracteres.",
            "Detección de nombres de columna duplicados con mensajes de error inline.",
            "Botón de copiar con estado de error cuando la copia está bloqueada.",
            "i18n completo en inglés / japonés con persistencia en localStorage.",
            "Guardado/restauración automático en localStorage: nombre de tabla, esquema, columnas, dialecto e idioma.",
            "Project Storage (exportar / importar JSON) — copia de seguridad y migración de esquemas como archivos JSON locales.",
            "Metadatos OGP / Twitter Card para compartir en redes sociales.",
            "Enlaces a GitHub y X (Twitter) en el pie de página.",
            "Diálogo de Seguridad & Privacidad accesible desde el badge del encabezado.",
            "Diseño de dashboard en modo oscuro (base Slate 950) con salida SQL resaltada sintácticamente.",
          ],
        },
      },
      {
        type: "Security",
        items: {
          en: [
            ".gitignore hardened — sensitive and generated files excluded from version control.",
            "No external network calls — the application makes zero outbound requests.",
            "Safe rendering — user input is never injected into the DOM as raw HTML.",
          ],
          ja: [
            ".gitignoreの強化 — 機密ファイルや生成ファイルをバージョン管理から除外。",
            "外部ネットワーク通信なし — アプリは一切の外部リクエストを行わない。",
            "安全なレンダリング — ユーザー入力は生のHTMLとしてDOMに挿入されない。",
          ],
          es: [
            ".gitignore reforzado — archivos sensibles y generados excluidos del control de versiones.",
            "Sin llamadas de red externas — la aplicación no realiza ninguna solicitud saliente.",
            "Renderizado seguro — la entrada del usuario nunca se inyecta en el DOM como HTML sin procesar.",
          ],
        },
      },
    ],
  },
];
