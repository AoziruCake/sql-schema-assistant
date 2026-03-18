# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0](https://github.com/AoziruCake/sql-schema-assistant/releases/tag/v1.1.0) — 2026-03-08

### Added

- **Spanish (ES) locale** — Full UI translation for Spanish-speaking engineers. Language selector updated from a binary EN/JPN toggle to a three-button segmented control (EN / JPN / ES).
- **Bulk Add validation** — Column names are validated before being added: SQL identifier rules (reserved words, digit-start, invalid chars, max 63 characters), duplicate detection within the batch, and duplicate detection against existing columns. Errors are displayed inside the dialog without closing it.
- **In-app Changelog page** — Release history is now accessible at `/changelog`. The footer version badge links to this page instead of GitHub releases.

---

## [1.0.1](https://github.com/AoziruCake/sql-schema-assistant/releases/tag/v1.0.1) — 2026-03-08

### Changed

- **Mobile column row layout** — Drag handle hidden on small screens (below `sm`). Column name and type fields are laid out side-by-side in a compact two-column grid. Delete button enlarged (`h-9 w-9`) and anchored to the right edge for easier tapping. Desktop drag-and-drop behaviour is unchanged.
- **Deferred column validation** — Validation errors for newly added empty columns are no longer shown immediately. Errors appear only after a user has edited the Name or Alias field of that column (`isDirty` flag).
- **Mobile responsive improvements** — Stats cards (COLUMNS, PRIMARY KEYS, NOT NULL) hidden on mobile. Project Storage button shows icon-only on mobile, text + icon on desktop. SQL preview area given a minimum height so it remains visible on small screens.
- **JSON messages extracted** — Hardcoded `en` / `ja` dictionaries moved from `lib/locales.ts` to `messages/en.json` and `messages/ja.json`, making it easy to add new languages in future.

---

## [1.0.0](https://github.com/AoziruCake/sql-schema-assistant/releases/tag/v1.0.0) — 2026-03-03

### Added

#### SQL Generation

- **Multi-mode SQL output** — Four independent generation tabs: `CREATE TABLE`, `INSERT INTO`, `UPDATE ... SET`, and `SELECT`.
- **EXPLAIN toggle** — Icon button that prefixes `INSERT` / `UPDATE` / `SELECT` output with the dialect-appropriate `EXPLAIN` keyword (`EXPLAIN ANALYZE` for PostgreSQL, `EXPLAIN` for MySQL, `EXPLAIN QUERY PLAN` for SQLite). Disabled on the CREATE tab.
- **Schema-qualified identifiers** — When a schema name is provided, all generated SQL uses `"schema"."table"` notation.
- **CREATE INDEX generation** — Columns marked with the Index constraint automatically append `CREATE INDEX idx_<table>_<column> ON ...` after the `CREATE TABLE` block. Skipped for primary key columns.
- **Dialect-aware type mapping** — `SERIAL` / `AUTO_INCREMENT` / `INTEGER PRIMARY KEY AUTOINCREMENT`, quoting styles, and index syntax all adapt to the selected dialect.

#### Multi-Dialect Support

- **PostgreSQL** (v12–v16+), **MySQL** (v8.0+), **SQLite** (v3.x) dialect selector with version tooltips.

#### Column Management

- **Drag & drop reordering** via `dnd-kit` with live insertion indicator and immediate SQL re-generation.
- **Per-column constraints** — Primary Key, NOT NULL, Index checkboxes (visible in CREATE mode only).
- **SELECT mode aliases** — `Alias (AS)` input field that generates `column AS alias` in SELECT statements.
- **Bulk Add dialog** — Generate multiple columns in one step using patterns:
  - Comma-separated list: `id, name, email`
  - Range expansion: `flg[1-3]` → `flg1`, `flg2`, `flg3`
  - Brace expansion: `col{a,b,c}` → `col_a`, `col_b`, `col_c`
  - Alternatives: `user_(id|name|email)` → `user_id`, `user_name`, `user_email`
- **Auto-focus on new columns** — Name field of a newly added column receives focus automatically.

#### Keyboard Navigation

