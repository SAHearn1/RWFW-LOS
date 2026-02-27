import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import ServiceWorkerRegistrar from "@/components/offline/ServiceWorkerRegistrar";
import { getConfiguredPublishableKey, sanitizePublicUrl } from "@/lib/config/envGuards";

import "./globals.css";

export const metadata: Metadata = {
  title: "RootWork LOS",
  description: "RootWork Learning Operating System front door shell"
};

const offlineEnabled = process.env.NEXT_PUBLIC_ENABLE_OFFLINE === "true";

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
        <body>
          {offlineEnabled && <ServiceWorkerRegistrar />}
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} signInUrl={signInUrl ?? undefined} signUpUrl={signUpUrl ?? undefined}>
      <html lang="en">
        <body>
          {offlineEnabled && <ServiceWorkerRegistrar />}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
