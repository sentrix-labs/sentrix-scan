import { defineRouting } from "next-intl/routing";

// DECISION: default locale ID (Indonesia) per user spec. `localePrefix: "always"` forces /id or
// /en in the URL — cleaner for SEO and matches the user's requested /id/* and /en/* structure.
export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
