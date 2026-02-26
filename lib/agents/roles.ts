// 7 agent roles migrated from src/services/geminiService.ts.
// MCP governance: allowed/blocked data services per role + data tier.

export type AgentRole =
  | "readiness-sentinel"
  | "thinking-partner"
  | "mission-architect"
  | "evidence-curator"
  | "restoration-coach"
  | "educator-amplifier"
  | "compliance-scribe";

export type MCPService =
  | "mission-context"
  | "artifact-ledger"
  | "standards-mapping"
  | "readiness-signals"
  | "class-analytics"
  | "session-metadata"
  | "artifact-summary"
  | "allowed-scaffolds"
  | "mastery-evidence"
  | "project-templates"
  | "class-readiness-aggregates"
  | "engagement-trends"
  | "rigor-metrics"
  | "transfer-signals"
  | "standards-corpus"
  | "ledger-entries"
  | "evidence-mapping";

export type DataTierLevel = "tier-0" | "tier-1" | "tier-2" | "tier-3";

export type MCPGovernance = {
  allowed: MCPService[];
  blocked: string[];
  dataTier: DataTierLevel;
};

export const MCP_GOVERNANCE: Record<AgentRole, MCPGovernance> = {
  "readiness-sentinel": {
    allowed: ["readiness-signals", "session-metadata"],
    blocked: ["institutional-predictions", "psychological-inference"],
    dataTier: "tier-3",
  },
  "thinking-partner": {
    allowed: ["mission-context", "artifact-summary", "allowed-scaffolds"],
    blocked: ["sensitive-analytics", "institutional-predictions"],
    dataTier: "tier-1",
  },
  "mission-architect": {
    allowed: ["standards-mapping", "mastery-evidence", "project-templates"],
    blocked: ["individual-emotional-data"],
    dataTier: "tier-0",
  },
  "evidence-curator": {
    allowed: ["artifact-ledger", "rigor-metrics", "transfer-signals"],
    blocked: ["identity-linkage", "psychological-inference"],
    dataTier: "tier-1",
  },
  "restoration-coach": {
    allowed: ["mission-context", "artifact-summary"],
    blocked: ["sensitive-analytics", "institutional-predictions"],
    dataTier: "tier-1",
  },
  "educator-amplifier": {
    allowed: ["class-readiness-aggregates", "engagement-trends"],
    blocked: ["individual-emotional-inference"],
    dataTier: "tier-2",
  },
  "compliance-scribe": {
    allowed: ["standards-corpus", "ledger-entries", "evidence-mapping"],
    blocked: ["ephemeral-session-signals"],
    dataTier: "tier-2",
  },
} as const;
