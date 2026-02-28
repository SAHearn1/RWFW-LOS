import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const dbPath = resolve("rootwork-ledger.db");
const jsonReportPath = resolve("docs", "status", "runtime-ledger-consistency-latest.json");
const mdReportPath = resolve("docs", "status", "runtime-ledger-consistency-latest.md");

function ensureReportDirectory() {
  if (!existsSync(dirname(jsonReportPath))) {
    mkdirSync(dirname(jsonReportPath), { recursive: true });
  }
}

function isValidIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function loadRuntimeSnapshot() {
  const runtimePath = resolve("docs", "status", "runtime-snapshot-latest.json");
  if (!existsSync(runtimePath)) {
    return { found: false, missions: [], artifacts: [], verifications: [] };
  }

  try {
    const raw = JSON.parse(readFileSync(runtimePath, "utf8"));
    return {
      found: true,
      missions: Object.values(raw.missions ?? {}),
      artifacts: Object.values(raw.artifacts ?? {}),
      verifications: Object.values(raw.verifications ?? {})
    };
  } catch {
    return { found: false, missions: [], artifacts: [], verifications: [] };
  }
}

function runConsistencyChecks(database) {
  const rows = database
    .prepare("SELECT id, type, mission_id, learner_id, payload_json, created_at_iso, updated_at_iso FROM ledger_records")
    .all();

  const failures = [];
  const warnings = [];
  const byType = { mission: 0, artifact: 0, verification: 0 };
  const missionIds = new Set();

  for (const row of rows) {
    if (!["mission", "artifact", "verification"].includes(row.type)) {
      failures.push(`Unknown ledger record type for ${row.id}: ${row.type}`);
      continue;
    }

    byType[row.type] += 1;
    if (row.type === "mission") {
      missionIds.add(row.mission_id);
    }

    if (!isValidIso(row.created_at_iso) || !isValidIso(row.updated_at_iso)) {
      failures.push(`Invalid timestamp format for ${row.id}`);
    }

    try {
      const payload = JSON.parse(row.payload_json);
      if (row.type === "verification") {
        if (payload.missionId !== row.mission_id) {
          failures.push(`Verification mission mismatch for ${row.id}`);
        }
        if (!payload.artifactId) {
          failures.push(`Verification missing artifactId for ${row.id}`);
        }
      }

      if (row.type === "artifact" && !payload.content) {
        warnings.push(`Artifact ${row.id} has empty content payload.`);
      }
    } catch {
      failures.push(`Invalid payload_json for ${row.id}`);
    }
  }

  for (const row of rows) {
    if (row.type !== "artifact" && row.type !== "verification") {
      continue;
    }

    if (!missionIds.has(row.mission_id)) {
      warnings.push(`No mission record found for ${row.id} mission ${row.mission_id}.`);
    }
  }

  return { rows, failures, warnings, byType };
}

