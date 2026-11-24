"use client";

import { LINKS } from "@/i18n";
import { useSite } from "./providers";

export function Footer() {
  const { t } = useSite();
  const link = "rounded-full text-muted transition-colors hover:text-fg";
  return (
    <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-line px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
      <p className="text-muted">{t.footer.rights}</p>
      <ul className="flex items-center gap-6">
        <li>
          <a className={link} href={LINKS.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a className={link} href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </li>
        <li>
          <a className={link} href={`mailto:${LINKS.email}`}>
            {t.footer.email}
          </a>
        </li>
      </ul>
    </footer>
  );
}
