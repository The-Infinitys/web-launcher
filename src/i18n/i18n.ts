import resources, { Resources } from "./resources";

export type Locale = keyof typeof resources;

/**
 * ブラウザ（navigator）から言語を検出します。
 * サーバー環境ではデフォルト 'ja' を返します。
 */
export function detectLocaleFromNavigator(): Locale {
  if (typeof navigator === "undefined") return "ja";
  const lang = (navigator.language || navigator.languages?.[0] || "ja").split(
    ",",
  )[0];
  const tag = lang.split("-")[0].toLowerCase();
  if (tag === "en") return "en";
  return "ja";
}

/**
 * 指定されたロケールに対応するリソース（common セクション）を返します。
 * 存在しないロケールが渡された場合は 'ja' を返します。
 */
export function getResourcesForLocale(locale?: string) {
  const l = (locale as Locale) ?? detectLocaleFromNavigator();
  if (l && Object.prototype.hasOwnProperty.call(resources, l)) {
    return resources[l].common;
  }
  return resources.ja.common;
}

/**
 * 便利な初期化関数。ブラウザ環境で検出したロケールとリソースを返す。
 */
export function initI18n(key?: string, lang?: Locale) {
  const locale = lang ?? detectLocaleFromNavigator();

  // Helper to create t function from a resource object
  const makeT = (resObj: Record<string, string>) => (k: string) => {
    if (Object.prototype.hasOwnProperty.call(resObj, k)) {
      return resObj[k];
    }
    // key missing: return key as fallback (do not throw here)
    return k;
  };

  // If a namespace key is provided, return that namespace from resources
  if (key) {
    const l = (locale as Locale) ?? "ja";
    const localeResources: Resources[Locale] | undefined =
      resources[l as Locale];
    if (!localeResources)
      throw new Error(`Locale resources not found for '${l}'`);
    if (!Object.prototype.hasOwnProperty.call(localeResources, key)) {
      throw new Error(
        `Resource namespace '${key}' not found for locale '${l}'`,
      );
    }
    const resPart = localeResources[
      key as keyof typeof localeResources
    ] as Record<string, string>;
    return { locale: l, res: resPart, t: makeT(resPart) };
  }

  const res = getResourcesForLocale(locale);
  return { locale, res, t: makeT(res) };
}

const api = { detectLocaleFromNavigator, getResourcesForLocale, initI18n };

export default api;
