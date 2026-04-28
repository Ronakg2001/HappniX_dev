# HappniX Auth Schema Init And Frontend Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic PostgreSQL schema initialization during deployment, a dev-only auth diagnostics endpoint, and a frontend-led verification panel that exercises the deployed auth APIs.

**Architecture:** Keep the existing Cognito, Lambda, and RDS stack intact, then extend it with a Lambda-backed CloudFormation custom resource that runs the idempotent SQL schema. Reuse the existing `SignupSignin` Lambda and `signup_signin` frontend to expose a dev-only diagnostics route and a small test panel that shows real API responses for send-OTP, verify-OTP, and status checks.

**Tech Stack:** AWS SAM/CloudFormation, AWS Lambda (Python), PostgreSQL, existing unittest suite, static HTML/CSS/JavaScript frontend

---

## File Map

- Create: `backend/AuthSchemaInit.py`
  - Lambda-backed custom resource handler that runs the schema SQL and reports success/failure to CloudFormation.
- Modify: `backend/auth_db.py`
  - Add reusable schema/readiness helpers used by the dev diagnostics route and schema init support code.
- Modify: `backend/SignupSignin.py`
  - Add a dev-only `/api/auth/dev/status` route and safe diagnostics payload.
- Modify: `backend/sql/happnix_auth_schema.sql`
  - Ensure the schema remains idempotent for repeat deploys.
- Modify: `template.yaml`
  - Register the `AuthSchemaInit` Lambda, custom resource, environment variables for diagnostics, and the new API event route.
- Modify: `tests/test_signup_signin_lambda.py`
  - Add failing tests for the dev diagnostics route and frontend test panel behavior.
- Modify: `tests/test_infra_template.py`
  - Add failing tests for the schema-init Lambda and custom resource wiring.
- Modify: `web_frontend/signup_signin.html`
  - Add a dev-only diagnostics and auth-response test panel.
- Modify: `web_frontend/signup_signin.js`
  - Wire the new panel to the real auth endpoints and render raw API responses.
- Modify: `web_frontend/signup_signin.css`
  - Style the diagnostics/test panel consistently with the existing page.
- Modify: `docs/project-handbook/cognito-auth-setup.md`
  - Document that schema creation is automatic and how to use the new frontend diagnostics flow.

### Task 1: Add Failing Infra Tests For Schema Init Wiring

**Files:**
- Modify: `tests/test_infra_template.py`
- Test: `tests/test_infra_template.py`

- [ ] **Step 1: Write the failing tests**

```python
    def test_template_registers_schema_init_lambda_and_custom_resource(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("AuthSchemaInit:", content)
        self.assertIn("Handler: AuthSchemaInit.lambda_handler", content)
        self.assertIn("HappnixAuthSchemaInitializer:", content)
        self.assertIn("ServiceToken: !GetAtt AuthSchemaInit.Arn", content)

    def test_template_exposes_dev_status_route(self):
        content = Path("template.yaml").read_text(encoding="utf-8")

        self.assertIn("AuthDevStatus:", content)
        self.assertIn("Path: /api/auth/dev/status", content)
        self.assertIn("Method: get", content)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_infra_template -v`
Expected: FAIL because the schema-init Lambda, custom resource, and dev status route do not exist yet

- [ ] **Step 3: Commit**

```bash
git add tests/test_infra_template.py
git commit -m "Add failing tests for schema init infrastructure"
```

### Task 2: Add Failing Backend And Frontend Verification Tests

**Files:**
- Modify: `tests/test_signup_signin_lambda.py`
- Test: `tests/test_signup_signin_lambda.py`

- [ ] **Step 1: Write failing diagnostics route tests**

