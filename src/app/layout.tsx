import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://jovanysk.github.io";
const TITLE = "Jovany Morales del Ángel | Software Developer, RAG & Backend";
const DESCRIPTION =
  "Junior software developer focused on applied AI (RAG), backend, Python and AWS. Desarrollador de software junior: IA aplicada (RAG), backend, Python y AWS.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: "Jovany Morales del Ángel", url: "https://github.com/JovanySk" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Jovany Morales del Ángel",
    title: TITLE,
    description: DESCRIPTION,
    locale: "es_MX",
    alternateLocale: ["en_US"],
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Jovany Morales del Ángel, software developer" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Runs before paint: picks theme (stored > system) and language (stored > navigator.language).
const bootScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.classList.add(t);var l=localStorage.getItem('lang');if(l!=='es'&&l!=='en'){l=(navigator.language||'').toLowerCase().indexOf('es')===0?'es':'en'}d.lang=l;}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-[100dvh] bg-bg text-fg antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
