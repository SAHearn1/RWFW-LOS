"use client";

// AES-GCM encryption for localStorage values using the Web Crypto API.
// When NEXT_PUBLIC_LOCAL_STORAGE_ENCRYPTION_KEY is not set, data is stored plain-text
// (backward compatible — a console.warn is emitted in development).

const KEY_ENV = process.env.NEXT_PUBLIC_LOCAL_STORAGE_ENCRYPTION_KEY;

let cryptoKeyCache: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey | null> {
  if (!KEY_ENV || KEY_ENV.trim().length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RootWork] NEXT_PUBLIC_LOCAL_STORAGE_ENCRYPTION_KEY is not set — localStorage stored in plain text.");
    }
    return null;
  }

  if (cryptoKeyCache) return cryptoKeyCache;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(KEY_ENV.slice(0, 32).padEnd(32, "0")),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  cryptoKeyCache = keyMaterial;
  return keyMaterial;
}

export async function encryptForStorage(plaintext: string): Promise<string> {
  const key = await getCryptoKey();
  if (!key) return plaintext; // plain-text fallback

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Pack iv + ciphertext as base64
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptFromStorage(stored: string): Promise<string> {
  const key = await getCryptoKey();
  if (!key) return stored; // plain-text fallback — return as-is

  try {
    const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    // Decryption failed — likely plain-text from before encryption was enabled.
    // Return as-is and it will be re-encrypted on next write.
    return stored;
  }
}
