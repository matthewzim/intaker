import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caseflow — Smart Legal Intake & Client Workspace",
  description:
    "AI-powered legal intake, document workspace, and two-way communication between clients and law firms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
