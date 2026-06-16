// Definice editovatelných textů webu — sdílí je admin UI (formulář) i API
// (whitelist klíčů). Pořadí = pořadí ve formuláři.
export interface TextField {
  key: string;
  label: string;
  hint?: string;
  type: "text" | "textarea";
}

export const TEXT_FIELDS: readonly TextField[] = [
  { key: "site_name", label: "Název webu", type: "text", hint: "Jméno v hlavičce, patičce a titulku." },
  { key: "site_description", label: "Popis webu (SEO)", type: "textarea" },
  { key: "hero_tagline", label: "Hero podtitul", type: "text", hint: "Text pod jménem na úvodní fotce." },
  { key: "tips_heading", label: "Nadpis sekce „Aktuálně“", type: "text" },
  { key: "mesic_heading", label: "Nadpis „Výběr měsíce“", type: "text" },
  { key: "mesic_text", label: "Úvodní text „Výběr měsíce“", type: "textarea" },
  { key: "blog_heading", label: "Nadpis blogu", type: "text" },
  { key: "contact_heading", label: "Nadpis kontaktu", type: "text" },
  { key: "contact_text", label: "Text kontaktu", type: "textarea" },
  { key: "contact_email", label: "Kontaktní e-mail", type: "text" },
  { key: "facebook_url", label: "Facebook URL", type: "text" },
  {
    key: "mail_from",
    label: "Odesílací adresa e-mailů",
    type: "text",
    hint: 'Např. "Petr Svoreň <noreply@petrsvoren.com>". Doména musí být onboardovaná v Cloudflare Email Sending.',
  },
] as const;

export const TEXT_KEYS: readonly string[] = TEXT_FIELDS.map((f) => f.key);
