# SQL Schema Assistant

> Design database table schemas and generate SQL statements — entirely in your browser.

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](./package.json)
[![License](https://img.shields.io/badge/license-private-lightgrey.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)

---

## Overview

**SQL Schema Assistant** is a 100% client-side tool for database engineers who want to design table schemas and instantly generate SQL statements — with zero data leaving the browser.

No backend. No API calls. No accounts. Just fast, privacy-first SQL generation.

---

## Features

### SQL Generation

| Tab | Output |
|---|---|
| **CREATE** | `CREATE TABLE` statement with constraints and `CREATE INDEX` for indexed columns |
| **INSERT** | `INSERT INTO` with dialect-appropriate dummy values |
| **UPDATE** | `UPDATE ... SET ... WHERE` using the primary key as the condition |
| **SELECT** | `SELECT *` or a named column list with optional `AS` aliases |

- **EXPLAIN toggle** — Prefix any `INSERT` / `UPDATE` / `SELECT` statement with the dialect-correct `EXPLAIN` keyword (`EXPLAIN ANALYZE` for PostgreSQL, `EXPLAIN` for MySQL, `EXPLAIN QUERY PLAN` for SQLite).

### Multi-Dialect Support

| Dialect | Compatible versions |
|---|---|
| PostgreSQL | v12, v13, v14, v15, v16+ |
| MySQL | v8.0+ |
| SQLite | v3.x |

Type names (e.g. `SERIAL` vs `AUTO_INCREMENT`), quoting styles, and index syntax automatically adapt to the selected dialect.

### Column Management

- **Drag & drop reordering** — Reorder columns with visual insertion feedback (powered by `dnd-kit`).
- **Bulk Add** — Generate multiple columns at once using patterns:
  - Comma-separated: `id, name, email`
  - Range expansion: `flg[1-3]` → `flg1`, `flg2`, `flg3`
  - Brace expansion: `col{a,b,c}` → `col_a`, `col_b`, `col_c`
  - Alternatives: `user_(id|name|email)` → `user_id`, `user_name`, `user_email`
- **Per-column constraints** — Primary Key, NOT NULL, Index (available in CREATE mode).
- **SELECT aliases** — Add `AS alias_name` to any column in SELECT mode.
- **Inline clear button** — A `×` button appears inside every input field when it has content.

### Input Validation

The copy button is blocked and the relevant fields are highlighted in red when any of the following issues are detected:

| Rule | Applies to |
|---|---|
| Empty column name | Column Name |
| Duplicate name | Column Name, Alias (SELECT mode) |
| SQL reserved word (`SELECT`, `FROM`, `WHERE`, …) | Column Name, Alias, Table Name, Schema Name |
| Starts with a digit | Column Name, Alias, Table Name, Schema Name |
| Contains invalid characters (non-alphanumeric / non-underscore) | Column Name, Alias, Table Name, Schema Name |
| Exceeds 63 characters | Column Name, Alias, Table Name, Schema Name |

### Persistence

State is saved automatically to `localStorage` on every change (table name, schema name, columns, dialect, language). The data is restored on page reload. Clearing all columns also clears `localStorage`. All stored data is runtime-validated before being applied to prevent corruption from malformed values.

### Internationalisation (i18n)

Switch between **English** and **Japanese** at any time via the language toggle in the header. All UI text, error messages, tooltips, and shortcut guides are fully translated.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + N` / `Option + N` | Add a new column |
| `Enter` (in a Name field, last row) | Add a new column and focus its Name field |
| `Enter` (in a Name field, non-last row) | Move focus to the next row's Name field |
| `Shift + Enter` (in a Name field) | Move focus to the previous row's Name field |
| `Ctrl + B` / `Cmd + B` | Open the Bulk Add dialog |
| `Ctrl + Shift + B` | Open the Bulk Add dialog (alternative) |

> Shortcuts are shown in button tooltips and in the footer shortcut guide.

---

## Security Policy

- **Frontend-only** — All logic runs in the browser. No server, no API, no external network calls.
- **No data transmission** — Schema definitions, table names, and column data never leave the device.
- **Identifier validation** — Column names, aliases, table names, and schema names are checked against SQL reserved words and naming rules before any SQL is generated or copied.
- **Safe rendering** — `dangerouslySetInnerHTML` is not used anywhere. All user input is treated as plain text.
- **localStorage safety** — Persisted data is runtime-validated with type and allowlist checks before being applied to UI state.
- **No `.env` secrets** — This project has no environment variables or credentials of any kind.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Drag & Drop | [@dnd-kit/core](https://dndkit.com/) |
| Syntax Highlighting | [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) |
| Icons | [lucide-react](https://lucide.dev/) |
| UI Primitives | Radix UI (Dialog, Tooltip, Switch) |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Scripts

```bash
# Production build
npm run build

# Start the production server (after build)
npm start

# Lint
npm run lint
```

---

## Project Structure

```
.
├── app/
│   ├── page.tsx          # Main application page (all UI and state)
│   ├── layout.tsx        # Root layout and metadata (OGP, favicon)
│   └── globals.css       # Global styles
├── components/
│   └── ui/               # shadcn/ui components (Button, Input, Dialog, …)
├── lib/
│   ├── locales.ts        # i18n dictionaries (en / ja)
│   ├── sql-generator.ts  # SQL generation logic (CREATE / INSERT / UPDATE / SELECT)
│   ├── identifiers.ts    # SQL identifier validation utility
│   └── dialects.ts       # Dialect definitions and version compatibility
├── public/               # Static assets (favicon, OGP image)
├── tailwind.config.js    # Tailwind configuration (custom animations)
└── next.config.mjs       # Next.js configuration
```

---

## 🚀 Roadmap

We are continuously improving **SQL Schema Assistant**. Here is our plan for the upcoming versions:

### 🟦 Phase 1: Local Efficiency (v1.x) - [Current Focus]
Enhancing the core experience and ensuring data portability.
- [ ] **JSON Export / Import**: Save and load your schema designs as local JSON files to prevent data loss.
- [ ] **Multi-language Support**: Expand support to include English, Japanese, and **Spanish**.
- [ ] **SQL Formatter**: Options to minify or beautify the generated SQL output.
- [ ] **Schema Templates**: One-click presets for common tables (e.g., Users, Auth, Products).

### 🟩 Phase 2: Visual & Power-ups (v2.x)
Bridging the gap between design and development.
- [ ] **Visual ER Diagrams**: Real-time visualization of table relationships using Mermaid.js.
- [ ] **SQL Reverse Engineering**: Import an existing `CREATE TABLE` script to populate the editor.
- [ ] **Enhanced Dialect Support**: Adding support for Oracle, SQL Server, and ClickHouse.

---

## Licence

Private — all rights reserved.