- `Alt + N` / `Option + N` — Add a new column from anywhere on the page.
- `Ctrl + B` / `Cmd + B` / `Ctrl + Shift + B` — Open the Bulk Add dialog.
- `Enter` on the last row's Name field — Add a new column (guard: field must not be empty).
- `Enter` on a non-last row's Name field — Move focus to the next row's Name field.
- `Shift + Enter` on any row's Name field — Move focus to the previous row's Name field.
- Shortcut hints shown in button tooltips and a persistent footer guide.

#### Validation

- **Empty name guard** — Copy is blocked if any column name is empty; affected fields flash red.
- **Duplicate name detection** — Duplicate column names (and aliases in SELECT mode) are flagged with a red border and inline error message.
- **SQL identifier validation** (`lib/identifiers.ts`) — Applied to column names, aliases, table name, and schema name:
  - SQL reserved word check (50+ keywords: `SELECT`, `FROM`, `WHERE`, `JOIN`, `TABLE`, …)
  - Must not start with a digit
  - Only alphanumeric characters and underscores allowed
  - Maximum length of 63 characters
- **Copy button error state** — When copying is blocked, the button shows a red "Error" overlay (mirroring the "Copied!" success state) and a toast notification explains the cause.

#### Internationalisation (i18n)

- Full **English / Japanese** language support via `lib/locales.ts` dictionary.
- Language preference persisted to `localStorage` and restored on reload.
- All UI text, error messages, tooltips, dialect descriptions, and shortcut guides are translated.

#### Persistence

- Automatic **localStorage** save on every state change (table name, schema name, columns, dialect, language).
- State is restored on page reload.
- Clearing all columns also clears the stored state.

#### UI / UX

- Dark-mode dashboard design (Slate 950 base) with Vercel-inspired layout.
- Syntax-highlighted SQL output via `react-syntax-highlighter`.
- `datalist`-powered column name suggestions (`id`, `user_id`, `email`, `created_at`, `updated_at`).
- `"Local only"` header badge with tooltip: *"Your data never leaves your browser."*
- Project Storage section with **PRO** badge and informational dialog (feature placeholder).
- App version (`v1.0.0`) displayed in the footer with "View Release Notes" tooltip.
- Favicon (SVG + PNG + apple-touch-icon) and static OGP image support.
- Long SQL lines wrap automatically (`white-space: pre-wrap`) with no horizontal scrollbar.
- Flash-error animation (`animate-flash-error`) on invalid fields when copy is blocked.

---

### Changed

- **Dynamic UI per active tab** — Constraint checkboxes (PK, NOT NULL, Index) are hidden in INSERT / UPDATE / SELECT modes, reducing visual noise.
- **Type / Alias field toggle** — The second column input shows the data-type selector in CREATE / INSERT / UPDATE modes and switches to the Alias field in SELECT mode.
- **Inline clear button (`×`)** — Added to all `Input` fields (Table Name, Schema Name, Column Name, Alias). The button appears only when the field has content, clears the value on click, and returns focus to the input. Implemented inside the shared `Input` component via an `onClear` prop.
- **Dialect selector placement** — Moved above the SQL tab bar so dialect context is always visible regardless of the active tab.
- **Copy button placement** — Moved below the SQL tab bar, adjacent to the output it acts on.
- **Enter key behaviour** — Previously added a new column unconditionally; now context-aware (add on last row, navigate on non-last row).
- `**Shift + Enter` global shortcut removed** — Reassigned exclusively to "move to previous row" inside the Name input field.
- **Keyboard shortcut for Bulk Add** — Changed from `Alt + B` (blocked by some browsers) to `Ctrl + B` / `Cmd + B`.

---

### Security

- **`.gitignore` hardened** — Sensitive and generated files are excluded from version control.
- **Source audit** — No secrets, credentials, or machine-specific paths found in the codebase.
- **Safe rendering** — User input is never injected into the DOM as raw HTML.
- **Input validation** — Persisted and user-supplied data is validated before use.
- **Dependency updates** — Dependencies updated to current patched versions.
- **No external network calls** — Confirmed: the application makes zero outbound requests.

---

