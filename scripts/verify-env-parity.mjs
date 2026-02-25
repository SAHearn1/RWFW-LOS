import { existsSync, readFileSync } from "node:fs";

function parseEnv(text) {
  const map = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const splitIndex = line.indexOf("=");
    if (splitIndex < 1) {
      continue;
    }

    map.set(line.slice(0, splitIndex).trim(), line.slice(splitIndex + 1).trim());
  }
  return map;
}

const envExample = parseEnv(readFileSync(".env.example", "utf8"));
const requiredParityKeys = [
  "AWS_REGION",
  "AWS_SQS_QUEUE_URL",
  "AWS_SQS_DLQ_URL",
  "AWS_DYNAMODB_ORCHESTRATION_TABLE",
  "AWS_EVENTBRIDGE_BUS_NAME",
  "OLLAMA_BASE_URL",
  "OLLAMA_MODEL",
  "FEDERATION_GATEWAY_SHARED_SECRET",
  "NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA",
  "NEXT_PUBLIC_ENABLE_FEDERATION"
];

const missingInExample = requiredParityKeys.filter((key) => !envExample.has(key));
if (missingInExample.length > 0) {
  console.error(`Missing parity keys in .env.example: ${missingInExample.join(", ")}`);
  process.exit(1);
}

const localMap = new Map();
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) {
    continue;
  }
  const parsed = parseEnv(readFileSync(file, "utf8"));
  for (const [key, value] of parsed.entries()) {
    if (!localMap.has(key)) {
      localMap.set(key, value);
    }
  }
}

function readRuntimeValue(key) {
  return process.env[key] ?? localMap.get(key) ?? "";
}

function hasAnyValue(keys) {
  return keys.some((key) => readRuntimeValue(key).trim().length > 0);
}

const errors = [];

const awsKeys = [
  "AWS_REGION",
  "AWS_SQS_QUEUE_URL",
  "AWS_SQS_DLQ_URL",
  "AWS_DYNAMODB_ORCHESTRATION_TABLE",
  "AWS_EVENTBRIDGE_BUS_NAME"
];

if (hasAnyValue(awsKeys)) {
  for (const key of awsKeys) {
    if (!readRuntimeValue(key).trim()) {
      errors.push(`AWS parity is partial. Missing value for ${key}`);
    }
  }
}

const ollamaKeys = ["OLLAMA_BASE_URL", "OLLAMA_MODEL"];
if (hasAnyValue(ollamaKeys)) {
  for (const key of ollamaKeys) {
    if (!readRuntimeValue(key).trim()) {
      errors.push(`Ollama parity is partial. Missing value for ${key}`);
    }
  }
}

if (readRuntimeValue("NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA") === "true") {
  for (const key of ollamaKeys) {
    if (!readRuntimeValue(key).trim()) {
      errors.push(`NEXT_PUBLIC_ENABLE_LOCAL_OLLAMA=true requires ${key}`);
    }
  }
}

if (readRuntimeValue("NEXT_PUBLIC_ENABLE_FEDERATION") === "true" && !readRuntimeValue("FEDERATION_GATEWAY_SHARED_SECRET").trim()) {
  errors.push("NEXT_PUBLIC_ENABLE_FEDERATION=true requires FEDERATION_GATEWAY_SHARED_SECRET");
}

if (errors.length > 0) {
  console.error(`Env parity check failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("Cloud/local env parity verifier passed.");
