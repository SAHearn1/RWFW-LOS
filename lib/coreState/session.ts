export type CoreSessionState = {
  missionDraft: string;
  lastStudioArtifact: string;
};

const DEFAULT_STATE: CoreSessionState = {
  missionDraft: "",
  lastStudioArtifact: ""
};

export function createInitialCoreSessionState(): CoreSessionState {
  return { ...DEFAULT_STATE };
}

export function mergeCoreSessionState(
  current: CoreSessionState,
  patch: Partial<CoreSessionState>
): CoreSessionState {
  return {
    ...current,
    ...patch
  };
}