```python
    def test_dev_status_returns_schema_readiness_payload_in_dev(self):
        os.environ["APP_ENVIRONMENT"] = "dev"
        with patch("backend.SignupSignin.get_dev_auth_status") as mock_status:
            mock_status.return_value = {
                "apiStatus": "ok",
                "environment": "dev",
                "schemaReady": True,
                "tables": {"users": True, "user_devices": True},
            }
            response = lambda_handler(
                {"httpMethod": "GET", "path": "/api/auth/dev/status", "headers": {}},
                None,
            )

        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 200)
        self.assertTrue(body["schemaReady"])
        self.assertEqual(body["tables"]["users"], True)

    def test_dev_status_returns_not_found_outside_dev(self):
        os.environ["APP_ENVIRONMENT"] = "prod"
        response = lambda_handler(
            {"httpMethod": "GET", "path": "/api/auth/dev/status", "headers": {}},
            None,
        )
        body = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 404)
        self.assertEqual(body["message"], "Route not found.")
```

- [ ] **Step 2: Write failing frontend panel tests**

```python
class SignupSigninFrontendTests(unittest.TestCase):
    def test_signup_signin_page_contains_dev_test_panel(self):
        content = Path("web_frontend/signup_signin.html").read_text(encoding="utf-8")

        self.assertIn('id="authDevPanel"', content)
        self.assertIn('id="fetchAuthDevStatusBtn"', content)
        self.assertIn('id="authApiResponse"', content)

    def test_signup_signin_script_wires_dev_status_endpoint(self):
        content = Path("web_frontend/signup_signin.js").read_text(encoding="utf-8")

        self.assertIn('authDevStatus: "/api/auth/dev/status"', content)
        self.assertIn("fetchAuthDevStatusBtn", content)
        self.assertIn("authApiResponse", content)
```

- [ ] **Step 3: Run test to verify it fails**

Run: `python -m unittest tests.test_signup_signin_lambda -v`
Expected: FAIL because the route and test panel do not exist yet

- [ ] **Step 4: Commit**

```bash
git add tests/test_signup_signin_lambda.py
git commit -m "Add failing tests for dev auth diagnostics"
```

### Task 3: Implement Idempotent Schema Helpers And Custom Resource Lambda

**Files:**
- Create: `backend/AuthSchemaInit.py`
- Modify: `backend/auth_db.py`
- Modify: `backend/sql/happnix_auth_schema.sql`
- Test: `tests/test_infra_template.py`

- [ ] **Step 1: Make the SQL explicitly idempotent where needed**

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('Admin', 'Business', 'General');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    ...
);

CREATE TABLE IF NOT EXISTS user_devices (
    ...
);

CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users ("cognitoSub");
```

- [ ] **Step 2: Add reusable readiness helpers to `backend/auth_db.py`**

```python
def execute_sql_script(sql_text):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql_text)
        connection.commit()


def table_exists(table_name):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = %s)",
                (table_name,),
            )
            return bool(cursor.fetchone()[0])
```

- [ ] **Step 3: Create the schema-init Lambda**

```python
from pathlib import Path
from urllib.request import Request, urlopen
import json

from auth_db import execute_sql_script


def lambda_handler(event, context):
    ...
```

Implementation requirements:
- handle `Create`, `Update`, and `Delete`
- on `Create`/`Update`, read `backend/sql/happnix_auth_schema.sql` and execute it
- on `Delete`, respond success without dropping tables
- send a signed response back to CloudFormation using `ResponseURL`

- [ ] **Step 4: Run the focused tests**

Run: `python -m unittest tests.test_infra_template -v`
Expected: still FAIL on template wiring until Task 4 is complete, but no syntax errors from helper imports

- [ ] **Step 5: Commit**

```bash
git add backend/AuthSchemaInit.py backend/auth_db.py backend/sql/happnix_auth_schema.sql
git commit -m "Add schema init lambda and database readiness helpers"
```

### Task 4: Wire Schema Init And Diagnostics Into The SAM Template

**Files:**
- Modify: `template.yaml`
- Test: `tests/test_infra_template.py`

- [ ] **Step 1: Register the new Lambda function**

```yaml
  AuthSchemaInit:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/
      Handler: AuthSchemaInit.lambda_handler
      Description: Initialize HappniX auth schema in PostgreSQL during deploy.
      Timeout: 60
      Policies:
        - AWSLambdaBasicExecutionRole
        - AWSLambdaVPCAccessExecutionRole
