// Shared type for all i18n dictionary namespaces.
// Each namespace file (src/lib/i18n/dicts/*.ts) exports one Dict:
// the same flat key set for both languages. Fallback chain: lang -> fa -> key.
export type Dict = {
  fa: Record<string, string>;
  en: Record<string, string>;
};
