import { config as loadEnv } from "dotenv";
import { chromium } from "playwright";

loadEnv({ path: ".env.local" });
loadEnv();

const baseUrl = (process.env.E2E_BASE_URL || "https://rwfw-los.vercel.app").replace(/\/$/, "");
const clerkSecret = process.env.CLERK_SECRET_KEY;
const adminEmail = process.env.E2E_ADMIN_EMAIL;

if (!clerkSecret || !adminEmail) {
  throw new Error("CLERK_SECRET_KEY and E2E_ADMIN_EMAIL are required for cloud AWS smoke.");
}

async function clerkApi(path, options = {}) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`Clerk API ${path} failed (${response.status}): ${text.slice(0, 220)}`);
  }

  return body;
}

async function getUserByEmail(email) {
  const users = await clerkApi(`/users?limit=100&email_address[]=${encodeURIComponent(email)}`);
  const user = users.find((entry) =>
    (entry.email_addresses || []).some((item) => item.email_address.toLowerCase() === email.toLowerCase())
  );
  if (!user) {
    throw new Error(`No Clerk user found for ${email}`);
  }
  return user;
}

async function createSignInTicket(userId) {
  const token = await clerkApi("/sign_in_tokens", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 600 })
  });

  if (!token.token) {
    throw new Error(`No sign-in token returned for user ${userId}`);
  }

  return token.token;
}

async function run() {
  const federationGet = await fetch(`${baseUrl}/api/federation`, { method: "GET" });
  if (!federationGet.ok) {
    throw new Error(`/api/federation GET failed (${federationGet.status})`);
  }
  const federationGetBody = await federationGet.json();

  const federationPost = await fetch(`${baseUrl}/api/federation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: {
        taskId: `task.${Date.now()}`,
        correlationId: `corr.${Date.now()}`,
        requestedByRole: "admin",
        assignedAgentId: "router.primary",
        capabilityId: "federation.route",
        payload: { smoke: true }
      }
    })
  });
  if (!federationPost.ok) {
    throw new Error(`/api/federation POST failed (${federationPost.status})`);
  }
  const federationPostBody = await federationPost.json();

  const user = await getUserByEmail(adminEmail);
  const ticket = await createSignInTicket(user.id);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/sign-in?__clerk_ticket=${encodeURIComponent(ticket)}`, { waitUntil: "networkidle" });
    await page.waitForURL((url) => url.pathname.startsWith("/app"), { timeout: 30000 });

    const inference = await page.request.post(`${baseUrl}/api/inference`, {
      data: {
        prompt: "Cloud smoke prompt",
        privacyMode: "cloud_allowed",
        model: "llama3.1:8b",
        maxTokens: 32,
        temperature: 0.2
      }
    });

    if (!inference.ok()) {
      throw new Error(`/api/inference failed (${inference.status()})`);
    }
    const inferenceBody = await inference.json();

    const workerRun = await page.request.post(`${baseUrl}/api/orchestration/worker-run`, {
      data: {
        idempotencyKey: `smoke.${Date.now()}`,
        priority: "normal",
        payload: { smoke: true }
      }
    });

    if (!workerRun.ok()) {
      const workerBodyText = await workerRun.text();
      throw new Error(`/api/orchestration/worker-run failed (${workerRun.status()}): ${workerBodyText.slice(0, 220)}`);
    }
    const workerBody = await workerRun.json();

    console.log("Cloud smoke passed", {
      baseUrl,
      federationDiscovery: federationGetBody?.discovery?.registrations?.length ?? null,
      federationAssignedAgent: federationPostBody?.result?.output?.assignedAgentId ?? null,
      inferenceProvider: inferenceBody?.result?.provider ?? null,
      inferenceFallback: inferenceBody?.result?.usedFallback ?? null,
      workerQueueBackend: workerBody?.backend?.queue ?? null,
      workerStoreBackend: workerBody?.backend?.stateStore ?? null,
      workerLifecycleStatus: workerBody?.lifecycle?.status ?? null
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

