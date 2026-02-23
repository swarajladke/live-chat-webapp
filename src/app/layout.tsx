import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/providers/convex-client-provider";
import { UserSyncProvider } from "@/components/providers/user-sync-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Live Chat",
  description: "Real-time 1:1 chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ConvexClientProvider>
          <UserSyncProvider>
            {children}
          </UserSyncProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
