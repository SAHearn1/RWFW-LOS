import { existsSync, readFileSync } from "node:fs";

const envExample = readFileSync(".env.example", "utf8");

const requiredKeys = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_ENABLE_LEDGER",
  "NEXT_PUBLIC_ENABLE_MCP",
  "NEXT_PUBLIC_ENABLE_PICKUP",
  "NEXT_PUBLIC_ENABLE_OFFLINE",
  "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT",
  "NEXT_PUBLIC_ENABLE_RUNTIME",
  "NEXT_PUBLIC_ENABLE_DB_LEDGER",
  "NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER"
];

const publishablePlaceholders = new Set([
  "replace_with_real_clerk_publishable_key",
  "replace_with_clerk_publishable_key"
]);

const secretPlaceholders = new Set([
  "replace_with_real_clerk_secret_key",
  "replace_with_clerk_secret_key"
]);

function parseEnvText(text) {
  const map = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator < 1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    map.set(key, rawValue);
  }
  return map;
}

function hasWrappingQuotes(value) {
  return (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  );
}

function unquote(value) {
  if (hasWrappingQuotes(value)) {
    return value.slice(1, -1).trim();
  }

  return value.trim();
}

function validatePublishableKey(raw, { allowPlaceholders = false } = {}) {
  if (raw === undefined || raw === null || raw === "") {
    return "is missing";
  }

  const value = unquote(raw);
  if (allowPlaceholders && publishablePlaceholders.has(value)) {
    return null;
  }

  if (!value.startsWith("pk_")) {
    return "must start with pk_";
  }

  if (/\s/.test(value)) {
    return "must not include whitespace";
  }

  if (value.length < 20) {
    return "is too short";
  }

  return null;
}

function validateSecretKey(raw, { allowPlaceholders = false } = {}) {
  if (raw === undefined || raw === null || raw === "") {
    return "is missing";
  }

  const value = unquote(raw);
  if (allowPlaceholders && secretPlaceholders.has(value)) {
    return null;
  }

  if (!value.startsWith("sk_")) {
    return "must start with sk_";
  }

  if (/\s/.test(value)) {
    return "must not include whitespace";
  }

  if (value.length < 20) {
    return "is too short";
  }

  return null;
}

const missing = requiredKeys.filter((key) => !envExample.includes(`${key}=`));
if (missing.length > 0) {
  console.error(`Missing required env keys in .env.example: ${missing.join(", ")}`);
  process.exit(1);
}

const envExampleMap = parseEnvText(envExample);
const boolFlagKeys = [
  "NEXT_PUBLIC_ENABLE_LEDGER",
  "NEXT_PUBLIC_ENABLE_MCP",
  "NEXT_PUBLIC_ENABLE_PICKUP",
  "NEXT_PUBLIC_ENABLE_OFFLINE",
  "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT",
  "NEXT_PUBLIC_ENABLE_RUNTIME",
  "NEXT_PUBLIC_ENABLE_DB_LEDGER",
  "NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER"
];

const boolFlagErrors = boolFlagKeys
  .map((key) => {
    const value = unquote(envExampleMap.get(key) ?? "").toLowerCase();
    return value === "true" || value === "false" ? null : `${key} must be true or false in .env.example`;
  })
  .filter(Boolean);

const examplePublicPkError = validatePublishableKey(envExampleMap.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") ?? "", { allowPlaceholders: true });
const exampleServerPkError = validatePublishableKey(envExampleMap.get("CLERK_PUBLISHABLE_KEY") ?? "", { allowPlaceholders: true });
const exampleSkError = validateSecretKey(envExampleMap.get("CLERK_SECRET_KEY") ?? "", { allowPlaceholders: true });

if (examplePublicPkError || exampleServerPkError || exampleSkError || boolFlagErrors.length > 0) {
  const errors = [
    ...(examplePublicPkError ? [`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ${examplePublicPkError} in .env.example`] : []),
    ...(exampleServerPkError ? [`CLERK_PUBLISHABLE_KEY ${exampleServerPkError} in .env.example`] : []),
    ...(exampleSkError ? [`CLERK_SECRET_KEY ${exampleSkError} in .env.example`] : []),
    ...boolFlagErrors
  ];

  console.error(`Invalid .env.example values:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const localEnvCandidates = [".env.local", ".env"];
const localEnvMap = new Map();
for (const file of localEnvCandidates) {
  if (!existsSync(file)) {
    continue;
  }

  const parsed = parseEnvText(readFileSync(file, "utf8"));
  for (const [key, value] of parsed.entries()) {
    if (!localEnvMap.has(key)) {
      localEnvMap.set(key, value);
    }
  }
}

const runtimePk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ?? localEnvMap.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
  ?? process.env.CLERK_PUBLISHABLE_KEY
  ?? localEnvMap.get("CLERK_PUBLISHABLE_KEY");
const runtimeSk = process.env.CLERK_SECRET_KEY ?? localEnvMap.get("CLERK_SECRET_KEY");

if (runtimePk) {
  // Allow known placeholder values — they mean "not yet configured locally"
  // and should not fail the gate (real key format is enforced when present).
  const runtimePkError = validatePublishableKey(runtimePk, { allowPlaceholders: true });
  if (runtimePkError) {
    console.error(`Invalid Clerk publishable key: ${runtimePkError}`);
    process.exit(1);
  }
}

if (runtimeSk) {
  const runtimeSkError = validateSecretKey(runtimeSk, { allowPlaceholders: true });
  if (runtimeSkError) {
    console.error(`Invalid CLERK_SECRET_KEY: ${runtimeSkError}`);
    process.exit(1);
  }
}

console.log("Env completeness and auth-key verifier passed.");
