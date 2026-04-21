// RootLayout
"use client";

import I18nProvider from "./I18nProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <I18nProvider locale="fr">
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}