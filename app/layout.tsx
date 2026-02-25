import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RootWork LOS",
  description: "RootWork Learning Operating System front door shell"
};

function getValidPublishableKey(): string | null {
  const raw = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!raw) {
    return null;
  }

  const cleaned = raw.trim();
  if (!cleaned.startsWith("pk_") || cleaned.length < 20 || cleaned.includes("\n") || cleaned.includes(" ")) {
    return null;
  }

  return cleaned;
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = getValidPublishableKey();

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
