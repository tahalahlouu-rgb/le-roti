import type { Metadata } from "next";
import { getLocale, t } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: t.app.name,
    template: `%s — ${t.app.name}`,
  },
  description: t.app.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  return (
    <html lang={locale.lang} dir={locale.dir} className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
