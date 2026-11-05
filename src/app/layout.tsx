import type { Metadata } from "next";
import { Commissioner, Literata } from "next/font/google";
import "./globals.css";

const commissioner = Commissioner({
  subsets: ["latin", "latin-ext"],
  variable: "--font-commissioner",
});

const literata = Literata({
  subsets: ["latin", "latin-ext"],
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: "Gustavi rada",
  description: "Rahva Raamatu püsikliendiprogramm",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et" className={`${commissioner.variable} ${literata.variable}`}>
      <body>{children}</body>
    </html>
  );
}
