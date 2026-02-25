import type { StandardDescriptor } from "@/lib/standards/contracts/types";
import { DEFAULT_STANDARDS } from "@/lib/standards/verifier/localVerifier";

const STANDARDS_STORAGE_KEY = "rootwork.standards.config";

export function readConfiguredStandards(): StandardDescriptor[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [...DEFAULT_STANDARDS];
  }

  const raw = window.localStorage.getItem(STANDARDS_STORAGE_KEY);
  if (!raw) {
    return [...DEFAULT_STANDARDS];
  }

  try {
    const parsed = JSON.parse(raw) as StandardDescriptor[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_STANDARDS];
    }

    return parsed.filter((item) => typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.requiredKeywords));
  } catch {
    return [...DEFAULT_STANDARDS];
  }
}

export function writeConfiguredStandards(standards: StandardDescriptor[]): StandardDescriptor[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return standards;
  }

  window.localStorage.setItem(STANDARDS_STORAGE_KEY, JSON.stringify(standards));
  return standards;
}
