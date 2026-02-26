import type { StandardDescriptor, StandardsRule, VerificationRuleResult } from "./types";
import { DEFAULT_STANDARDS, keywordStandardsRule } from "@/lib/standards/verifier/localVerifier";

export type StandardsPluginContext = {
  artifactText: string;
  standards: StandardDescriptor[];
};

export interface StandardsPlugin {
  id: string;
  description: string;
  version: string;
  execute(context: StandardsPluginContext): VerificationRuleResult[];
}

export function createRulePlugin(id: string, description: string, version: string, rule: StandardsRule): StandardsPlugin {
  return {
    id,
    description,
    version,
    execute(context) {
      return rule({ artifactText: context.artifactText, standards: context.standards });
    }
  };
}

export const DEFAULT_PLUGIN_REGISTRY: readonly StandardsPlugin[] = [
  createRulePlugin(
    "keyword-standards-plugin",
    "Keyword-based standards rule",
    "1.0.0",
    keywordStandardsRule
  ),
];

export function runStandardsPlugins(
  input: { artifactText: string; standards?: StandardDescriptor[] },
  plugins: readonly StandardsPlugin[] = DEFAULT_PLUGIN_REGISTRY
): VerificationRuleResult[] {
  const context: StandardsPluginContext = {
    artifactText: input.artifactText,
    standards: input.standards ?? [...DEFAULT_STANDARDS],
  };

  const merged = new Map<string, VerificationRuleResult>();

  for (const plugin of plugins) {
    for (const result of plugin.execute(context)) {
      merged.set(`${plugin.id}:${result.standardId}`, result);
    }
  }

  return [...merged.values()];
}
