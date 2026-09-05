import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

/** Typographie d'interface de la charte Nice-Matin. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Typographie éditoriale des titres, également utilisée par nicematin.com. */
const frankRuhlLibre = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nice-Matin Academy",
    template: "%s - Nice-Matin Academy",
  },
  description:
    "Plateforme d'entraînement commercial Nice-Matin : simulations avec un client virtuel et analyse détaillée par le Coach IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${frankRuhlLibre.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
