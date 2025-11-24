import enCommon from "./en/common.json";
import jaCommon from "./ja/common.json";
export type AvailableLocales = "en" | "ja";
export interface Translation {
  [key: string]: string | Translation; // ネストされたオブジェクトも許容
}
export type Resources = {
  [key in AvailableLocales]: Translation;
};

export const resources = {
  en: {
    common: enCommon,
  },
  ja: {
    common: jaCommon,
  },
} as const;

export default resources;
