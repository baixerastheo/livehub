import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
import { AppShell } from "@/src/features/shared/components/layout/AppShell";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "LiveHub",
  description: "Livehub : The online communication website",
};

export default async function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={geist.variable}>
      <body>
        <NextIntlClientProvider>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