function runRoundTripTest() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE ledger_records (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      learner_id TEXT,
      payload_json TEXT NOT NULL,
      created_at_iso TEXT NOT NULL,
      updated_at_iso TEXT NOT NULL
    )
  `);

  const now = new Date().toISOString();
  const missionId = "mission-test-001";
  const artifactId = "artifact-test-001";
  const verificationId = "verification-test-001";

  db.prepare("INSERT INTO ledger_records VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    missionId,
    "mission",
    missionId,
    "learner-001",
    JSON.stringify({ title: "Test Mission" }),
    now,
    now
  );

  db.prepare("INSERT INTO ledger_records VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    artifactId,
    "artifact",
    missionId,
    "learner-001",
    JSON.stringify({ content: "Test artifact content" }),
    now,
    now
  );

  db.prepare("INSERT INTO ledger_records VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    verificationId,
    "verification",
    missionId,
    "learner-001",
    JSON.stringify({ missionId, artifactId }),
    now,
    now
  );

  const { failures } = runConsistencyChecks(db);
  db.close();

  if (failures.length !== 0) {
    console.error("[round-trip test] FAILED — unexpected failures:", failures);
    process.exit(1);
  }

  console.log("[round-trip test] PASSED — zero failures on seeded in-memory DB.");
}

function main() {
  // Run round-trip integration test first (always, regardless of DB presence)
  runRoundTripTest();

  ensureReportDirectory();

  // Intentional skip: operator has explicitly opted out of the consistency check
  if (process.env.LEDGER_CONSISTENCY_ALLOW_SKIP === "true") {
    const payload = {
      generatedAtIso: new Date().toISOString(),
      passed: true,
      skipped: true,
      reason: "LEDGER_CONSISTENCY_ALLOW_SKIP=true",
      failures: [],
      warnings: ["Consistency checks intentionally skipped via LEDGER_CONSISTENCY_ALLOW_SKIP."]
    };
    writeFileSync(jsonReportPath, JSON.stringify(payload, null, 2));
    writeFileSync(mdReportPath, "# Runtime-Ledger Consistency Report\n\n- Status: skipped\n- Reason: LEDGER_CONSISTENCY_ALLOW_SKIP=true\n");
    console.log(`Consistency check intentionally skipped. Report: ${jsonReportPath}`);
    return;
  }

  // Missing DB is only a hard failure when NEXT_PUBLIC_ENABLE_DB_LEDGER=true.
  // When the flag is disabled (default), SQLite is not expected to exist — skip gracefully.
  if (!existsSync(dbPath)) {
    const dbLedgerEnabled = process.env.NEXT_PUBLIC_ENABLE_DB_LEDGER === "true";
    if (!dbLedgerEnabled) {
      const payload = {
        generatedAtIso: new Date().toISOString(),
        passed: true,
        skipped: true,
        reason: "NEXT_PUBLIC_ENABLE_DB_LEDGER is not enabled — SQLite ledger not expected.",
        failures: [],
        warnings: ["rootwork-ledger.db not found, but NEXT_PUBLIC_ENABLE_DB_LEDGER is false. Skipping file consistency check."]
      };
      writeFileSync(jsonReportPath, JSON.stringify(payload, null, 2));
      writeFileSync(mdReportPath, "# Runtime-Ledger Consistency Report\n\n- Status: skipped (flag disabled)\n- Reason: NEXT_PUBLIC_ENABLE_DB_LEDGER not enabled\n");
      console.log(`Consistency check skipped: DB ledger flag disabled. Report: ${jsonReportPath}`);
      return;
    }

    const payload = {
      generatedAtIso: new Date().toISOString(),
      passed: false,
      skipped: false,
      reason: "rootwork-ledger.db not found",
      failures: ["rootwork-ledger.db does not exist but NEXT_PUBLIC_ENABLE_DB_LEDGER=true"],
      warnings: []
    };
    writeFileSync(jsonReportPath, JSON.stringify(payload, null, 2));
    writeFileSync(mdReportPath, "# Runtime-Ledger Consistency Report\n\n- Status: FAILED\n- Reason: rootwork-ledger.db not found but DB ledger is enabled\n");
    console.error(`Consistency check failed: rootwork-ledger.db not found. Report: ${jsonReportPath}`);
    process.exit(1);
  }

  const database = new Database(dbPath, { readonly: true });
  const { rows, failures, warnings, byType } = runConsistencyChecks(database);

  const runtimeSnapshot = loadRuntimeSnapshot();
  if (!runtimeSnapshot.found) {
    warnings.push("Runtime snapshot not found at docs/status/runtime-snapshot-latest.json.");
  }

  const payload = {
    generatedAtIso: new Date().toISOString(),
    passed: failures.length === 0,
    skipped: false,
    counts: {
      totalRecords: rows.length,
      mission: byType.mission,
      artifact: byType.artifact,
      verification: byType.verification,
      runtimeSnapshotFound: runtimeSnapshot.found
    },
    failures,
    warnings
  };

  writeFileSync(jsonReportPath, JSON.stringify(payload, null, 2));

  const summary = [
    "# Runtime-Ledger Consistency Report",
    "",
    `- Generated: ${payload.generatedAtIso}`,
    `- Passed: ${payload.passed}`,
    `- Total records: ${payload.counts.totalRecords}`,
    `- Mission records: ${payload.counts.mission}`,
    `- Artifact records: ${payload.counts.artifact}`,
    `- Verification records: ${payload.counts.verification}`,
    `- Runtime snapshot present: ${payload.counts.runtimeSnapshotFound}`,
    "",
    "## Failures",
    ...(failures.length > 0 ? failures.map((line) => `- ${line}`) : ["- None"]),
    "",
    "## Warnings",
    ...(warnings.length > 0 ? warnings.map((line) => `- ${line}`) : ["- None"])
  ].join("\n");

  writeFileSync(mdReportPath, `${summary}\n`);

  if (!payload.passed) {
    console.error(`Consistency check failed. Report: ${jsonReportPath}`);
    process.exit(1);
  }

  console.log(`Consistency check passed. Report: ${jsonReportPath}`);
}

main();
