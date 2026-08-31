import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Revenue Recovery Autopilot",
  description: "Bounded, auditable revenue recovery operations",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-ink">
          <Sidebar />
          <main className="min-h-screen pl-64">{children}</main>
        </div>
      </body>
    </html>
  );
}
