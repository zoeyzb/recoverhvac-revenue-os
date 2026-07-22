import type { Metadata } from "next";
import "./globals.css";
import "./additions.css";
import "./premium.css";

export const metadata: Metadata = {
  title: "Recover — AI revenue operations for service businesses",
  description: "Answer calls, follow up, book customers, improve your website and SEO, and connect every result to verified revenue.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
