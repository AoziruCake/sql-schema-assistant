import en from "../messages/en.json";
import ja from "../messages/ja.json";
import es from "../messages/es.json";

export type Locale = "en" | "ja" | "es";

// 型は JSON から推論しつつ、Messages として公開することで
// app/page.tsx など既存コードの型を維持する
export type Messages = typeof en;

export const dictionaries: Record<Locale, Messages> = {
  en,
  ja,
  es
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

