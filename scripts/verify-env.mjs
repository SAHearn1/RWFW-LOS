import { readFileSync } from "node:fs";

const envExample = readFileSync(".env.example", "utf8");

const requiredKeys = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_ENABLE_LEDGER",
  "NEXT_PUBLIC_ENABLE_MCP",
  "NEXT_PUBLIC_ENABLE_PICKUP",
  "NEXT_PUBLIC_ENABLE_OFFLINE",
  "NEXT_PUBLIC_ENABLE_CORE_VITE_MOUNT",
  "NEXT_PUBLIC_ENABLE_RUNTIME",
  "NEXT_PUBLIC_ENABLE_STANDARDS_VERIFIER"
];

const missing = requiredKeys.filter((key) => !envExample.includes(`${key}=`));
if (missing.length > 0) {
  console.error(`Missing required env keys in .env.example: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Env completeness verifier passed.");
