# AWS OIDC Setup for GitHub Actions (Issue #166)

This runbook walks through replacing static `AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY` secrets with short-lived OIDC-federated credentials.

## What Changes

**Before:** CI uses long-lived static IAM user keys stored as GitHub secrets.
**After:** CI assumes a scoped IAM role via OIDC — no long-lived secrets needed.

---

## Step 1: Create the OIDC Identity Provider in AWS

1. Open **IAM → Identity Providers → Add provider**
2. Select **OpenID Connect**
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Click **Get thumbprint**
5. Audience: `sts.amazonaws.com`
6. Click **Add provider**

---

## Step 2: Create the IAM Role

1. Open **IAM → Roles → Create role**
2. Select **Web identity** → Identity provider: `token.actions.githubusercontent.com`
3. Audience: `sts.amazonaws.com`
4. Add condition: `token.actions.githubusercontent.com:sub` = `repo:SAHearn1/RWFW-LOS:ref:refs/heads/main`
   - To allow PRs too, use a wildcard: `repo:SAHearn1/RWFW-LOS:*`
5. Name the role: `rwfw-los-github-actions-ci`
6. Attach the minimum required policies:
   - `AmazonSQSFullAccess` (or a custom policy scoped to your queue ARNs)
   - `AmazonDynamoDBFullAccess` (or a custom policy scoped to your table ARNs)
   - `AmazonEventBridgeFullAccess` (or a custom policy scoped to your bus)
   - If using Bedrock: `AmazonBedrockFullAccess` (or scoped)
7. Copy the **Role ARN** (e.g., `arn:aws:iam::123456789012:role/rwfw-los-github-actions-ci`)

---

## Step 3: Add GitHub Secret

In the GitHub repo → **Settings → Secrets and variables → Actions**:

| Secret Name | Value |
|---|---|
| `AWS_OIDC_ROLE_ARN` | `arn:aws:iam::<account-id>:role/rwfw-los-github-actions-ci` |

Keep `AWS_REGION` set. Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
once OIDC is confirmed working.

---

## Step 4: Remove Static Key Secrets

After verifying a CI run succeeds with OIDC:

1. Delete `AWS_ACCESS_KEY_ID` from GitHub Secrets
2. Delete `AWS_SECRET_ACCESS_KEY` from GitHub Secrets
3. Deactivate or delete the IAM user that owned these keys

---

## Step 5: Update Vercel Environment Variables

For the production Vercel deployment, update runtime AWS credentials to use
instance-role credentials instead of static keys:

- If running on AWS infrastructure: attach an IAM role to the compute instance
- If using Vercel (external to AWS): keep a narrow-scope static key only for
  production runtime (separate from the CI key), rotating it quarterly

---

## Verification

After setup, the CI run log should show:
```
Assuming role: arn:aws:iam::<account-id>:role/rwfw-los-github-actions-ci
```

And the `AWS_ACCESS_KEY_ID` environment variable will contain a temporary
`ASIA*` key (not `AKIA*` which indicates a static key).
