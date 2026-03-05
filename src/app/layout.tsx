import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Schoenheitsarzt-Verzeichnis | Facharzt oder Fantasietitel?",
  description:
    "Das transparente Verzeichnis fuer Schoenheitsaerzte in Deutschland. Wir zeigen, wer wirklich Facharzt ist und wer nur einen ungeschuetzten Titel fuehrt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
