import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "../styles/globals.css";
import "@/styles/body.css";
import "@/styles/headings.css";
import "@/styles/button.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Epichat - Chat en temps réel",
  description: "Epichat est une application de chat en temps réel pour le projet RTC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${archivo.variable} antialiased bg-background`}
      >
        {children}
      </body>
    </html>
  );
}
