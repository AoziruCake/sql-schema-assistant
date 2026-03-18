"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { changelog, type SectionType } from "@/lib/changelog-data";
import { getMessages, type Locale } from "@/lib/locales";
import { APP_VERSION } from "@/lib/app-version";

const LOCAL_STORAGE_KEY = "local-sql-schema-assistant:v1";

const SECTION_COLORS: Record<SectionType, string> = {
  Added:    "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
  Changed:  "bg-sky-950/60    text-sky-400    border-sky-800/60",
  Fixed:    "bg-amber-950/60  text-amber-400  border-amber-800/60",
  Security: "bg-purple-950/60 text-purple-400 border-purple-800/60",
};

const SECTION_DOT: Record<SectionType, string> = {
  Added:    "bg-emerald-500",
  Changed:  "bg-sky-500",
  Fixed:    "bg-amber-500",
  Security: "bg-purple-500",
};

export default function ChangelogPage() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          typeof data.locale === "string" &&
          ["en", "ja", "es"].includes(data.locale)
        ) {
          setLocale(data.locale as Locale);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const t = getMessages(locale);

  const sectionLabel = (type: SectionType): string => {
    switch (type) {
      case "Added":    return t.changelogSectionAdded;
      case "Changed":  return t.changelogSectionChanged;
      case "Fixed":    return t.changelogSectionFixed;
      case "Security": return t.changelogSectionSecurity;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-300"
          >
            {t.changelogBackLink}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              {t.changelogPageTitle}
            </h1>
            <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-400">
              SQL Schema Assistant
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {changelog.length} releases &middot; Current v{APP_VERSION}
          </p>
        </div>

        {/* Entries */}
        <div className="space-y-8">
          {changelog.map((entry, i) => {
            const isLatest = entry.version === APP_VERSION;
            return (
              <article
                key={entry.version}
                className="relative rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6"
              >
                {/* Version header */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-bold text-slate-100">
                    v{entry.version}
                  </span>
                  {isLatest && (
                    <span className="rounded-full border border-emerald-700/60 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                      {t.changelogLatestBadge}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[12px] text-slate-500">
                    {entry.date}
                  </span>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                  {entry.sections.map((section) => (
                    <div key={section.type}>
                      <span
                        className={`mb-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold ${SECTION_COLORS[section.type]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${SECTION_DOT[section.type]}`}
                        />
                        {sectionLabel(section.type)}
                      </span>
                      <ul className="mt-1.5 space-y-1.5 pl-1">
                        {section.items[locale].map((item, j) => (
                          <li
                            key={j}
                            className="flex gap-2 text-sm leading-relaxed text-slate-300"
                          >
                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Timeline connector */}
                {i < changelog.length - 1 && (
                  <div className="absolute -bottom-4 left-8 h-4 w-px bg-slate-800" />
                )}
              </article>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-10 flex items-center justify-between border-t border-slate-800/60 pt-6 text-[11px] text-slate-600">
          <span className="font-mono">SQL Schema Assistant</span>
          <Link
            href="/"
            className="transition-colors hover:text-slate-400"
          >
            {t.changelogBackLink}
          </Link>
        </footer>
      </div>
    </div>
  );
}
