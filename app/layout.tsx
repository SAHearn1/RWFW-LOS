import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RootWork LOS",
  description: "RootWork Learning Operating System front door shell"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