```

- [ ] **Step 2: Add the custom resource**

```yaml
  HappnixAuthSchemaInitializer:
    Type: AWS::CloudFormation::CustomResource
    Properties:
      ServiceToken: !GetAtt AuthSchemaInit.Arn
      SchemaVersion: "2026-04-28-auth-schema-v1"
```

- [ ] **Step 3: Add the dev status API event to `SignupSignin`**

```yaml
        AuthDevStatus:
          Type: Api
          Properties:
            Path: /api/auth/dev/status
            Method: get
            RestApiId: !Ref HappnixDevApi
```

- [ ] **Step 4: Add safe diagnostics environment variables**

```yaml
        COGNITO_REGION: !Ref AWS::Region
        COGNITO_USER_POOL_ID: !Ref HappnixUserPool
        COGNITO_USER_POOL_CLIENT_ID: !Ref HappnixUserPoolClient
```

- [ ] **Step 5: Run the infra tests**

Run: `python -m unittest tests.test_infra_template -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add template.yaml tests/test_infra_template.py
git commit -m "Wire schema init and dev diagnostics into SAM template"
```

### Task 5: Implement Dev Status Route In `SignupSignin`

**Files:**
- Modify: `backend/SignupSignin.py`
- Modify: `backend/auth_db.py`
- Test: `tests/test_signup_signin_lambda.py`

- [ ] **Step 1: Add a helper that builds the diagnostics payload**

```python
from .auth_db import table_exists


def get_dev_auth_status():
    return {
        "apiStatus": "ok",
        "environment": _app_environment(),
        "cognitoRegion": os.environ.get("COGNITO_REGION", ""),
        "cognitoUserPoolId": os.environ.get("COGNITO_USER_POOL_ID", ""),
        "cognitoUserPoolClientId": os.environ.get("COGNITO_USER_POOL_CLIENT_ID", ""),
        "databaseEndpoint": os.environ.get("AUTH_DB_HOST", ""),
        "databasePort": os.environ.get("AUTH_DB_PORT", ""),
        "schemaReady": table_exists("users") and table_exists("user_devices"),
        "tables": {
            "users": table_exists("users"),
            "user_devices": table_exists("user_devices"),
        },
    }
```

- [ ] **Step 2: Add the route handler**

```python
def auth_dev_status(event):
    del event
    if _app_environment() != "dev":
        return _json_response(404, {"message": "Route not found."})
    return _json_response(200, get_dev_auth_status())
```

- [ ] **Step 3: Register the route**

```python
ROUTES = {
    ...
    ("GET", "/api/auth/dev/status"): auth_dev_status,
}
```

- [ ] **Step 4: Run the backend/frontend tests**

Run: `python -m unittest tests.test_signup_signin_lambda -v`
Expected: still FAIL on the frontend panel assertions until Task 6 is complete, but the diagnostics route tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/SignupSignin.py backend/auth_db.py tests/test_signup_signin_lambda.py
git commit -m "Add dev auth status endpoint"
```

### Task 6: Add The Frontend Dev Verification Panel

**Files:**
- Modify: `web_frontend/signup_signin.html`
- Modify: `web_frontend/signup_signin.js`
- Modify: `web_frontend/signup_signin.css`
- Test: `tests/test_signup_signin_lambda.py`

- [ ] **Step 1: Add the dev panel markup to the existing page**

```html
        <section id="authDevPanel" class="form-card dev-panel">
          <h2>Developer Verification</h2>
          <p class="sub">Check backend readiness and inspect real auth API responses.</p>
          <div class="dev-actions">
            <button id="fetchAuthDevStatusBtn" class="btn btn-secondary" type="button">
              Check Backend Status
            </button>
          </div>
          <pre id="authDevStatusOutput" class="dev-output" aria-live="polite"></pre>
          <pre id="authApiResponse" class="dev-output" aria-live="polite"></pre>
        </section>
```

- [ ] **Step 2: Add endpoint wiring and response rendering to the script**

```javascript
      authDevStatus: "/api/auth/dev/status",
```

