import { createRulePlugin, runStandardsPlugins } from "@/lib/standards/contracts/plugins";
import type { VerificationRuleResult } from "@/lib/standards/contracts/types";
import { readConfiguredStandards } from "@/lib/standards/configStore";
import { DEFAULT_STANDARDS, keywordStandardsRule } from "@/lib/standards/verifier/localVerifier";

const keywordPlugin = createRulePlugin(
  "standards.keyword",
  "Keyword-based standards verification plugin.",
  "v1",
  keywordStandardsRule
);

export function runDefaultStandardsPlugins(artifactText: string): VerificationRuleResult[] {
  // Use admin-configured standards client-side; fall back to defaults for SSR/build safety
  const standards = typeof window !== "undefined" ? readConfiguredStandards() : [...DEFAULT_STANDARDS];
  return runStandardsPlugins([keywordPlugin], {
    artifactText,
    standards
  });
}
