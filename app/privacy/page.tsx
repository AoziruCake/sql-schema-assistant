"use client";

import Link from "next/link";
import { getMessages } from "@/lib/locales";
import { useLegalLocale } from "@/lib/use-legal-locale";

export default function PrivacyPage() {
  const legalLocale = useLegalLocale();

  const t = getMessages(legalLocale);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-300"
        >
          {t.legalBackToApp}
        </Link>

        <header className="mt-4 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t.privacyPageTitle}</h1>
          <p className="text-sm text-slate-400">{t.privacyPageIntro}</p>
        </header>

        <main className="mt-8 space-y-6">
          <section className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
            <h2 className="text-base font-semibold text-slate-100">
              {t.privacySectionDataHandlingTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {t.privacySectionDataHandlingBody}
            </p>
          </section>

          <section className="rounded-xl border-2 border-red-500/80 bg-red-950/25 p-5 shadow-[0_0_0_1px_rgba(239,68,68,0.25)_inset]">
            <h2 className="text-base font-bold uppercase tracking-wide text-red-300">
              {t.legalDisclaimerTitle}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-red-100">
              {t.legalDisclaimerBody}
            </p>
          </section>

          <section className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5">
            <h2 className="text-base font-semibold text-slate-100">
              {t.legalGoverningLawTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {t.legalGoverningLawBody}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
