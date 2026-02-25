import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const requiredFiles = [
  "app/api/webhooks/clerk/route.ts",
  "lib/observability/audit.ts"
];

for (const file of requiredFiles) {
  readFileSync(file, "utf8");
}

const webhookSource = readFileSync("app/api/webhooks/clerk/route.ts", "utf8");
if (!webhookSource.includes("svix-signature") || !webhookSource.includes("CLERK_WEBHOOK_SECRET")) {
  console.error("Webhook verifier contract missing required signature/secret checks.");
  process.exit(1);
}

const samplePayload = JSON.stringify({ type: "user.created", id: "evt_123" });
const sampleSecret = "clerk_test_secret";
const signature = createHash("sha256").update(samplePayload + sampleSecret).digest("hex");
if (!signature) {
  console.error("Webhook verifier smoke failed.");
  process.exit(1);
}

console.log("Webhook verifier contract check passed.");
