/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StageId = 'soil' | 'roots' | 'trunk' | 'branches' | 'fruit';

// TRACE Cognition Model
export type TraceStep = 'trigger' | 'regulate' | 'attend' | 'construct' | 'express';

export interface TracePhaseConfig {
  label: string;
  behavior: string;
  stimulus: 'full' | 'reduced' | 'isolated' | 'expanded' | 'presentation';
  motion: 'still' | 'breathing' | 'expanding' | 'growing';
  focusSuppression: boolean;
}

export const TRACE_PHASES: Record<TraceStep, TracePhaseConfig> = {
  trigger: { 
    label: 'Trigger', 
    behavior: 'Orientation + context', 
    stimulus: 'full', 
    motion: 'still',
    focusSuppression: false 
  },
  regulate: { 
    label: 'Regulate', 
    behavior: 'Reduced stimulus + grounding', 
    stimulus: 'reduced', 
    motion: 'breathing',
    focusSuppression: true 
  },
  attend: { 
    label: 'Attend', 
    behavior: 'Focus isolation', 
    stimulus: 'isolated', 
    motion: 'expanding',
    focusSuppression: true 
  },
  construct: { 
    label: 'Construct', 
    behavior: 'Tool expansion', 
    stimulus: 'expanded', 
    motion: 'growing',
    focusSuppression: false 
  },
  express: { 
    label: 'Express', 
    behavior: 'Presentation environment', 
    stimulus: 'presentation', 
    motion: 'still',
    focusSuppression: false 
  }
};

export type RigorLayer = 
  | 'concept-access' 
  | 'applied-practice' 
  | 'analytical-challenge' 
  | 'system-design' 
  | 'public-expression' 
  | 'transfer-task';

export interface LearningArtifact {
  id: string;
  modality: 'voice' | 'sketch' | 'photo' | 'model' | 'text';
  reasoning: string;
  evidence: string; // URL or base64
  revisionHistory: string[];
  transferApplication: string; // How this applies to a new context
  conceptLinks: string[];
  timestamp: string;
  rigorLayer: RigorLayer;
}

export interface LearnerCapabilityProfile {
  complexityIndex: number; // 0-1
  independenceIndex: number; // 0-1
  persistenceIndex: number; // 0-1
  transferIndex: number; // 0-1
  masteryVelocity: number;
}

export type ConnectivityStatus = 'online' | 'offline' | 'edge';

export type ModelRoute = 'local' | 'cloud';

export interface SyncStatus {
  pendingArtifacts: number;
  lastSync: number;
  isSyncing: boolean;
}

export type MCPService = 'mission-context' | 'artifact-ledger' | 'standards-mapping' | 'readiness-signals' | 'class-analytics';

export interface MCPRequest {
  agentId: string;
  service: MCPService;
  scope: 'session' | 'institutional';
  timestamp: number;
}

export interface MCPResponse {
  authorized: boolean;
  data: any;
  filterApplied: string[];
}

export type DataTier = 'tier-0' | 'tier-1' | 'tier-2' | 'tier-3';

export interface Standard {
  id: string;
  code: string;
  description: string;
  domain: 'math' | 'science' | 'ela' | 'social-studies' | 'interdisciplinary';
}

export interface StandardsAlignment {
  standardId: string;
  confidence: number;
  evidenceId: string;
  status: 'introduced' | 'practiced' | 'demonstrated';
}

export interface LedgerEntry {
  id: string;
  learnerId: string;
  missionId: string;
  artifactId: string;
  standardsVerified: string[];
  competencies: string[];
  rigorLevel: number;
  verificationMethod: 'performance' | 'analytical' | 'applied' | 'transfer';
  verifiedBy: string;
  timestamp: number;
  revisionHistory: string[];
}

export interface Transcript {
  traditional: {
    course: string;
    grade: string;
    credits: number;
  }[];
  capability: {
    competency: string;
    rigorDistribution: Record<number, number>;
    evidenceLinks: string[];
  }[];
}

export interface SecurityAuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  tier: DataTier;
  timestamp: number;
  purpose: string;
}

// Human States for Runtime Detection
export type HumanState = 'focused' | 'distracted' | 'fatigued' | 'curious' | 'stalled' | 'overloaded' | 'drifting';

export interface LearnerState {
  attentionStability: number; // 0-1
  cognitiveLoad: number; // 0-1
  productiveStruggle: boolean;
  regulationStatus: 'stable' | 'fragile' | 'disrupted';
  engagementTrend: 'rising' | 'stable' | 'falling';
  lastUpdate: number;
}

export interface RuntimePolicy {
  condition: string;
  decision: TraceStep;
  activeAgents: string[];
  suppressedAgents: string[];
}

export interface GrowthNode {
  id: string;
  label: string;
  type: 'skill' | 'mission' | 'concept';
  connections: string[];
  progress: number;
}

