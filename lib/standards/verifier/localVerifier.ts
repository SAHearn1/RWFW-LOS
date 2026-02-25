import type { StandardDescriptor, StandardsRule, VerificationRuleInput, VerificationRuleResult } from "@/lib/standards/contracts/types";

export const DEFAULT_STANDARDS: readonly StandardDescriptor[] = [
  {
    id: "rw.mission.clarity",
    title: "Mission Clarity",
    requiredKeywords: ["goal", "outcome", "evidence"]
  },
  {
    id: "rw.artifact.reflection",
    title: "Artifact Reflection",
    requiredKeywords: ["reflect", "improve", "next"]
  }
] as const;

export const keywordStandardsRule: StandardsRule = (input: VerificationRuleInput): VerificationRuleResult[] => {
  const normalized = input.artifactText.toLowerCase();

  return input.standards.map((standard) => {
    const matchedKeywords = standard.requiredKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
    const verdict: VerificationRuleResult["verdict"] =
      matchedKeywords.length === 0 ? "missing" : matchedKeywords.length === standard.requiredKeywords.length ? "pass" : "partial";

    return {
      standardId: standard.id,
      verdict,
      matchedKeywords
    };
  });
};

export function verifyArtifactText(artifactText: string, standards: readonly StandardDescriptor[] = DEFAULT_STANDARDS): VerificationRuleResult[] {
  return keywordStandardsRule({
    artifactText,
    standards: [...standards]
  });
}
