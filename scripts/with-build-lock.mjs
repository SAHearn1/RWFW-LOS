import { openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const lockPath = resolve(".rwfw-build.lock");
const metaPath = resolve(".rwfw-build.lock.meta.json");

function commandParts() {
  if (process.platform === "win32") {
    return { command: "cmd.exe", args: ["/d", "/s", "/c", "next build"] };
  }

  return { command: "next", args: ["build"] };
}

function readExistingMeta() {
  try {
    return JSON.parse(readFileSync(metaPath, "utf8"));
  } catch {
    return null;
  }
}

function cleanupLock() {
  try {
    rmSync(lockPath, { force: true });
    rmSync(metaPath, { force: true });
  } catch {
    // deterministic best-effort cleanup
  }
}

try {
  openSync(lockPath, "wx");
} catch {
  const existing = readExistingMeta();
  const hint = existing
    ? ` Active lock pid=${existing.pid} host=${existing.host} startedAt=${existing.startedAtIso}.`
    : "";
  console.error(`Build lock is already held for this worktree.${hint} Refusing concurrent build.`);
  process.exit(1);
}

const metadata = {
  pid: process.pid,
  host: process.env.COMPUTERNAME ?? process.env.HOSTNAME ?? "unknown",
  startedAtIso: new Date().toISOString()
};
writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

const releaseAndExit = (code) => {
  cleanupLock();
  process.exit(code);
};

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => releaseAndExit(130));
}

const { command, args } = commandParts();
const run = spawnSync(command, args, { stdio: "inherit" });
const exitCode = run.status ?? 1;
releaseAndExit(exitCode);



