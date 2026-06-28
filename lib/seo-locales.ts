import { addLocaleToPathname, LOCALES, type Locale } from "@/lib/i18n";
import { getAbsoluteUrl } from "@/lib/site-url";

export function getLocalizedAbsoluteUrl(pathname: string, locale: Locale) {
  return getAbsoluteUrl(addLocaleToPathname(pathname, locale));
}

export function getLanguageAlternates(pathname: string) {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, getLocalizedAbsoluteUrl(pathname, locale)]),
  ) as Record<Locale, string>;
}

export function getLocalizedAlternates(pathname: string) {
  return {
    canonical: getAbsoluteUrl(pathname),
    languages: getLanguageAlternates(pathname),
  };
}
