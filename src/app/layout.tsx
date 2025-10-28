import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/app/globals.css";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Team Manager - Secure Team Collaboration",
  description: "Manage your teams with secure authentication and role-based access control",
  keywords: ["team management", "collaboration", "authentication", "secure"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
