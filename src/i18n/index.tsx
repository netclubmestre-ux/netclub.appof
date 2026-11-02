import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ptBR, type TranslationKey } from "./locales/pt-BR";
import { en } from "./locales/en";
import { es } from "./locales/es";
import type { Language } from "@/data/types";

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  "pt-BR": ptBR,
  en,
  es,
};

const STORAGE_KEY = "netclub.language";

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "pt-BR", label: "Português (BR)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

function detectLanguage(): Language {
  if (typeof window === "undefined") return "pt-BR";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "pt-BR" || stored === "en" || stored === "es") return stored;
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("es")) return "es";
  if (browser.startsWith("en")) return "en";
  return "pt-BR";
}

export type TranslateVars = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: TranslateVars) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatRelative: (iso: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Armazenamento indisponível (modo privado): a preferência vale só na sessão.
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[language];
    const t = (key: TranslationKey, vars?: TranslateVars) => {
      const template = dict[key] ?? ptBR[key] ?? key;
      return interpolate(template, vars);
    };
    return {
      language,
      setLanguage,
      t,
      formatDate: (input, options) =>
        new Intl.DateTimeFormat(language, options ?? { dateStyle: "medium" }).format(
          new Date(input),
        ),
      formatNumber: (input, options) => new Intl.NumberFormat(language, options).format(input),
      formatCurrency: (input, currency = "BRL") =>
        new Intl.NumberFormat(language, { style: "currency", currency }).format(input),
      formatRelative: (iso) => {
        const ms = Date.parse(iso);
        if (Number.isNaN(ms)) return "";
        const seconds = Math.max(0, (Date.now() - ms) / 1000);
        if (seconds < 60) return t("common.justNow");
        if (seconds < 3600) return t("common.minutesAgo", { count: Math.floor(seconds / 60) });
        if (seconds < 86400) return t("common.hoursAgo", { count: Math.floor(seconds / 3600) });
        return t("common.daysAgo", { count: Math.floor(seconds / 86400) });
      },
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n precisa estar dentro de <I18nProvider>");
  return ctx;
}

export type { TranslationKey };
