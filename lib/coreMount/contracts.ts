export type CoreMountStatus = "disabled" | "ready" | "error";

export type CoreMountLifecycle = {
  mount: () => Promise<void>;
  unmount: () => Promise<void>;
  status: () => CoreMountStatus;
};

export type CoreMountContext = {
  route: "/app/core";
  attempt: number;
};