export const GROWTH_PATH: GrowthNode[] = [
  { id: 'systems', label: 'Systems Thinking', type: 'concept', connections: ['env-design'], progress: 65 },
  { id: 'env-design', label: 'Environmental Design', type: 'skill', connections: ['math-reasoning', 'water-mission'], progress: 45 },
  { id: 'math-reasoning', label: 'Applied Mathematics', type: 'concept', connections: ['water-mission'], progress: 30 },
  { id: 'water-mission', label: 'Water Systems Mission', type: 'mission', connections: [], progress: 15 }
];

// 5Rs Learning Loop
export type FiveRStep = 'root' | 'regulate' | 'reflect' | 'restore' | 'reconnect';

// Cognitive States for Arrival
export type CognitiveState = 'focused' | 'tired' | 'distracted' | 'stressed' | 'ready';

// Session Phases (Cognitive Time Architecture)
export type SessionPhase = 'arrival' | 'orientation' | 'deep-work' | 'collaboration' | 'expression' | 'closure';

export interface Stage {
  id: StageId;
  title: string;
  description: string;
  icon: string;
  color: string;
  questions: string[];
}

export const STAGES: Stage[] = [
  {
    id: 'soil',
    title: 'The Soil',
    description: 'Self & Identity: Understanding who we are and the biases we carry into the work.',
    icon: 'User',
    color: 'bg-amber-100 text-amber-900 border-amber-200',
    questions: [
      'What identities do I hold?',
      'How does my background influence how I see this problem?',
      'What are my blind spots?'
    ]
  },
  {
    id: 'roots',
    title: 'The Roots',
    description: 'History & Context: Investigating the systemic origins and historical timeline of the issue.',
    icon: 'History',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    questions: [
      'What is the history of this issue in this specific community?',
      'What policies or systems created the current situation?',
      'Whose stories have been erased from the narrative?'
    ]
  },
  {
    id: 'trunk',
    title: 'The Trunk',
    description: 'Power & Dynamics: Analyzing who holds power and how it flows through the system.',
    icon: 'Zap',
    color: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    questions: [
      'Who makes the decisions here?',
      'Who benefits from the status quo?',
      'Where is the resistance happening?'
    ]
  },
  {
    id: 'branches',
    title: 'The Branches',
    description: 'Community & Relationships: Building deep connections and valuing lived experience.',
    icon: 'Users',
    color: 'bg-rose-100 text-rose-900 border-rose-200',
    questions: [
      'Who is most impacted by this issue?',
      'How can we co-create with the community?',
      'What wisdom already exists in the community?'
    ]
  },
  {
    id: 'fruit',
    title: 'The Fruit',
    description: 'Action & Design: Creating equitable solutions that address the root causes.',
    icon: 'Sprout',
    color: 'bg-lime-100 text-lime-900 border-lime-200',
    questions: [
      'How does this solution address the root cause, not just the symptom?',
      'How will we measure equity, not just efficiency?',
      'What are the potential unintended consequences?'
    ]
  }
];

export const TRACE_MODEL = {
  trigger: { label: 'Trigger', description: 'Initial stimulus or challenge' },
  regulate: { label: 'Regulate', description: 'Neurological readiness check' },
  attend: { label: 'Attend', description: 'Focused cognitive engagement' },
  construct: { label: 'Construct', description: 'Knowledge building' },
  express: { label: 'Express', description: 'Applied production' }
};

export const FIVE_RS = {
  root: { label: 'Root', description: 'Identity/context grounding' },
  regulate: { label: 'Regulate', description: 'Readiness activation' },
  reflect: { label: 'Reflect', description: 'Metacognition' },
  restore: { label: 'Restore', description: 'Correction/revision' },
  reconnect: { label: 'Reconnect', description: 'Application/community' }
};

export const COGNITIVE_STATES: Record<CognitiveState, { label: string, icon: string, color: string }> = {
  focused: { label: 'Focused', icon: 'Target', color: 'bg-emerald-100 text-emerald-700' },
  tired: { label: 'Tired', icon: 'Moon', color: 'bg-blue-100 text-blue-700' },
  distracted: { label: 'Distracted', icon: 'Wind', color: 'bg-amber-100 text-amber-700' },
  stressed: { label: 'Stressed', icon: 'Zap', color: 'bg-rose-100 text-rose-700' },
  ready: { label: 'Ready to Build', icon: 'Hammer', color: 'bg-indigo-100 text-indigo-700' }
};

export const SESSION_PHASES: Record<SessionPhase, { label: string, duration: number, description: string }> = {
  arrival: { label: 'Arrival', duration: 3, description: 'Stabilize nervous system' },
  orientation: { label: 'Orientation', duration: 7, description: 'Mission preview' },
  'deep-work': { label: 'Deep Work', duration: 25, description: 'Protected thinking time' },
  collaboration: { label: 'Collaboration', duration: 10, description: 'Social cognition' },
  expression: { label: 'Expression', duration: 10, description: 'Knowledge production' },
  closure: { label: 'Closure', duration: 5, description: 'Progress integration' }
};
