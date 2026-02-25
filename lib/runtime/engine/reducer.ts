import type { RuntimeArtifact, RuntimeEvent, RuntimeMission, VerificationEvent } from "@/lib/runtime/contracts/types";

export type RuntimeState = {
  missions: Record<string, RuntimeMission>;
  artifacts: Record<string, RuntimeArtifact>;
  verifications: Record<string, VerificationEvent>;
};

export function createInitialRuntimeState(): RuntimeState {
  return {
    missions: {},
    artifacts: {},
    verifications: {}
  };
}

export function reduceRuntimeState(state: RuntimeState, event: RuntimeEvent): RuntimeState {
  switch (event.type) {
    case "MISSION_STARTED": {
      return {
        ...state,
        missions: {
          ...state.missions,
          [event.mission.id]: event.mission
        }
      };
    }
    case "MISSION_ADVANCED": {
      const mission = state.missions[event.missionId];
      if (!mission) {
        return state;
      }

      return {
        ...state,
        missions: {
          ...state.missions,
          [event.missionId]: {
            ...mission,
            stage: event.stage,
            updatedAtIso: event.updatedAtIso
          }
        }
      };
    }
    case "ARTIFACT_SAVED": {
      return {
        ...state,
        artifacts: {
          ...state.artifacts,
          [event.artifact.id]: event.artifact
        }
      };
    }
    case "VERIFICATION_RECORDED": {
      return {
        ...state,
        verifications: {
          ...state.verifications,
          [event.verification.id]: event.verification
        }
      };
    }
    default:
      return state;
  }
}
