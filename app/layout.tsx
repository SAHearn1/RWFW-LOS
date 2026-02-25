import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import { getConfiguredPublishableKey, sanitizePublicUrl } from "@/lib/config/envGuards";

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
  const publishableKey = getConfiguredPublishableKey();
  const signInUrl = sanitizePublicUrl(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL);
  const signUpUrl = sanitizePublicUrl(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL);

  if (!publishableKey) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} signInUrl={signInUrl ?? undefined} signUpUrl={signUpUrl ?? undefined}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
