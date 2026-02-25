/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ROOTWORK_CONSTITUTION } from "../constitution";

// MCP Intelligence Access Layer & Security Fabric
const MCP_GOVERNANCE = {
  'readiness-sentinel': {
    allowed: ['readiness-signals', 'session-metadata'],
    blocked: ['institutional-predictions', 'psychological-inference'],
    dataTier: 'tier-3'
  },
  'thinking-partner': {
    allowed: ['mission-context', 'artifact-summary', 'allowed-scaffolds'],
    blocked: ['sensitive-analytics', 'institutional-predictions'],
    dataTier: 'tier-1'
  },
  'mission-architect': {
    allowed: ['standards-mapping', 'mastery-evidence', 'project-templates'],
    blocked: ['individual-emotional-data'],
    dataTier: 'tier-0'
  },
  'educator-amplifier': {
    allowed: ['class-readiness-aggregates', 'engagement-trends'],
    blocked: ['individual-emotional-inference'],
    dataTier: 'tier-2'
  },
  'evidence-curator': {
    allowed: ['artifact-ledger', 'rigor-metrics', 'transfer-signals'],
    blocked: ['identity-linkage', 'psychological-inference'],
    dataTier: 'tier-1'
  },
  'compliance-scribe': {
    allowed: ['standards-corpus', 'ledger-entries', 'evidence-mapping'],
    blocked: ['ephemeral-session-signals'],
    dataTier: 'tier-2'
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export type AgentRole = 
  | 'readiness-sentinel' 
  | 'thinking-partner' 
  | 'mission-architect' 
  | 'evidence-curator' 
  | 'restoration-coach' 
  | 'educator-amplifier' 
  | 'compliance-scribe';

export async function getAgentGuidance(
  role: AgentRole,
  context: {
    stage?: string;
    projectDescription: string;
    userInput: string;
    traceStep?: string;
    fiveRStep?: string;
    regulationStatus?: string;
    cognitiveState?: string;
    readinessScore?: number;
    frictionDetected?: boolean;
    rigorLayer?: string;
    connectivity?: 'online' | 'offline' | 'edge';
  }
) {
  // MCP Governance Check
  const governance = MCP_GOVERNANCE[role as keyof typeof MCP_GOVERNANCE];
  const filtersApplied = governance ? governance.blocked : [];

  // Model Routing Policy
  // Local (Edge/Ollama) for: rephrasing, reflection, brainstorming, thinking partner
  // Cloud (Gemini Pro) for: high-accuracy, transfer detection, planning, compliance
  const useCloud = role === 'educator-amplifier' || role === 'compliance-scribe' || context.connectivity === 'online';
  const model = useCloud ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
  
  let roleInstruction = "";
  
  switch (role) {
    case 'readiness-sentinel':
      roleInstruction = `
        You are the Readiness Sentinel. Your primary duty is to monitor learning signals and protect the learner's cognitive load.
        - Detect cognitive overload or stall.
        - Suggest regulation rituals if readiness is low (Current Score: ${context.readinessScore}).
        - Simplify the interface or suggest a pause if abandonment patterns are detected.
        - NEVER halt learning autonomously; only suggest.
      `;
      break;
    case 'thinking-partner':
      roleInstruction = `
        You are the Thinking Partner. Your goal is to foster epistemic fluency and support reasoning.
        - MUST ask before answering.
        - Encourage explanation and reveal assumptions.
        - NEVER shortcut cognition or provide immediate answers.
        - Use inquiry-based language: "What do you notice?", "How does this connect to your community?"
        - Current Rigor Layer: ${context.rigorLayer}. Adjust your challenge level accordingly.
      `;
      break;
    case 'mission-architect':
      roleInstruction = `
        You are the Mission Architect. You design learning experiences that ensure academic rigor.
        - Follow the Rigor Layers: Concept Access -> Applied Practice -> Analytical Challenge -> System Design -> Public Expression -> Transfer Task.
        - Current Rigor Layer: ${context.rigorLayer}.
        - Ensure every cycle requires a LearningArtifact with reasoning and evidence.
        - If mastery velocity is high, escalate the cognitive depth by introducing ambiguity or removing scaffolds.
        - Focus on transfer: How can this concept be applied in a completely different domain?
      `;
      break;
    case 'restoration-coach':
      roleInstruction = `
        You are the Restoration Coach. You support revision and reflection cycles.
        - Feedback must remain inquiry-based.
        - Focus on the 5Rs: Reflect, Restore, Reconnect.
      `;
      break;
    case 'educator-amplifier':
      roleInstruction = `
        You are the Educator Amplifier. You support teachers by surfacing insights and recommending interventions.
        - May NOT override teacher judgment.
        - Focus on "Availability for Learning" and "Cognitive Growth" telemetry.
      `;
      break;
    case 'evidence-curator':
      roleInstruction = `
        You are the Evidence Curator. You help learners select and promote artifacts to the authoritative cloud ledger.
        - Identify "Learning Evidence" that demonstrates rigor and transfer.
        - Help students reflect on why an artifact is significant.
      `;
      break;
    case 'compliance-scribe':
      roleInstruction = `
        You are the Compliance Scribe. You map learning evidence to external standards (AP, IB, State Standards).
        - Generate exportable evidence for portfolios and reports.
        - Ensure all claims of mastery are backed by artifacts.
      `;
      break;
    default:
      roleInstruction = "You are a specialized agent within the Rootwork LOS.";
  }

  const systemInstruction = `
    ${ROOTWORK_CONSTITUTION}
    
    YOUR SPECIFIC ROLE:
    ${roleInstruction}
    
    CURRENT CONTEXT (MCP AUTHORIZED):
    - Project: ${context.projectDescription}
    - TRACE Step: ${context.traceStep}
    - Cognitive State: ${context.cognitiveState}
    - Readiness Score: ${context.readinessScore}
    - Friction Detected: ${context.frictionDetected ? 'YES' : 'NO'}
    - User Input/Work: ${context.userInput}
    
    MCP GOVERNANCE LOG:
    - Filters Applied: ${filtersApplied.join(', ') || 'None'}
    - Access Scope: Authorized for ${governance?.allowed.join(', ') || 'General'}
  `;

  const prompt = `
    Based on the Constitution and your specific role, provide guidance or a response to the following input:
    "${context.userInput}"
    
    Remember: Silence is preferred over unnecessary assistance. If the learner is in a "Productive Struggle" zone, observe rather than intervene.
    Format in Markdown. Keep it concise, calm, and respectful.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction
      }
    });
    return response.text;
  } catch (error) {
    console.error(`Error getting ${role} guidance:`, error);
    return "I'm having trouble connecting to the Rootwork wisdom right now. Please try again in a moment.";
  }
}
