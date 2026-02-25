import type { StandardDescriptor, StandardsRule, VerificationRuleResult } from "./types";

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

export function runStandardsPlugins(plugins: StandardsPlugin[], context: StandardsPluginContext): VerificationRuleResult[] {
  const merged = new Map<string, VerificationRuleResult>();

  for (const plugin of plugins) {
    for (const result of plugin.execute(context)) {
      merged.set(`${plugin.id}:${result.standardId}`, result);
    }
  }

  return [...merged.values()];
}
