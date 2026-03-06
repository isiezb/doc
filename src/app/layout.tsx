import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FacharztRegister | Ist dein Chirurg wirklich Facharzt?",
  description:
    "Das transparente Verzeichnis für Plastische Chirurgen in DACH. Wir zeigen, wer wirklich Facharzt ist — verifiziert durch Ärztekammern, MedReg und ÖÄK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
