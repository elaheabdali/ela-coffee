import type { Messages as AppMessages } from "@ela-coffee/i18n";

declare global {
  // next-intl reads this namespace to type-check message keys
  // (getTranslations / useTranslations) against @ela-coffee/i18n.
  namespace IntlMessages {
    // Empty by design: next-intl requires the interface to extend the
    // app messages type, with no extra members.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Messages extends AppMessages {}
  }
}
