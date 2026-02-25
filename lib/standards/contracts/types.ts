export type StandardId = string;

export type StandardDescriptor = {
  id: StandardId;
  title: string;
  requiredKeywords: string[];
};

export type VerificationRuleInput = {
  artifactText: string;
  standards: StandardDescriptor[];
};

export type VerificationRuleResult = {
  standardId: StandardId;
  verdict: "pass" | "partial" | "missing";
  matchedKeywords: string[];
};

export type StandardsRule = (input: VerificationRuleInput) => VerificationRuleResult[];
