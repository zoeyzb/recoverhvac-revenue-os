import type { Metadata } from "next";
import "./globals.css";
import "./additions.css";
import "./premium.css";

export const metadata: Metadata = {
  title: "RecoverHVAC — Revenue Operations",
  description: "HVAC revenue recovery, outreach, AI calling and operations control center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
