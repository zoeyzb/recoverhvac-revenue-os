import type { Metadata } from "next";
import "./globals.css";
import "./additions.css";
import "./premium.css";

export const metadata: Metadata = {
  title: "Recover — Turn missed demand into booked revenue",
  description: "The AI revenue operating system for HVAC teams: audit conversion gaps, recover missed demand, book work, and prove revenue.",
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
