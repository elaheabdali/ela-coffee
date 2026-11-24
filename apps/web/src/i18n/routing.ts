import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fa", "en"],
  defaultLocale: "fa",
  // The locale cookie (NEXT_LOCALE) holds only "fa" | "en" — it is a
  // hint, not a session token; the locale also lives in the URL path.
  // - secure: only in production. A Secure cookie is dropped by
  //   browsers over plain HTTP, which would break locale sync in
  //   local dev. On Vercel (HTTPS) it is always Secure.
  // - httpOnly must stay FALSE: next-intl's client navigation writes
  //   this cookie via document.cookie when the locale changes, and
  //   JavaScript cannot write an HttpOnly cookie. SameSite=Lax is
  //   next-intl's default and is kept.
  localeCookie: { secure: process.env.NODE_ENV === "production" },
});

export type Locale = (typeof routing.locales)[number];
