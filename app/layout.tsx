import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "WholesaleOS — Virtual Wholesaling Platform",
  description:
    "All-in-one virtual real estate wholesaling platform: acquisitions & dispositions CRM, deal analyzer, marketing, contracts, and analytics.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        {session ? (
          <div className="flex min-h-screen">
            <Sidebar role={session.role} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar name={session.name} role={session.role} />
              <main className="flex-1 px-6 py-6">{children}</main>
            </div>
          </div>
        ) : (
          // Unauthenticated (login) — no app chrome.
          children
        )}
      </body>
    </html>
  );
}
