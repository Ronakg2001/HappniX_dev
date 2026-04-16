# HappniX Deployment Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a minimal push-to-deploy skeleton for HappniX with Cloudflare Pages for the frontend and AWS SAM for a small Lambda-backed backend.

**Architecture:** The frontend remains a static site under `web_frontend/` and receives runtime config at deploy time. The backend is a minimal Python Lambda deployed through SAM with a single `/health` route on API Gateway so we can validate credentials, workflows, and environment wiring before migrating Django behavior.

**Tech Stack:** Cloudflare Pages, Wrangler GitHub Action, AWS SAM, AWS Lambda, API Gateway, Python `unittest`, GitHub Actions

---

### Task 1: Document the deployment skeleton

**Files:**
- Create: `docs/superpowers/plans/2026-04-16-deployment-skeleton.md`

- [ ] **Step 1: Save the implementation plan**

Record the agreed milestone-1 scope:
- Cloudflare Pages deploys `web_frontend/`
- AWS SAM deploys a minimal backend from `backend/`
- `RDS` provisioning is deferred for this milestone
- runtime secrets live in GitHub Secrets

### Task 2: Add the minimal backend

**Files:**
- Create: `backend/app.py`
- Create: `backend/tests/test_app.py`
- Create: `backend/requirements.txt`
- Modify: `template.yaml`

- [ ] **Step 1: Write the failing backend test**
- [ ] **Step 2: Run the backend tests and confirm the new test fails**
- [ ] **Step 3: Implement the Lambda health endpoint and SAM template**
- [ ] **Step 4: Re-run backend tests and confirm they pass**

### Task 3: Add deployment workflows

**Files:**
- Create: `.github/workflows/backend_deploy.yml`
- Create: `.github/workflows/frontend_deploy.yml`

- [ ] **Step 1: Add a backend GitHub Action that configures AWS via OIDC, runs tests, builds SAM, and deploys**
- [ ] **Step 2: Add a frontend GitHub Action that writes runtime config and deploys `web_frontend/` to Cloudflare Pages**

### Task 4: Add frontend runtime config plumbing

**Files:**
- Create: `web_frontend/runtime-config.js`
- Modify: `web_frontend/index.html`
- Modify: `web_frontend/index.js`

- [ ] **Step 1: Add a runtime-config placeholder file that can be replaced during deploy**
- [ ] **Step 2: Load runtime config before `index.js` and make the splash screen use the backend `/health` endpoint when available**

### Task 5: Verify the skeleton

**Files:**
- Verify: `backend/tests/test_app.py`
- Verify: `template.yaml`
- Verify: `.github/workflows/backend_deploy.yml`
- Verify: `.github/workflows/frontend_deploy.yml`

- [ ] **Step 1: Run backend unit tests**
- [ ] **Step 2: Run a YAML sanity check for the SAM template and workflows**
- [ ] **Step 3: Review the resulting diff and summarize the remaining GitHub/AWS/Cloudflare setup actions for the user**
