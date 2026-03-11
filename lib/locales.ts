import en from "../messages/en.json";
import ja from "../messages/ja.json";

export type Locale = "en" | "ja";

// 型は JSON から推論しつつ、Messages として公開することで
// app/page.tsx など既存コードの型を維持する
export type Messages = typeof en;

export const dictionaries: Record<Locale, Messages> = {
  en,
  ja
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

