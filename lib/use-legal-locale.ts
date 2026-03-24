"use client";

import { useEffect, useState } from "react";
import { type Locale } from "@/lib/locales";

const LOCAL_STORAGE_KEY = "local-sql-schema-assistant:v1";
const SUPPORTED_LOCALES: Locale[] = ["en", "ja", "es"];

export function useLegalLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (
        typeof data.locale === "string" &&
        SUPPORTED_LOCALES.includes(data.locale as Locale)
      ) {
        setLocale(data.locale as Locale);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const legalLocale: Locale = locale === "ja" ? "ja" : "en";

  useEffect(() => {
    document.documentElement.lang = legalLocale;
  }, [legalLocale]);

  return legalLocale;
}
