import { createRulePlugin, runStandardsPlugins } from "@/lib/standards/contracts/plugins";
import type { VerificationRuleResult } from "@/lib/standards/contracts/types";
import { DEFAULT_STANDARDS, keywordStandardsRule } from "@/lib/standards/verifier/localVerifier";

const keywordPlugin = createRulePlugin(
  "standards.keyword",
  "Keyword-based standards verification plugin.",
  "v1",
  keywordStandardsRule
);

export function runDefaultStandardsPlugins(artifactText: string): VerificationRuleResult[] {
  return runStandardsPlugins([keywordPlugin], {
    artifactText,
    standards: [...DEFAULT_STANDARDS]
  });
}
