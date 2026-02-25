import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import { getConfiguredPublishableKey, sanitizePublicUrl } from "@/lib/config/envGuards";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RootWork LOS",
    template: "%s — RootWork",
  },
  description:
    "RootWork aligns learner agency, teacher guidance, and administrator visibility in one respectful workflow — grounded in the five R's: Roots, Reflect, Relate, Rise, Radiate.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "RootWork LOS",
    description: "Learning operations built for calm, focused progress.",
    siteName: "RootWork",
    locale: "en_US",
    type: "website",
  },
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
