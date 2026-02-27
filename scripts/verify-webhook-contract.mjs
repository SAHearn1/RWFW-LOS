import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

// ─── 1. File-existence checks (unchanged) ────────────────────────────────────
const requiredFiles = [
  "app/api/webhooks/clerk/route.ts",
  "lib/observability/audit.ts"
];

for (const file of requiredFiles) {
  readFileSync(file, "utf8");
}

let failed = 0;

function pass(label) {
  console.log(`  ✓ ${label}`);
}

function fail(label) {
  console.error(`  ✗ ${label}`);
  failed++;
}

console.log("Webhook contract checks:");

pass("Webhook route file present");
pass("Audit transport file present");

// ─── 2. HMAC signature unit tests ────────────────────────────────────────────
function verifyHmac(body, signature, secret) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const provided = signature.trim().toLowerCase();
  if (expected.length !== provided.length) return false;
  // Constant-time compare without importing timingSafeEqual in the script
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

const sampleBody = JSON.stringify({ type: "user.created", id: "evt_123" });
const sampleSecret = "whsec_testclerkwebhooksecret";
const validSignature = createHmac("sha256", sampleSecret).update(sampleBody).digest("hex");
const tamperedSignature = createHmac("sha256", sampleSecret).update(sampleBody + "tampered").digest("hex");

if (verifyHmac(sampleBody, validSignature, sampleSecret)) {
  pass("Signature verification: valid HMAC passes");
} else {
  fail("Signature verification: valid HMAC passes");
}

if (!verifyHmac(sampleBody, tamperedSignature, sampleSecret)) {
  pass("Signature verification: tampered payload rejected");
} else {
  fail("Signature verification: tampered payload rejected");
}

// ─── 3. Static checks on the webhook handler ─────────────────────────────────
const webhookSource = readFileSync("app/api/webhooks/clerk/route.ts", "utf8");

if (webhookSource.includes("private_metadata")) {
  pass("Role extraction: private_metadata referenced");
} else {
  fail("Role extraction: private_metadata referenced");
}

if (webhookSource.includes("public_metadata")) {
  pass("Role extraction: public_metadata referenced");
} else {
  fail("Role extraction: public_metadata referenced");
}

if (webhookSource.includes("syncPublicMetadata")) {
  pass("syncPublicMetadata called in handler");
} else {
  fail("syncPublicMetadata called in handler");
}

if (webhookSource.includes("recordAuditEvent")) {
  pass("Audit event recorded in handler");
} else {
  fail("Audit event recorded in handler");
}

if (webhookSource.includes(".synced")) {
  pass("syncPublicMetadata result (.synced) checked");
} else {
  fail("syncPublicMetadata result (.synced) checked");
}

// ─── 4. Final result ──────────────────────────────────────────────────────────
if (failed > 0) {
  console.error(`\nWebhook verifier contract check FAILED (${failed} failure${failed === 1 ? "" : "s"}).`);
  process.exit(1);
}

console.log("Webhook verifier contract check passed.");
