export function sanitizePublishableKey(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  const cleaned = raw.trim();
  if (!cleaned.startsWith("pk_") || cleaned.length < 20 || cleaned.includes("\n") || cleaned.includes(" ")) {
    return null;
  }

  return cleaned;
}

export function sanitizePublicUrl(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  const cleaned = raw.trim();
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    return null;
  }

  if (cleaned.includes(" ") || cleaned.includes("\n")) {
    return null;
  }

  return cleaned;
}
