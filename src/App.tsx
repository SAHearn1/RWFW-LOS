/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  History, 
  Zap, 
  Users, 
  Sprout, 
  ChevronRight, 
  MessageSquare, 
  BookOpen, 
  Save,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Brain,
  Activity,
  Layout,
  ShieldCheck,
  Cpu,
  Coins,
  Map,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  Target,
  Moon,
  Wind,
  Hammer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Eye,
  PenTool,
  Share2,
  Lightbulb,
  ArrowUpRight,
  RefreshCw,
  Wifi
} from 'lucide-react';
import Markdown from 'react-markdown';
import { 
  STAGES, 
  StageId, 
  TRACE_MODEL, 
  FIVE_RS, 
  TraceStep, 
  FiveRStep, 
  COGNITIVE_STATES, 
  CognitiveState, 
  SESSION_PHASES, 
  SessionPhase,
  GROWTH_PATH,
  TRACE_PHASES,
  HumanState,
  LearnerState,
  RigorLayer,
  LearnerCapabilityProfile,
  ConnectivityStatus,
  SyncStatus,
  CognitiveBusStatus
} from './constants';
import { getAgentGuidance, AgentRole } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Mic, 
  Camera, 
  Upload, 
  Monitor, 
  Maximize2, 
  Minimize2, 
  Clock,
  ChevronDown,
  MoreHorizontal,
  Network,
  Activity as ActivityIcon,
  Zap as ZapIcon
} from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GrowthPathMap = () => {
  return (
    <div className="p-8 bg-white rounded-[40px] border border-black/5 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif font-bold">Growth Path Map</h3>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40">
          <Network className="w-3 h-3" />
          <span>Interconnected Knowledge</span>
        </div>
      </div>
      
      <div className="relative h-64 flex items-center justify-center">
        {GROWTH_PATH.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="absolute"
            style={{ 
              left: `${20 + (i * 20)}%`,
              top: `${40 + (Math.sin(i) * 20)}%`
            }}
          >
            <div className="relative group">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110",
                node.type === 'mission' ? "bg-root-olive text-white" : "bg-root-bg text-root-olive border border-black/5"
              )}>
                {node.type === 'mission' ? <ZapIcon className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 text-center whitespace-nowrap">
                <p className="text-[10px] font-bold uppercase tracking-tighter opacity-40">{node.type}</p>
                <p className="text-xs font-bold">{node.label}</p>
                <div className="mt-1 h-1 w-12 bg-black/5 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-root-olive" style={{ width: `${node.progress}%` }} />
                </div>
              </div>
              {/* Connections (Simplified) */}
              {i < GROWTH_PATH.length - 1 && (
                <div className="absolute left-full top-1/2 w-12 h-[1px] bg-black/5 -translate-y-1/2" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ReadinessIndicator = ({ status, score }: { status: string, score: number }) => {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-black/5 shadow-sm">
      <div className="relative w-8 h-8">
        <svg className="w-full h-full -rotate-90">
          <circle cx="50%" cy="50%" r="40%" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="3" />
          <motion.circle 
            cx="50%" cy="50%" r="40%" fill="none" 
            stroke="var(--color-root-olive)" strokeWidth="3"
            strokeDasharray="100 100"
            animate={{ strokeDashoffset: 100 - score }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            score > 80 ? "bg-emerald-500" : score > 50 ? "bg-blue-400" : "bg-amber-400"
          )} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Environment Status</p>
        <p className="text-xs font-bold">{status}</p>
      </div>
    </div>
  );
};

const LivingBackground = ({ stage, progress, humanState, motionType }: { stage: StageId, progress: number, humanState: HumanState, motionType: 'still' | 'breathing' | 'expanding' | 'growing' }) => {
  const stageIndex = STAGES.findIndex(s => s.id === stage);
  const growthScale = (stageIndex + 1) / STAGES.length;
  
  // Slow down motion if distracted or fatigued
  const motionMultiplier = humanState === 'distracted' || humanState === 'fatigued' ? 0.5 : 1;

  const getMotionProps = () => {
    switch (motionType) {
      case 'breathing':
        return {
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.6, 0.3],
          transition: { duration: 8 / motionMultiplier, repeat: Infinity, ease: "easeInOut" as const }
        };
      case 'expanding':
        return {
          scale: [1, 1.2],
          opacity: 0.4,
          transition: { duration: 10 / motionMultiplier, ease: "easeOut" as const }
        };
      case 'growing':
        return {
          scale: 1,
          opacity: 0.5,
          transition: { duration: 2 }
        };
      default:
        return {
          scale: 1,
          opacity: 0.3,
          transition: { duration: 2 }
        };
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden studio-grid">
      {/* Biophilic Gradient */}
      <motion.div 
        animate={getMotionProps()}
        className="absolute inset-0 biophilic-gradient"
      />
      
      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0 
          }}
          animate={{ 
            y: [null, "-20%"],
            opacity: [0, 0.4, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: (10 + Math.random() * 20) / motionMultiplier, 
            repeat: Infinity, 
            delay: Math.random() * 10 
          }}
          className="absolute w-1 h-1 bg-root-olive rounded-full blur-[1px]"
        />
      ))}

      {/* Growing Plant (SVG) */}
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-10">
        <motion.svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 0.5 + (growthScale * 0.5), y: 50 - (growthScale * 20) }}
          transition={{ duration: 4, ease: "easeOut" }}
        >
          <motion.path
            d="M50,100 Q50,50 50,20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-root-olive"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: growthScale }}
          />
          <motion.circle cx="50" cy="20" r="1.5" fill="currentColor" className="text-root-olive" />
          {/* Leaves */}
          {[...Array(7)].map((_, i) => (
            <motion.path
              key={i}
              d={`M50,${90 - i * 12} Q${i % 2 === 0 ? 35 : 65},${80 - i * 12} 50,${70 - i * 12}`}
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
              className="text-root-olive"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: growthScale > (i / 7) ? 1 : 0 }}
            />
          ))}
        </motion.svg>
      </div>

      {/* Stage Specific Ambient Elements */}
      <AnimatePresence>
        {stage === 'soil' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-root-olive/5 to-transparent"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SessionTimeline = ({ currentPhase }: { currentPhase: SessionPhase }) => {
  const phases = Object.entries(SESSION_PHASES);
  const currentIndex = phases.findIndex(([key]) => key === currentPhase);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="glass rounded-full p-2 flex items-center justify-between shadow-2xl">
        {phases.map(([key, phase], index) => (
          <div key={key} className="flex items-center flex-1 last:flex-none">
            <div className="relative group">
              <motion.div 
                animate={{ 
                  scale: index === currentIndex ? 1.2 : 1,
                  backgroundColor: index <= currentIndex ? 'var(--color-root-olive)' : 'rgba(0,0,0,0.1)'
                }}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors duration-500",
                  index === currentIndex && "ring-4 ring-root-olive/20"
                )}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-root-ink text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                  {phase.label} ({phase.duration}m)
                </div>
              </div>
            </div>
            {index < phases.length - 1 && (
              <div className="flex-1 h-[1px] mx-2 bg-black/5 relative overflow-hidden">
                {index < currentIndex && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    className="absolute inset-0 bg-root-olive/30"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

type ViewMode = 'learner' | 'educator' | 'admin';

const FocusWindow = ({ phase }: { phase: SessionPhase }) => {
  const [timeLeft, setTimeLeft] = useState(28); // Soft estimation
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-black/5 shadow-sm">
      <Clock className="w-4 h-4 text-root-olive" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Focus Window Active</p>
        <p className="text-xs font-bold">≈ {timeLeft} minutes remaining</p>
      </div>
    </div>
  );
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('learner');
  const [activeStageId, setActiveStageId] = useState<StageId>('soil');
  const [projectDescription, setProjectDescription] = useState('Community Garden Design');
  const [regulationStatus, setRegulationStatus] = useState<'regulated' | 'dysregulated' | 'neutral'>('neutral');
  const [cognitiveState, setCognitiveState] = useState<CognitiveState | null>(null);
  const [humanState, setHumanState] = useState<HumanState>('focused');
  const [readinessScore, setReadinessScore] = useState(72);
  const [traceStep, setTraceStep] = useState<TraceStep>('trigger');
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('arrival');
  const [fiveRStep, setFiveRStep] = useState<FiveRStep>('root');
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [ritualProgress, setRitualProgress] = useState(0);
  const [isThinkingPartnerOpen, setIsThinkingPartnerOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<'notebook' | 'canvas' | 'data'>('notebook');
  const [frictionDetected, setFrictionDetected] = useState(false);
  const [cognitiveBus, setCognitiveBus] = useState<CognitiveBusStatus>({
    activeRequests: 0,
    governanceActive: true,
    lastAccess: 'Just now'
  });
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>('online');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingArtifacts: 0,
    lastSync: Date.now(),
    isSyncing: false
  });
  const [rigorLayer, setRigorLayer] = useState<RigorLayer>('concept-access');
  const [capabilityProfile, setCapabilityProfile] = useState<LearnerCapabilityProfile>({
    complexityIndex: 0.4,
    independenceIndex: 0.3,
    persistenceIndex: 0.6,
    transferIndex: 0.2,
    masteryVelocity: 0.5
  });
  const [learnerState, setLearnerState] = useState<LearnerState>({
    attentionStability: 0.72,
    cognitiveLoad: 0.4,
    productiveStruggle: true,
    regulationStatus: 'stable',
    engagementTrend: 'stable',
    lastUpdate: Date.now()
  });
  
  const [reflections, setReflections] = useState<Record<StageId, string>>({
    soil: '', roots: '', trunk: '', branches: '', fruit: ''
  });
  const [guidance, setGuidance] = useState<Record<string, string | null>>({});
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeStage = STAGES.find(s => s.id === activeStageId)!;
  const currentTracePhase = TRACE_PHASES[traceStep];

  // Operability: Offline Persistence & Sync
  useEffect(() => {
    const savedState = localStorage.getItem('rootwork_session_cache');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setReflections(parsed.reflections);
        setTraceStep(parsed.traceStep);
        setRigorLayer(parsed.rigorLayer);
      } catch (e) {
        console.error("Failed to load session cache", e);
      }
    }
  }, []);

  useEffect(() => {
    const sessionData = {
      reflections,
      traceStep,
      rigorLayer,
      lastUpdate: Date.now()
    };
    localStorage.setItem('rootwork_session_cache', JSON.stringify(sessionData));
  }, [reflections, traceStep, rigorLayer]);

  // Simulated Sync Loop
  useEffect(() => {
    if (connectivityStatus !== 'offline' && syncStatus.pendingArtifacts > 0 && !syncStatus.isSyncing) {
      const syncTimer = setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, isSyncing: true }));
        setTimeout(() => {
          setSyncStatus(prev => ({
            ...prev,
            pendingArtifacts: 0,
            lastSync: Date.now(),
            isSyncing: false
          }));
        }, 2000);
      }, 5000);
      return () => clearTimeout(syncTimer);
    }
  }, [connectivityStatus, syncStatus.pendingArtifacts, syncStatus.isSyncing]);

  // Cognitive Runtime Loop (The Brainstem)
  useEffect(() => {
    const microLoop = setInterval(() => {
      // Step 1: Signal Ingestion (Simulated)
      const inputLength = reflections[activeStageId].length;
      const timeSinceLastInput = Date.now() - learnerState.lastUpdate;
      
      // Step 2: Learner State Estimation
      setLearnerState(prev => {
        let newLoad = prev.cognitiveLoad;
        let newStability = prev.attentionStability;
        let newStruggle = prev.productiveStruggle;
        let newReg = prev.regulationStatus;
        
        // Logic for state estimation
        if (traceStep === 'construct' && inputLength < 10 && timeSinceLastInput > 10000) {
          newLoad += 0.1;
          newStability -= 0.05;
          newStruggle = false; // Stalled, not productive
        } else if (traceStep === 'attend') {
          newStability = Math.min(newStability + 0.02, 1);
          newLoad = Math.max(newLoad - 0.01, 0.2);
        }

        if (newLoad > 0.8) newReg = 'fragile';
        if (newLoad > 0.95) newReg = 'disrupted';
        if (newLoad < 0.6) newReg = 'stable';

        return {
          ...prev,
          cognitiveLoad: Math.min(Math.max(newLoad, 0), 1),
          attentionStability: Math.min(Math.max(newStability, 0), 1),
          productiveStruggle: newStruggle,
          regulationStatus: newReg,
          lastUpdate: Date.now()
        };
      });

      // Step 3: Policy Engine (TRACE + 5Rs)
      if (learnerState.regulationStatus === 'disrupted' && traceStep !== 'regulate') {
        setTraceStep('regulate');
        setHumanState('overloaded');
      } else if (learnerState.attentionStability < 0.4 && traceStep === 'attend') {
        setHumanState('drifting');
      } else if (!learnerState.productiveStruggle && traceStep === 'construct') {
        setHumanState('stalled');
        setFrictionDetected(true);
      } else {
        setFrictionDetected(false);
        if (learnerState.attentionStability > 0.8) setHumanState('focused');
      }

      // RAM: Cognitive Depth Engine
      if (capabilityProfile.masteryVelocity > 0.8 && rigorLayer !== 'transfer-task') {
        // Escalate cognitive depth
        const layers: RigorLayer[] = ['concept-access', 'applied-practice', 'analytical-challenge', 'system-design', 'public-expression', 'transfer-task'];
        const currentIndex = layers.indexOf(rigorLayer);
        if (currentIndex < layers.length - 1) {
          setRigorLayer(layers[currentIndex + 1]);
          setCapabilityProfile(prev => ({ ...prev, masteryVelocity: 0.4 })); // Reset velocity for new challenge
        }
      }

      // Step 4: Agent Orchestration & Step 5: UX Adaptation
      // (Handled by reactive rendering based on traceStep and humanState)

    }, 5000); // 5 second Micro Loop

    return () => clearInterval(microLoop);
  }, [traceStep, reflections, activeStageId, learnerState]);

  // Ritual Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRitualActive && ritualProgress < 100) {
      interval = setInterval(() => {
        setRitualProgress(prev => Math.min(prev + 1, 100));
      }, 1000);
    } else if (ritualProgress === 100) {
      setIsRitualActive(false);
      setRegulationStatus('regulated');
      setTraceStep('attend');
    }
    return () => clearInterval(interval);
  }, [isRitualActive, ritualProgress]);

  const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReflections(prev => ({ ...prev, [activeStageId]: e.target.value }));
  };

  const fetchGuidance = async (role: AgentRole = 'readiness-sentinel', explicitRequest: boolean = false) => {
    // Intervention Threshold Rule: Silence is preferred over unnecessary assistance.
    // Only intervene if stall detected, confusion observed, or explicit request.
    if (!explicitRequest && !frictionDetected && readinessScore > 50) {
      return;
    }

    setIsLoadingGuidance(true);
    setCognitiveBus(prev => ({ ...prev, activeRequests: prev.activeRequests + 1 }));
    
    const result = await getAgentGuidance(role, {
      stage: activeStage.title,
      projectDescription,
      userInput: reflections[activeStageId],
      traceStep,
      fiveRStep,
      regulationStatus,
      cognitiveState: cognitiveState || undefined,
      readinessScore,
      frictionDetected,
      rigorLayer,
      connectivity: connectivityStatus
    });
    setGuidance(prev => ({ ...prev, [`${role}-${activeStageId}`]: result }));
    setIsLoadingGuidance(false);
    setCognitiveBus(prev => ({ ...prev, activeRequests: Math.max(0, prev.activeRequests - 1), lastAccess: new Date().toLocaleTimeString() }));
  };

  const IconMap: Record<string, React.ReactNode> = {
    User: <User className="w-5 h-5" />,
    History: <History className="w-5 h-5" />,
    Zap: <Zap className="w-5 h-5" />,
    Users: <Users className="w-5 h-5" />,
    Sprout: <Sprout className="w-5 h-5" />,
    Target: <Target className="w-5 h-5" />,
    Moon: <Moon className="w-5 h-5" />,
    Wind: <Wind className="w-5 h-5" />,
    Hammer: <Hammer className="w-5 h-5" />
  };

  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-root-bg selection:bg-root-gold/20 studio-grid relative transition-all duration-1000",
      currentTracePhase.stimulus === 'reduced' && "grayscale-[0.2] contrast-[0.9]",
      currentTracePhase.stimulus === 'isolated' && "bg-white",
      currentTracePhase.focusSuppression && "pointer-events-none select-none"
    )}>
      <LivingBackground 
        stage={activeStageId} 
        progress={ritualProgress} 
        humanState={humanState} 
        motionType={currentTracePhase.motion}
      />
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: (isSidebarOpen && currentTracePhase.stimulus !== 'isolated') ? 320 : 0, 
          opacity: (isSidebarOpen && currentTracePhase.stimulus !== 'isolated') ? 1 : 0 
        }}
        className={cn(
          "bg-white border-r border-black/5 flex flex-col overflow-hidden z-40 relative shadow-2xl transition-all duration-500",
          humanState === 'stalled' && "opacity-50 grayscale-[0.5]",
          (currentTracePhase.stimulus === 'isolated' || !isSidebarOpen) && "pointer-events-none"
        )}
      >
        <div className="p-6 border-b border-black/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-root-olive rounded-xl flex items-center justify-center text-white shadow-lg shadow-root-olive/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-root-olive leading-none">Rootwork</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mt-1">Learning OS</p>
            </div>
          </div>

          {/* Cognitive Status Indicator */}
          <div className="mb-4 p-4 bg-root-bg/50 rounded-2xl border border-black/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Attention Stability</span>
              <span className="text-[9px] font-bold text-root-olive">{Math.round(learnerState.attentionStability * 100)}%</span>
            </div>
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${learnerState.attentionStability * 100}%` }}
                className="h-full bg-root-olive"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Cognitive Load</span>
              <span className={cn(
                "text-[9px] font-bold",
                learnerState.cognitiveLoad > 0.8 ? "text-rose-500" : "text-emerald-600"
              )}>{Math.round(learnerState.cognitiveLoad * 100)}%</span>
            </div>
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${learnerState.cognitiveLoad * 100}%` }}
                className={cn(
                  "h-full transition-colors",
                  learnerState.cognitiveLoad > 0.8 ? "bg-rose-500" : "bg-emerald-500"
                )}
              />
            </div>
          </div>

          {/* Rigor Profile Indicator */}
          <div className="mb-6 p-4 bg-root-gold/5 rounded-2xl border border-root-gold/10 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-root-gold">Rigor Layer</span>
              <span className="text-[9px] font-bold text-root-gold uppercase">{rigorLayer.replace('-', ' ')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Complexity', val: capabilityProfile.complexityIndex },
                { label: 'Independence', val: capabilityProfile.independenceIndex },
                { label: 'Persistence', val: capabilityProfile.persistenceIndex },
                { label: 'Transfer', val: capabilityProfile.transferIndex }
              ].map(idx => (
                <div key={idx.label} className="space-y-1">
                  <div className="flex justify-between text-[7px] font-bold uppercase opacity-40">
                    <span>{idx.label}</span>
                    <span>{Math.round(idx.val * 100)}%</span>
                  </div>
                  <div className="h-0.5 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${idx.val * 100}%` }}
                      className="h-full bg-root-gold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cognitive Bus / MCP Status */}
          <div className="mb-6 p-4 bg-root-olive/5 rounded-2xl border border-root-olive/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className={cn("w-3 h-3 text-root-olive", cognitiveBus.activeRequests > 0 && "animate-pulse")} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-root-olive">Cognitive Bus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span className="text-[7px] font-bold uppercase text-emerald-600">MCP Governed</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[8px] font-bold opacity-40 uppercase tracking-widest">
              <span>Active Requests</span>
              <span>{cognitiveBus.activeRequests}</span>
            </div>
            <div className="h-0.5 bg-black/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: cognitiveBus.activeRequests > 0 ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
                className="h-full bg-root-olive"
              />
            </div>
            <p className="text-[7px] font-bold opacity-30 uppercase text-right">Last Access: {cognitiveBus.lastAccess}</p>
          </div>

          <div className="flex p-1 bg-root-bg rounded-lg mb-4">
            {(['learner', 'educator'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  viewMode === mode ? "bg-white text-root-olive shadow-sm" : "text-root-ink/40 hover:text-root-ink"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Operability Status */}
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectivityStatus === 'online' ? "bg-emerald-500" : 
                connectivityStatus === 'edge' ? "bg-blue-500" : "bg-rose-500"
              )} />
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">
                {connectivityStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className={cn("w-2.5 h-2.5 opacity-30", syncStatus.isSyncing && "animate-spin")} />
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">
                {syncStatus.pendingArtifacts > 0 ? `${syncStatus.pendingArtifacts} Pending` : 'Synced'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] uppercase tracking-widest font-bold text-root-ink/30 mb-4">
            {viewMode === 'learner' ? 'My Growth Path' : 'Intelligence Console'}
          </p>
          
          {viewMode === 'learner' ? (
            <div className="space-y-1">
              {STAGES.map((stage, index) => (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                    activeStageId === stage.id 
                      ? "bg-root-olive text-white shadow-lg shadow-root-olive/20" 
                      : "hover:bg-black/5 text-root-ink/60"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    activeStageId === stage.id ? "bg-white/20" : stage.color
                  )}>
                    {IconMap[stage.icon]}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Mission 0{index + 1}</p>
                    <p className="font-serif text-sm font-bold leading-tight">{stage.title}</p>
                  </div>
                </button>
              ))}
              
              <div className="pt-8 px-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-root-ink/30 mb-4">Skills Growing</p>
                <div className="space-y-3">
                  {[
                    { label: 'Systems Thinking', progress: 65 },
                    { icon: 'Algebraic Reasoning', progress: 42 }
                  ].map((skill, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>{skill.label || skill.icon}</span>
                        <span className="opacity-40">{skill.progress}%</span>
                      </div>
                      <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.progress}%` }}
                          className="h-full bg-root-olive" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { icon: <Activity />, label: 'Readiness Metrics' },
                { icon: <Users />, label: 'Collaboration Networks' },
                { icon: <Layout />, label: 'PBL Designer' },
                { icon: <ShieldCheck />, label: 'MTSS Alignment' }
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 text-root-ink/60 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-root-bg flex items-center justify-center">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-black/5 bg-root-bg/30">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              regulationStatus === 'regulated' ? "bg-emerald-500" : regulationStatus === 'dysregulated' ? "bg-amber-400" : "bg-blue-400"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-root-olive/10 flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/malik/32/32" alt="avatar" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">Malik Johnson</p>
              <p className="text-[10px] opacity-50">Level 4 Producer</p>
            </div>
            <Settings className="w-4 h-4 opacity-30 cursor-pointer hover:opacity-100" />
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-black/5 px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <Search className="w-4 h-4 opacity-30" />
            <input 
              type="text"
              placeholder="Define your mission or search the knowledge base..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-black/20"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <FocusWindow phase={sessionPhase} />
            <ReadinessIndicator 
              status={readinessScore > 80 ? 'Deep Work' : readinessScore > 50 ? 'Focused' : 'Settling'} 
              score={readinessScore} 
            />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-root-bg rounded-full">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold">1,240</span>
            </div>
            <Bell className="w-4 h-4 opacity-30 cursor-pointer" />
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8 lg:p-12 space-y-12">
            {viewMode === 'learner' ? (
              <AnimatePresence mode="wait">
                {/* Arrival Experience (T - Trigger) */}
                {traceStep === 'trigger' && !cognitiveState ? (
                  <motion.div
                    key="arrival"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-16 py-20 max-w-4xl mx-auto"
                  >
                    <div className="text-center space-y-6">
                      <motion.h2 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-6xl font-serif font-bold tracking-tight"
                      >
                        Good Afternoon, Malik.
                      </motion.h2>
                      <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl text-root-ink/40 font-serif italic"
                      >
                        Your learning field is active. How are you arriving?
                      </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {(Object.keys(COGNITIVE_STATES) as CognitiveState[]).map((state, i) => (
                        <motion.button
                          key={state}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.6 + (i * 0.1) }}
                          onClick={() => {
                            setCognitiveState(state);
                            setTraceStep('regulate');
                            if (state === 'stressed' || state === 'tired') {
                              setRegulationStatus('dysregulated');
                            } else {
                              setRegulationStatus('neutral');
                            }
                          }}
                          className={cn(
                            "p-10 rounded-[40px] glass flex flex-col items-center gap-6 transition-all hover:shadow-2xl hover:-translate-y-2 group relative overflow-hidden",
                            COGNITIVE_STATES[state].color
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm relative z-10">
                            {IconMap[COGNITIVE_STATES[state].icon]}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity relative z-10">{COGNITIVE_STATES[state].label}</span>
                        </motion.button>
                      ))}
                    </div>

                    <div className="pt-12 flex justify-center">
                      <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest opacity-30">
                        <span>Environment: Studio Alpha</span>
                        <div className="w-1 h-1 bg-root-ink rounded-full" />
                        <span>Cognitive Sync: Active</span>
                      </div>
                    </div>
                  </motion.div>
                ) : traceStep === 'regulate' ? (
                  /* Regulation Ritual (R - Regulate) */
                  <motion.div
                    key="regulate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-3xl mx-auto space-y-16 py-20 text-center"
                  >
                    <div className="space-y-6">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-2 glass text-root-olive rounded-full"
                      >
                        <Wind className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Readiness Activation</span>
                      </motion.div>
                      <h2 className="text-5xl font-serif font-bold">Let's Ground Your Focus</h2>
                      <p className="text-xl text-root-ink/40 font-serif italic max-w-xl mx-auto leading-relaxed">
                        A quick sensory reset to prepare your mind for the mission ahead.
                      </p>
                    </div>

                    <div className="relative aspect-square max-w-sm mx-auto flex items-center justify-center">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ 
                          duration: 6, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-root-olive rounded-full blur-[80px]" 
                      />
                      <div className="relative z-10 w-full h-full rounded-full border border-root-olive/10 flex items-center justify-center p-16 glass shadow-inner">
                        <div className="text-center space-y-6">
                          <p className="text-lg font-serif italic text-root-olive/60">Breathe in...</p>
                          <div className="text-6xl font-serif font-bold text-root-olive tracking-tighter">{Math.ceil((100 - ritualProgress) / 10)}s</div>
                        </div>
                      </div>
                      
                      <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.02]">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="48%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-root-olive/20"
                        />
                        <motion.circle
                          cx="50%"
                          cy="50%"
                          r="48%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-root-olive"
                          strokeDasharray="100 100"
                          strokeDashoffset={100 - ritualProgress}
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                      </svg>
                    </div>

                    <div className="flex justify-center gap-8">
                      <button 
                        onClick={() => setIsRitualActive(!isRitualActive)}
                        className="px-12 py-5 bg-root-olive text-white rounded-full font-bold flex items-center gap-4 shadow-2xl shadow-root-olive/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        {isRitualActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        <span className="uppercase tracking-widest text-xs">{isRitualActive ? "Pause Ritual" : "Start Grounding"}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setTraceStep('attend');
                          setRegulationStatus('regulated');
                        }}
                        className="px-12 py-5 glass text-root-ink/40 rounded-full font-bold hover:text-root-ink transition-all uppercase tracking-widest text-xs"
                      >
                        Skip to Mission
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Active Mission (A - Attend) */
                  <motion.div
                    key="mission"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                  >
                    {/* Mission Header */}
                    <div className="bg-white rounded-[40px] p-12 border border-black/5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Target className="w-64 h-64" />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                            <Target className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Active Mission</span>
                        </div>
                        <h2 className="text-5xl font-serif font-bold leading-tight max-w-2xl">
                          Design irrigation for raised beds in the community garden.
                        </h2>
                        <div className="flex flex-wrap gap-3">
                          {['Algebraic Reasoning', 'Environmental Science', 'Systems Thinking'].map(tag => (
                            <span key={tag} className="px-4 py-1.5 bg-root-bg rounded-full text-[10px] font-bold uppercase tracking-wider opacity-60">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Workspace (C - Construct) */}
                    <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
                      <div className="flex-1 space-y-8">
                        {/* 5Rs: ROOT */}
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-8 glass rounded-[40px] border border-root-olive/10 relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Sprout className="w-12 h-12" />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-root-olive mb-3">Root Inquiry</p>
                          <p className="text-xl font-serif italic leading-relaxed">"Why does this problem matter where you live?"</p>
                        </motion.div>

                        <div className="flex items-center justify-between px-4">
                          <div className="flex items-center gap-6">
                            <h3 className="text-3xl font-serif font-bold tracking-tight">Thinking Space</h3>
                            <div className="flex p-1.5 glass rounded-2xl shadow-sm">
                              {[
                                { id: 'notebook', icon: <PenTool className="w-4 h-4" />, label: 'Notes' },
                                { id: 'canvas', icon: <Layout className="w-4 h-4" />, label: 'Model' },
                                { id: 'data', icon: <Activity className="w-4 h-4" />, label: 'Data' }
                              ].map(tool => (
                                <button 
                                  key={tool.id} 
                                  onClick={() => setActiveTool(tool.id as any)}
                                  className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                                    activeTool === tool.id ? "bg-root-olive text-white shadow-lg" : "text-root-ink/30 hover:text-root-ink hover:bg-black/5"
                                  )}
                                >
                                  {tool.icon}
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{tool.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold opacity-30">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              <span>Studio Sync Active</span>
                            </div>
                          </div>
                        </div>

                        <div className="relative group h-full">
                          <div className="absolute -inset-4 bg-gradient-to-r from-root-olive/5 to-root-gold/5 rounded-[60px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                          
                          <div className="relative h-full bg-white rounded-[56px] border border-black/5 shadow-2xl shadow-black/5 overflow-hidden paper-texture">
                            {activeTool === 'notebook' && (
                              <textarea
                                value={reflections[activeStageId]}
                                onChange={handleReflectionChange}
                                placeholder="Construct your ideas here. What do you notice about the water flow? Show your reasoning..."
                                className="w-full h-[600px] p-16 bg-transparent border-none focus:ring-0 text-2xl leading-relaxed font-serif resize-none custom-scrollbar placeholder:text-root-ink/10"
                              />
                            )}

                            {activeTool === 'canvas' && (
                              <div className="w-full h-[600px] bg-root-bg/20 relative overflow-hidden studio-grid">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="text-center space-y-4 opacity-10">
                                    <Layout className="w-16 h-16 mx-auto" />
                                    <p className="text-lg font-serif italic">Infinite Thinking Canvas</p>
                                  </div>
                                </div>
                                {/* Simulated Canvas Elements */}
                                <motion.div 
                                  drag
                                  dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
                                  className="absolute top-1/3 left-1/3 w-48 h-48 glass rounded-3xl p-6 cursor-grab active:cursor-grabbing shadow-xl"
                                >
                                  <div className="w-full h-full border border-dashed border-root-olive/20 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <Sprout className="w-8 h-8 text-root-olive/40" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">System Node</span>
                                  </div>
                                </motion.div>
                              </div>
                            )}

                            {activeTool === 'data' && (
                              <div className="w-full h-[600px] p-16 space-y-12 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-3xl font-serif font-bold">System Variables</h4>
                                  <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-root-olive hover:tracking-[0.4em] transition-all">+ Add Variable</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {[
                                    { label: 'Flow Rate', value: '2.4 L/m', color: 'bg-blue-500' },
                                    { label: 'Soil Moisture', value: '42%', color: 'bg-emerald-500' },
                                    { label: 'Pressure', value: '18 PSI', color: 'bg-amber-500' },
                                    { label: 'Efficiency', value: '94%', color: 'bg-indigo-500' }
                                  ].map(v => (
                                    <div key={v.label} className="p-8 glass rounded-[40px] space-y-4 hover:shadow-xl transition-all">
                                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">{v.label}</p>
                                      <div className="flex items-end justify-between">
                                        <p className="text-4xl font-serif font-bold tracking-tighter">{v.value}</p>
                                        <div className={cn("w-2 h-2 rounded-full shadow-lg", v.color)} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Multimodal Toolbar */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 glass rounded-3xl shadow-2xl border border-white/40">
                              <button 
                                onClick={() => alert("Voice Reasoning Activated: Speak your thoughts...")}
                                className="p-4 text-root-ink/40 hover:text-root-olive hover:bg-root-olive/5 rounded-2xl transition-all group relative"
                              >
                                <Mic className="w-6 h-6" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <div className="bg-root-ink text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl">Voice Reasoning</div>
                                </div>
                              </button>
                              <div className="w-[1px] h-8 bg-black/5" />
                              <button 
                                onClick={() => alert("Camera Activated: Capture your physical prototype...")}
                                className="p-4 text-root-ink/40 hover:text-root-olive hover:bg-root-olive/5 rounded-2xl transition-all group relative"
                              >
                                <Camera className="w-6 h-6" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <div className="bg-root-ink text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl">Capture Physical</div>
                                </div>
                              </button>
                              <button 
                                onClick={() => alert("File Picker Opened: Select your artifact...")}
                                className="p-4 text-root-ink/40 hover:text-root-olive hover:bg-root-olive/5 rounded-2xl transition-all group relative"
                              >
                                <Upload className="w-6 h-6" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <div className="bg-root-ink text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl">Upload Artifact</div>
                                </div>
                              </button>
                              <div className="w-[1px] h-8 bg-black/5" />
                              <button 
                                onClick={() => {
                                  alert(`Rigor Cycle Verified: ${rigorLayer.replace('-', ' ')} completed. Generating Artifact...`);
                                  setCapabilityProfile(prev => ({
                                    ...prev,
                                    masteryVelocity: Math.min(prev.masteryVelocity + 0.2, 1),
                                    complexityIndex: Math.min(prev.complexityIndex + 0.05, 1)
                                  }));
                                  setSyncStatus(prev => ({ ...prev, pendingArtifacts: prev.pendingArtifacts + 1 }));
                                }}
                                className="px-6 py-4 bg-root-gold text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-root-gold/20 hover:scale-105 transition-all"
                              >
                                Complete Rigor Cycle
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Thinking Partner Sidebar (Floating/Integrated) */}
                      <AnimatePresence>
                        {isThinkingPartnerOpen && (
                          <motion.div 
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            className="w-full lg:w-[320px] shrink-0"
                          >
                            <div className="bg-root-olive text-white rounded-[48px] p-10 relative overflow-hidden shadow-[0_32px_64px_-12px_rgba(74,74,53,0.3)] h-full flex flex-col min-h-[600px]">
                              <div className="absolute top-0 right-0 p-10 opacity-5">
                                <Brain className="w-32 h-32" />
                              </div>
                              
                              <div className="relative z-10 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-10">
                                  <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white/10 rounded-2xl">
                                      <Brain className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-serif font-bold tracking-tight">Thinking Partner</h3>
                                  </div>
                                  <button 
                                    onClick={() => setIsThinkingPartnerOpen(false)}
                                    className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                                  {frictionDetected && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="p-6 bg-white/10 rounded-[32px] border border-white/20 shadow-inner"
                                    >
                                      <p className="text-[10px] font-bold mb-3 flex items-center gap-2 uppercase tracking-widest">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                                        Readiness Sentinel
                                      </p>
                                      <p className="text-xs opacity-80 leading-relaxed font-serif italic">
                                        "I'm detecting a cognitive stall. Would you like to try a different modality or take a short regulation break?"
                                      </p>
                                    </motion.div>
                                  )}

                                  {guidance[`thinking-partner-${activeStageId}`] ? (
                                    <div className="markdown-body text-white/90 prose-invert text-sm leading-relaxed">
                                      <Markdown>{guidance[`thinking-partner-${activeStageId}`]!}</Markdown>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <p className="text-sm text-white/70 leading-relaxed italic">
                                        "I'm here to support your reasoning. What systemic connections are you noticing in your current model?"
                                      </p>
                                      <div className="space-y-2">
                                        {[
                                          "Analyze systemic connections",
                                          "Challenge my assumptions",
                                          "Suggest a regulation ritual"
                                        ].map((q, i) => (
                                          <button 
                                            key={i} 
                                            onClick={() => fetchGuidance(i === 2 ? 'readiness-sentinel' : 'thinking-partner', true)}
                                            className="w-full p-4 bg-white/10 rounded-2xl text-[10px] font-bold text-left hover:bg-white/20 transition-all border border-white/5"
                                          >
                                            {q}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10">
                                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">
                                    <Activity className="w-3 h-3" />
                                    <span>Epistemic Fluency: Growing</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setTraceStep('express');
                                      setSessionPhase('expression');
                                    }}
                                    className="w-full py-4 bg-white text-root-olive rounded-2xl font-bold text-sm hover:bg-white/90 transition-colors"
                                  >
                                    Ready to Express
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Expression (E - Express) */}
                    {traceStep === 'express' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass rounded-[56px] p-16 space-y-12 text-center max-w-4xl mx-auto"
                      >
                        <div className="space-y-6">
                          <div className="inline-flex items-center gap-3 px-6 py-2 bg-root-gold/10 text-root-gold rounded-full border border-root-gold/20">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Production Phase</span>
                          </div>
                          <h3 className="text-5xl font-serif font-bold tracking-tight">Express Your Thinking</h3>
                          <p className="text-xl text-root-ink/40 font-serif italic max-w-xl mx-auto leading-relaxed">
                            How will you share this knowledge with the community? Your artifacts accumulate permanently.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            { label: 'Video Explanation', icon: <Volume2 />, color: 'bg-rose-50' },
                            { label: 'Technical Diagram', icon: <Layout />, color: 'bg-blue-50' },
                            { label: 'Prototype Upload', icon: <Hammer />, color: 'bg-amber-50' },
                            { label: 'Written Reflection', icon: <PenTool />, color: 'bg-emerald-50' }
                          ].map(type => (
                            <button key={type.label} className="p-10 rounded-[40px] glass flex flex-col items-center gap-6 hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-root-olive group-hover:scale-110 transition-transform shadow-sm", type.color)}>
                                {type.icon}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{type.label}</span>
                            </button>
                          ))}
                        </div>

                        <div className="pt-8">
                          <button 
                            onClick={() => {
                              setTraceStep('trigger');
                              setCognitiveState(null);
                              setSessionPhase('arrival');
                            }}
                            className="text-[10px] font-bold uppercase tracking-[0.4em] text-root-ink/30 hover:text-root-ink transition-all"
                          >
                            Complete Learning Cycle
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              /* Educator View (Intelligence Console) */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12 pb-32"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h2 className="text-5xl font-serif font-bold tracking-tight">Intelligence Console</h2>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Live Ecosystem Monitoring • Sector 7G</span>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <button 
                      onClick={() => setConnectivityStatus(prev => prev === 'online' ? 'offline' : prev === 'offline' ? 'edge' : 'online')}
                      className="px-6 py-4 glass border border-black/5 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-root-bg transition-all flex items-center gap-3"
                    >
                      <Wifi className="w-4 h-4" />
                      Toggle Network: {connectivityStatus}
                    </button>
                    <button className="px-8 py-4 glass border border-black/5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-root-bg transition-all flex items-center gap-3">
                      <Layout className="w-4 h-4" />
                      Design Mission
                    </button>
                    <button className="px-8 py-4 bg-root-olive text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl shadow-root-olive/20 flex items-center gap-3 hover:scale-105 transition-all">
                      <ShieldCheck className="w-4 h-4" />
                      MTSS Report
                    </button>
                  </div>
                </div>

                {/* Real-time Telemetry */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Human Readiness', value: `${readinessScore}%`, trend: '+4%', color: 'text-emerald-600', sub: 'Class Availability' },
                    { label: 'Optimal Challenge', value: `${Math.round(capabilityProfile.masteryVelocity * 100)}%`, trend: capabilityProfile.masteryVelocity > 0.7 ? 'High' : 'Stable', color: 'text-indigo-600', sub: 'Rigor Alignment' },
                    { label: 'Cognitive Load', value: `${Math.round(learnerState.cognitiveLoad * 100)}%`, trend: learnerState.cognitiveLoad > 0.8 ? 'High' : 'Stable', color: learnerState.cognitiveLoad > 0.8 ? 'text-rose-600' : 'text-emerald-600', sub: 'Attention Support' },
                    { label: 'Care Needed', value: learnerState.regulationStatus === 'stable' ? '00' : '01', trend: '-2', color: 'text-amber-600', sub: 'Intervention Required' }
                  ].map((stat, i) => (
                    <div key={i} className="glass p-10 rounded-[48px] border border-black/5 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity className="w-16 h-16" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mb-2">{stat.label}</p>
                      <div className="flex items-end justify-between mb-4">
                        <p className={cn("text-5xl font-serif font-bold tracking-tighter", stat.color)}>{stat.value}</p>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{stat.trend}</span>
                      </div>
                      <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Ecosystem Map */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="glass rounded-[56px] border border-black/5 overflow-hidden shadow-sm flex flex-col">
                      <div className="p-10 border-b border-black/5 flex items-center justify-between bg-white/40">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-root-olive/10 rounded-2xl">
                            <Users className="w-6 h-6 text-root-olive" />
                          </div>
                          <h3 className="text-2xl font-serif font-bold tracking-tight">Today's Learning Field</h3>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-6 mr-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" /> Deep Work: 14</span>
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" /> Drift Detected: 5</span>
                          </div>
                          <button className="px-6 py-2.5 glass border border-black/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-root-bg transition-all">Filter Field</button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-root-bg/20">
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest opacity-30">Learner</th>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest opacity-30">Readiness</th>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest opacity-30">Cognitive Growth</th>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest opacity-30">Rigor Layer</th>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest opacity-30">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: 'Malik Johnson', readiness: 'Regulated', growth: '+12%', layer: 'System Design', color: 'bg-emerald-500' },
                              { name: 'Jordan Lee', readiness: 'Needs Care', growth: '-2%', layer: 'Concept Access', color: 'bg-amber-400' },
                              { name: 'Sam Chen', readiness: 'Neutral', growth: '+5%', layer: 'Applied Practice', color: 'bg-blue-400' },
                              { name: 'Aisha Ray', readiness: 'Regulated', growth: '+18%', layer: 'Transfer Task', color: 'bg-emerald-500' }
                            ].map((learner, i) => (
                              <tr key={i} className="border-b border-black/5 hover:bg-white/40 transition-colors group">
                                <td className="px-10 py-8">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-root-olive/10 overflow-hidden border-2 border-white shadow-sm">
                                      <img src={`https://picsum.photos/seed/${learner.name}/48/48`} alt="avatar" referrerPolicy="no-referrer" />
                                    </div>
                                    <span className="text-base font-bold tracking-tight">{learner.name}</span>
                                  </div>
                                </td>
                                <td className="px-10 py-8">
                                  <div className="flex items-center gap-3">
                                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", learner.color)} />
                                    <span className="text-xs font-bold opacity-60">{learner.readiness}</span>
                                  </div>
                                </td>
                                <td className="px-10 py-8">
                                  <span className="text-sm font-serif italic text-emerald-600 font-bold">{learner.growth}</span>
                                </td>
                                <td className="px-10 py-8 text-[10px] font-bold opacity-30 uppercase tracking-widest">{learner.layer}</td>
                                <td className="px-10 py-8">
                                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-root-olive hover:tracking-[0.3em] transition-all opacity-0 group-hover:opacity-100">
                                    Intervene <ArrowUpRight className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <GrowthPathMap />
                  </div>

                  <div className="space-y-6">
                    <div className="bg-root-ink text-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Brain className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/10 rounded-2xl">
                            <Sparkles className="w-6 h-6 text-root-gold" />
                          </div>
                          <h3 className="text-2xl font-serif font-bold tracking-tight">Educator Amplifier</h3>
                        </div>
                        <p className="text-lg text-white/60 leading-relaxed font-serif italic">
                          "Jordan Lee is showing signs of cognitive fatigue in the Micro-Grid mission. Suggesting a 5-minute regulation ritual or a shift to collaboration mode."
                        </p>
                        <button 
                          onClick={() => fetchGuidance('educator-amplifier', true)}
                          className="w-full py-5 bg-white text-root-ink rounded-[24px] font-bold text-xs uppercase tracking-widest hover:bg-root-gold hover:text-white transition-all shadow-xl"
                        >
                          Deploy Intervention
                        </button>
                      </div>
                    </div>

                    <div className="glass rounded-[56px] p-12 border border-black/5 shadow-sm space-y-10">
                      <h3 className="text-2xl font-serif font-bold tracking-tight">Class Availability</h3>
                      <div className="space-y-6">
                        {[
                          { label: 'Regulated', count: 18, color: 'bg-emerald-500' },
                          { label: 'Neutral', count: 6, color: 'bg-blue-400' },
                          { label: 'Needs Care', count: 2, color: 'bg-amber-400' }
                        ].map(item => (
                          <div key={item.label} className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
                              <span>{item.label}</span>
                              <span>{item.count} Learners</span>
                            </div>
                            <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / 26) * 100}%` }}
                                className={cn("h-full shadow-lg", item.color)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <SessionTimeline currentPhase={sessionPhase} />
    </div>
  );
}