```javascript
    const fetchAuthDevStatusBtn = document.getElementById("fetchAuthDevStatusBtn");
    const authDevStatusOutput = document.getElementById("authDevStatusOutput");
    const authApiResponse = document.getElementById("authApiResponse");

    function renderDevJson(target, payload) {
      if (!target) return;
      target.textContent = JSON.stringify(payload, null, 2);
    }
```

Requirements:
- render send-OTP, verify-OTP, resend-OTP, and login responses into `authApiResponse`
- fetch `/api/auth/dev/status` with `GET` and render it into `authDevStatusOutput`
- keep the panel harmless if the endpoint returns `404`

- [ ] **Step 3: Add minimal styles for the panel**

```css
.dev-panel {
  margin-top: 24px;
}

.dev-output {
  min-height: 120px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 4: Run the frontend/backend tests**

Run: `python -m unittest tests.test_signup_signin_lambda -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web_frontend/signup_signin.html web_frontend/signup_signin.js web_frontend/signup_signin.css tests/test_signup_signin_lambda.py
git commit -m "Add frontend auth diagnostics panel"
```

### Task 7: Refresh Documentation

**Files:**
- Modify: `docs/project-handbook/cognito-auth-setup.md`

- [ ] **Step 1: Document automatic schema initialization**

```markdown
## Automatic Schema Initialization

The stack now runs the auth schema automatically during deployment through the `AuthSchemaInit` Lambda-backed custom resource.

- No manual schema SQL step is required for normal deploys
- Repeat deploys are safe because the schema SQL is idempotent
```

- [ ] **Step 2: Document the frontend diagnostics flow**

```markdown
## Frontend Verification Flow

Use the dev test panel on the sign-in page to:

- fetch `/api/auth/dev/status`
- verify schema readiness
- send and verify OTP
- inspect raw backend responses during testing
```

- [ ] **Step 3: Commit**

```bash
git add docs/project-handbook/cognito-auth-setup.md
git commit -m "Document schema init and frontend verification flow"
```

### Task 8: Final Verification

**Files:**
- Modify: `backend/AuthSchemaInit.py`
- Modify: `backend/auth_db.py`
- Modify: `backend/SignupSignin.py`
- Modify: `backend/sql/happnix_auth_schema.sql`
- Modify: `template.yaml`
- Modify: `tests/test_infra_template.py`
- Modify: `tests/test_signup_signin_lambda.py`
- Modify: `web_frontend/signup_signin.html`
- Modify: `web_frontend/signup_signin.js`
- Modify: `web_frontend/signup_signin.css`
- Modify: `docs/project-handbook/cognito-auth-setup.md`

- [ ] **Step 1: Run the full relevant suite**

Run: `python -m unittest tests.test_infra_template tests.test_signup_signin_lambda tests.test_cognito_post_confirmation tests.test_cognito_pre_token -v`
Expected: PASS

- [ ] **Step 2: Check git status**

Run: `git status --short`
Expected: only the files touched by this plan plus any already-known unrelated local changes

- [ ] **Step 3: Commit final integration**

```bash
git add backend/AuthSchemaInit.py backend/auth_db.py backend/SignupSignin.py backend/sql/happnix_auth_schema.sql template.yaml tests/test_infra_template.py tests/test_signup_signin_lambda.py web_frontend/signup_signin.html web_frontend/signup_signin.js web_frontend/signup_signin.css docs/project-handbook/cognito-auth-setup.md
git commit -m "Add auth schema init and frontend verification flow"
```

## Self-Review

### Spec coverage

- Deployment-time schema initialization is covered by Tasks 1, 3, and 4.
- Dev-only diagnostics endpoint is covered by Tasks 2, 4, and 5.
- Frontend-led end-to-end verification is covered by Tasks 2 and 6.
- Documentation updates are covered by Task 7.

### Placeholder scan

- No `TBD` or `implement later` placeholders remain.
- Each task names exact files, verification commands, and concrete route/resource names.

### Type consistency

- `AuthSchemaInit`, `HappnixAuthSchemaInitializer`, and `/api/auth/dev/status` are named consistently across tasks.
- Diagnostics payload keys such as `schemaReady`, `tables.users`, and `tables.user_devices` stay consistent between tests and implementation.
