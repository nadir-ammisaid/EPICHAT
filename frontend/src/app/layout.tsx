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
  title: "Epichat",
  description: "Epichat is a real-time chat application for RTC project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} antialiased bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
