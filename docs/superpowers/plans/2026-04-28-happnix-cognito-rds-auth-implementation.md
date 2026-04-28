# HappniX Cognito + RDS Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-oriented Cognito + PostgreSQL auth foundation for HappniX, including SQL schema, Cognito sync/token Lambdas, OTP bypass controls, and deployment documentation.

**Architecture:** Keep the existing `backend/SignupSignin.py` compatibility Lambda for testing-oriented OTP flows, but factor shared database logic into a focused support module so Cognito triggers and the OTP API can use the same PostgreSQL access path. Add a PostgreSQL schema script, two Cognito-trigger Lambda entrypoints, targeted unit tests, and a deployment/configuration guide wired into the current SAM template.

**Tech Stack:** Python 3.12, AWS SAM, AWS Cognito User Pools, AWS Lambda, PostgreSQL, psycopg2, unittest

---

## File Map

- Create: `backend/auth_db.py`
  - Shared PostgreSQL connection, user lookup, user upsert, and token-claim query helpers.
- Create: `backend/CognitoPostConfirmation.py`
  - Post Confirmation trigger handler and `userID` generation logic.
- Create: `backend/CognitoPreToken.py`
  - Pre Token Generation trigger handler and custom claim override logic.
- Create: `backend/sql/happnix_auth_schema.sql`
  - PostgreSQL schema for `user_type`, `users`, indexes, constraints, comments, and `user_devices`.
- Create: `tests/test_cognito_post_confirmation.py`
  - Unit tests for `userID` generation, insert/upsert behavior, and overlap logging.
- Create: `tests/test_cognito_pre_token.py`
  - Unit tests for token claim injection and missing-row behavior.
- Create: `docs/project-handbook/cognito-auth-setup.md`
  - Console configuration guide for Cognito, OTP bypass mode, refresh token settings, and trigger attachment.
- Modify: `backend/SignupSignin.py`
  - Add explicit OTP bypass environment gating, fixed OTP support, and device-warning response scaffolding without breaking current test flows.
- Modify: `template.yaml`
  - Register new trigger Lambdas and add environment variables for RDS + OTP bypass configuration.
- Modify: `tests/test_signup_signin_lambda.py`
  - Extend coverage for fixed OTP mode, production bypass rejection, and suspicious-login warning behavior.

### Task 1: Add PostgreSQL Schema Script

**Files:**
- Create: `backend/sql/happnix_auth_schema.sql`
- Test: `backend/sql/happnix_auth_schema.sql`

- [ ] **Step 1: Write the schema file**

```sql
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('Admin', 'Business', 'General');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    "userID" CHAR(8) PRIMARY KEY,
    "cognitoSub" UUID NOT NULL UNIQUE,
    "userName" VARCHAR(150) NOT NULL,
    "emailAddress" VARCHAR(255) NOT NULL,
    "userType" user_type_enum NOT NULL DEFAULT 'General',
    "phoneNumber" VARCHAR(20) NOT NULL UNIQUE,
    "adharNumber" VARCHAR(20),
    "adharVerified" BOOLEAN,
    "emailVerified" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMPTZ,
    "loginDeviceCount" INTEGER NOT NULL DEFAULT 0,
    "cognitoIdToken" TEXT,
    "cognitoAccessToken" TEXT,
    "cognitoRefreshToken" TEXT,
    CONSTRAINT users_userid_format_chk CHECK ("userID" ~ '^[A-Z0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS users_cognito_sub_idx ON users ("cognitoSub");
CREATE INDEX IF NOT EXISTS users_email_address_idx ON users ("emailAddress");
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users ("phoneNumber");

COMMENT ON COLUMN users."cognitoIdToken" IS
'Storing Cognito tokens is usually discouraged because they expire quickly and raise security risk; kept here only for this requested architecture.';
COMMENT ON COLUMN users."cognitoAccessToken" IS
'Storing Cognito tokens is usually discouraged because they expire quickly and raise security risk; kept here only for this requested architecture.';
COMMENT ON COLUMN users."cognitoRefreshToken" IS
'Storing Cognito refresh tokens is usually discouraged because of persistence and security risk; kept here only for this requested architecture.';

CREATE TABLE IF NOT EXISTS user_devices (
    "deviceID" BIGSERIAL PRIMARY KEY,
    "userID" CHAR(8) NOT NULL REFERENCES users ("userID") ON DELETE CASCADE,
    "deviceFingerprintHash" TEXT NOT NULL,
    "deviceName" VARCHAR(255),
    "isTrusted" BOOLEAN NOT NULL DEFAULT FALSE,
    "warningVerificationRequired" BOOLEAN NOT NULL DEFAULT FALSE,
    "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastIpAddress" VARCHAR(64),
    "lastUserAgent" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS user_devices_user_fingerprint_idx
ON user_devices ("userID", "deviceFingerprintHash");

COMMIT;
```

- [ ] **Step 2: Verify the required schema elements are present**

Run: `Get-Content backend\sql\happnix_auth_schema.sql`
Expected: includes `user_type_enum`, `users`, `user_devices`, `users_cognito_sub_idx`, and the token-storage comments

- [ ] **Step 3: Commit**

```bash
git add backend/sql/happnix_auth_schema.sql
git commit -m "Add HappniX auth PostgreSQL schema"
```

### Task 2: Add Shared PostgreSQL Helper Module

**Files:**
- Create: `backend/auth_db.py`
- Test: `tests/test_cognito_post_confirmation.py`
- Test: `tests/test_cognito_pre_token.py`

- [ ] **Step 1: Write the failing tests for shared DB helpers**

```python
import unittest
from unittest.mock import MagicMock, patch

from backend import auth_db


class AuthDbTests(unittest.TestCase):
    @patch("backend.auth_db.psycopg2.connect")
    def test_fetch_user_claims_by_sub_returns_expected_fields(self, mock_connect):
        fake_cursor = MagicMock()
        fake_cursor.fetchone.return_value = {
            "userID": "AB12CD34",
            "userType": "General",
            "isActive": True,
        }
        fake_connection = MagicMock()
        fake_connection.cursor.return_value.__enter__.return_value = fake_cursor
        mock_connect.return_value = fake_connection

        claims = auth_db.fetch_user_claims_by_sub("11111111-1111-1111-1111-111111111111")

        self.assertEqual(
            claims,
            {"userID": "AB12CD34", "userType": "General", "isActive": True},
        )

    @patch("backend.auth_db.psycopg2.connect")
    def test_upsert_user_executes_insert_on_conflict_statement(self, mock_connect):
        fake_cursor = MagicMock()
        fake_connection = MagicMock()
        fake_connection.cursor.return_value.__enter__.return_value = fake_cursor
        mock_connect.return_value = fake_connection

        auth_db.upsert_cognito_user(
            {
                "userID": "ZXCV1234",
                "cognitoSub": "11111111-1111-1111-1111-111111111111",
                "userName": "tester",
                "emailAddress": "test@example.com",
                "userType": "General",
                "phoneNumber": "+919876543210",
                "emailVerified": True,
                "isActive": True,
                "dateOfBirth": "2000-01-01",
            }
        )

        executed_sql = fake_cursor.execute.call_args[0][0]
        self.assertIn('ON CONFLICT ("cognitoSub") DO UPDATE', executed_sql)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m unittest tests.test_cognito_post_confirmation tests.test_cognito_pre_token -v`
Expected: FAIL with import errors because `backend.auth_db` and trigger modules do not exist yet

- [ ] **Step 3: Write the shared DB helper module**

```python
import os

import psycopg2
from psycopg2.extras import RealDictCursor


def _connect():
    return psycopg2.connect(
        host=os.environ["AUTH_DB_HOST"],
        port=os.environ.get("AUTH_DB_PORT", "5432"),
        dbname=os.environ["AUTH_DB_NAME"],
        user=os.environ["AUTH_DB_USER"],
        password=os.environ["AUTH_DB_PASSWORD"],
        connect_timeout=int(os.environ.get("AUTH_DB_CONNECT_TIMEOUT", "5")),
    )


def fetch_user_claims_by_sub(cognito_sub):
    with _connect() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT "userID", "userType", "isActive"
                FROM users
                WHERE "cognitoSub" = %s
                """,
                (cognito_sub,),
            )
            return cursor.fetchone()


def user_id_exists(user_id):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1 FROM users WHERE "userID" = %s', (user_id,))
            return cursor.fetchone() is not None


def upsert_cognito_user(record):
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (
                    "userID",
                    "cognitoSub",
                    "userName",
                    "emailAddress",
                    "userType",
                    "phoneNumber",
                    "emailVerified",
                    "isActive",
                    "dateOfBirth"
                )
                VALUES (%(userID)s, %(cognitoSub)s, %(userName)s, %(emailAddress)s, %(userType)s,
                        %(phoneNumber)s, %(emailVerified)s, %(isActive)s, %(dateOfBirth)s)
                ON CONFLICT ("cognitoSub")
                DO UPDATE SET
                    "userName" = EXCLUDED."userName",
                    "emailAddress" = EXCLUDED."emailAddress",
                    "userType" = EXCLUDED."userType",
                    "phoneNumber" = EXCLUDED."phoneNumber",
                    "emailVerified" = EXCLUDED."emailVerified",
                    "isActive" = EXCLUDED."isActive",
                    "dateOfBirth" = EXCLUDED."dateOfBirth",
                    "updatedAt" = CURRENT_TIMESTAMP
                """,
                record,
            )
```

- [ ] **Step 4: Run tests to verify helper behavior**

Run: `python -m unittest tests.test_cognito_post_confirmation tests.test_cognito_pre_token -v`
Expected: tests that import `backend.auth_db` now run, but trigger-specific tests still fail until trigger files exist

- [ ] **Step 5: Commit**

```bash
git add backend/auth_db.py tests/test_cognito_post_confirmation.py tests/test_cognito_pre_token.py
git commit -m "Add shared PostgreSQL auth helpers"
```

### Task 3: Build the Post Confirmation Trigger

**Files:**
- Create: `backend/CognitoPostConfirmation.py`
- Modify: `backend/auth_db.py`
- Test: `tests/test_cognito_post_confirmation.py`

- [ ] **Step 1: Write the failing trigger tests**

```python
import unittest
from unittest.mock import patch

from backend.CognitoPostConfirmation import lambda_handler


class CognitoPostConfirmationTests(unittest.TestCase):
    @patch("backend.CognitoPostConfirmation.auth_db.user_id_exists", side_effect=[True, False])
    @patch("backend.CognitoPostConfirmation.auth_db.upsert_cognito_user")
    @patch("backend.CognitoPostConfirmation._generate_candidate_ids", return_value=iter(["AAAA1111", "BBBB2222"]))
    def test_post_confirmation_retries_until_unique_user_id(
        self,
        _mock_candidates,
        mock_upsert,
        _mock_exists,
    ):
        event = {
            "request": {
                "userAttributes": {
                    "sub": "11111111-1111-1111-1111-111111111111",
                    "email": "person@example.com",
                    "phone_number": "+919876543210",
                    "email_verified": "true",
                    "preferred_username": "person",
                    "custom:dateOfBirth": "2000-01-01",
                }
            }
        }

        response = lambda_handler(event, None)

        mock_upsert.assert_called_once()
        saved_record = mock_upsert.call_args[0][0]
        self.assertEqual(saved_record["userID"], "BBBB2222")
        self.assertEqual(response, event)

    @patch("backend.CognitoPostConfirmation.auth_db.find_overlap_candidates")
    @patch("backend.CognitoPostConfirmation.auth_db.upsert_cognito_user")
    @patch("backend.CognitoPostConfirmation.auth_db.user_id_exists", return_value=False)
    @patch("backend.CognitoPostConfirmation._generate_candidate_ids", return_value=iter(["WXYZ6789"]))
    def test_post_confirmation_logs_overlap_without_merging(
        self,
        _mock_candidates,
        _mock_exists,
        mock_upsert,
        mock_find_overlap_candidates,
    ):
        mock_find_overlap_candidates.return_value = [{"userID": "OLDUSER1"}]
        event = {
            "request": {
                "userAttributes": {
                    "sub": "22222222-2222-2222-2222-222222222222",
                    "email": "person@example.com",
                    "phone_number": "+919876543210",
                    "email_verified": "false",
                    "preferred_username": "person-2",
                    "custom:dateOfBirth": "2000-01-01",
                }
            }
        }

        with patch("builtins.print") as mock_print:
            lambda_handler(event, None)

        mock_upsert.assert_called_once()
        self.assertTrue(mock_print.called)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_cognito_post_confirmation -v`
Expected: FAIL because `backend.CognitoPostConfirmation` does not exist yet

- [ ] **Step 3: Implement the trigger**

```python
import itertools
import json
import random
import string

from . import auth_db


ALPHABET = string.ascii_uppercase + string.digits


def _generate_candidate_ids():
    while True:
        yield "".join(random.choice(ALPHABET) for _ in range(8))


def _bool_text(value):
    return str(value).strip().lower() == "true"


def _record_from_event(attributes):
    user_name = (
        attributes.get("preferred_username")
        or attributes.get("name")
        or attributes.get("email", "").split("@")[0]
        or attributes.get("phone_number", "user")
    )
    return {
        "cognitoSub": attributes["sub"],
        "userName": user_name,
        "emailAddress": attributes.get("email") or f'{attributes["sub"]}@placeholder.local',
        "userType": attributes.get("custom:userType", "General"),
        "phoneNumber": attributes.get("phone_number", f'+unverified-{attributes["sub"][:8]}'),
        "emailVerified": _bool_text(attributes.get("email_verified", "false")),
        "isActive": True,
        "dateOfBirth": attributes.get("custom:dateOfBirth", "2000-01-01"),
    }


def lambda_handler(event, context):
    del context
    attributes = event["request"]["userAttributes"]
    record = _record_from_event(attributes)
    overlaps = auth_db.find_overlap_candidates(record["emailAddress"], record["phoneNumber"])
    if overlaps:
        print(json.dumps({"level": "warning", "message": "identity overlap detected", "overlaps": overlaps}))

    for candidate in _generate_candidate_ids():
        if not auth_db.user_id_exists(candidate):
            record["userID"] = candidate
            break
    auth_db.upsert_cognito_user(record)
    return event
```

- [ ] **Step 4: Add the overlap helper used by the trigger**

```python
def find_overlap_candidates(email_address, phone_number):
    with _connect() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT "userID", "emailAddress", "phoneNumber"
                FROM users
                WHERE "emailAddress" = %s OR "phoneNumber" = %s
                """,
                (email_address, phone_number),
            )
            return cursor.fetchall()
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python -m unittest tests.test_cognito_post_confirmation -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/CognitoPostConfirmation.py backend/auth_db.py tests/test_cognito_post_confirmation.py
git commit -m "Add Cognito post confirmation sync trigger"
```

### Task 4: Build the Pre Token Generation Trigger

**Files:**
- Create: `backend/CognitoPreToken.py`
- Test: `tests/test_cognito_pre_token.py`

- [ ] **Step 1: Write the failing tests**

```python
import unittest
from unittest.mock import patch

from backend.CognitoPreToken import lambda_handler


class CognitoPreTokenTests(unittest.TestCase):
    @patch("backend.CognitoPreToken.auth_db.fetch_user_claims_by_sub")
    def test_pre_token_adds_user_claims(self, mock_fetch):
        mock_fetch.return_value = {"userID": "AB12CD34", "userType": "Business", "isActive": True}
        event = {
            "request": {"userAttributes": {"sub": "11111111-1111-1111-1111-111111111111"}},
            "response": {"claimsOverrideDetails": {}},
        }

        response = lambda_handler(event, None)

        claims = response["response"]["claimsOverrideDetails"]["claimsToAddOrOverride"]
        self.assertEqual(claims["userID"], "AB12CD34")
        self.assertEqual(claims["userType"], "Business")

    @patch("backend.CognitoPreToken.auth_db.fetch_user_claims_by_sub", return_value=None)
    def test_pre_token_leaves_event_unchanged_when_mapping_missing(self, _mock_fetch):
        event = {
            "request": {"userAttributes": {"sub": "11111111-1111-1111-1111-111111111111"}},
            "response": {"claimsOverrideDetails": {}},
        }

        response = lambda_handler(event, None)

        self.assertEqual(response["response"]["claimsOverrideDetails"], {})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_cognito_pre_token -v`
Expected: FAIL because `backend.CognitoPreToken` does not exist yet

- [ ] **Step 3: Implement the pre-token trigger**

```python
import json
import os

from . import auth_db


def lambda_handler(event, context):
    del context
    sub = event["request"]["userAttributes"]["sub"]
    claims = auth_db.fetch_user_claims_by_sub(sub)
    if not claims:
        print(json.dumps({"level": "warning", "message": "missing cognito mapping", "sub": sub}))
        if os.environ.get("ALLOW_MISSING_CLAIMS_FALLBACK", "false").lower() != "true":
            return event
        return event

    override = event.setdefault("response", {}).setdefault("claimsOverrideDetails", {})
    override["claimsToAddOrOverride"] = {
        "userID": claims["userID"],
        "userType": claims["userType"],
    }
    return event
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest tests.test_cognito_pre_token -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/CognitoPreToken.py tests/test_cognito_pre_token.py
git commit -m "Add Cognito pre token claim customization trigger"
```

### Task 5: Extend the OTP Compatibility Lambda For Controlled Bypass

**Files:**
- Modify: `backend/SignupSignin.py`
- Modify: `tests/test_signup_signin_lambda.py`

- [ ] **Step 1: Write the failing OTP bypass tests**

```python
def test_verify_mobile_otp_allows_fixed_test_code_when_enabled(self):
    os.environ["TEST_OTP_MODE"] = "true"
    os.environ["ALLOW_FIXED_TEST_OTP"] = "true"
    send_response = self._post("/api/auth/mobile/send-otp", {"mobile": "9876543210"})
    cookie = send_response["headers"]["Set-Cookie"]

    response = self._post(
        "/api/auth/mobile/verify-otp",
        {"mobile": "9876543210", "otp": "123456"},
        cookie=cookie,
    )

    self.assertEqual(response["statusCode"], 200)

def test_send_mobile_otp_hides_debug_otp_in_prod(self):
    os.environ["APP_ENVIRONMENT"] = "prod"
    response = self._post("/api/auth/mobile/send-otp", {"mobile": "9876543210"})
    body = json.loads(response["body"])

    self.assertNotIn("debugOtp", body)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest tests.test_signup_signin_lambda -v`
Expected: FAIL because fixed OTP is not yet recognized and bypass gating is incomplete

- [ ] **Step 3: Implement explicit OTP bypass helpers**

```python
def _app_environment():
    return os.environ.get("APP_ENVIRONMENT", "dev").strip().lower()


def _test_otp_mode_enabled():
    return os.environ.get("TEST_OTP_MODE", "false").strip().lower() == "true"


def _fixed_test_otp_allowed():
    return (
        _test_otp_mode_enabled()
        and os.environ.get("ALLOW_FIXED_TEST_OTP", "false").strip().lower() == "true"
        and _app_environment() != "prod"
    )


def _include_debug_otp():
    return _test_otp_mode_enabled() and _app_environment() in {"dev", "qa"}
```

- [ ] **Step 4: Update OTP response and verification logic**

```python
if _include_debug_otp():
    response_payload["debugOtp"] = otp

if saved_otp != otp:
    if not (_fixed_test_otp_allowed() and otp == "123456"):
        return _with_session(400, {"message": "Invalid OTP."}, token)
```

- [ ] **Step 5: Add suspicious-login warning response scaffolding**

```python
return _with_session(
    200,
    {
        "message": "Verification required before linking this device.",
        "loginStatus": "warning_verification_required",
        "overlapType": "phone",
        "redirectUrl": "/auth/warning-verification/",
    },
    token,
)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `python -m unittest tests.test_signup_signin_lambda -v`
Expected: PASS, including new OTP bypass cases

- [ ] **Step 7: Commit**

```bash
git add backend/SignupSignin.py tests/test_signup_signin_lambda.py
git commit -m "Harden OTP bypass controls in compatibility auth lambda"
```

### Task 6: Register Cognito Trigger Lambdas In SAM

**Files:**
- Modify: `template.yaml`

- [ ] **Step 1: Update the SAM template**

```yaml
Globals:
  Function:
    Runtime: python3.12
    Timeout: 10
    MemorySize: 256
    Environment:
      Variables:
        APP_ENVIRONMENT: !Ref AppEnvironment
        TEST_OTP_MODE: "false"
        ALLOW_FIXED_TEST_OTP: "false"
        ALLOW_MISSING_CLAIMS_FALLBACK: "false"
        AUTH_DB_HOST: ""
        AUTH_DB_PORT: "5432"
        AUTH_DB_NAME: ""
        AUTH_DB_USER: ""
        AUTH_DB_PASSWORD: ""

Resources:
  CognitoPostConfirmation:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/
      Handler: CognitoPostConfirmation.lambda_handler
      Description: Sync confirmed Cognito users into HappniX PostgreSQL.
      Policies:
        - AWSLambdaBasicExecutionRole

  CognitoPreToken:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/
      Handler: CognitoPreToken.lambda_handler
      Description: Inject userID and userType claims from HappniX PostgreSQL.
      Policies:
        - AWSLambdaBasicExecutionRole
```

- [ ] **Step 2: Verify the template contains the new trigger resources**

Run: `Get-Content template.yaml`
Expected: includes `CognitoPostConfirmation`, `CognitoPreToken`, and the new DB/OTP environment variables

- [ ] **Step 3: Commit**

```bash
git add template.yaml
git commit -m "Register Cognito trigger lambdas in SAM template"
```

### Task 7: Write the Cognito Console Configuration Guide

**Files:**
- Create: `docs/project-handbook/cognito-auth-setup.md`

- [ ] **Step 1: Write the guide**

```markdown
# Cognito Auth Setup

## User Pool Sign-In

1. In the AWS Cognito console, create or open the HappniX User Pool.
2. Under `Sign-in experience`, enable:
   - `Username`
   - `Email`
3. Under `Sign-up experience`, collect `email` and `phone_number`.
4. Keep password-based sign-in enabled.
5. Do not enable Cognito SMS OTP for this phase.

## Lambda Triggers

1. Open `User Pool > Triggers`.
2. Attach:
   - `CognitoPostConfirmation`
   - `CognitoPreToken`

## App Client Security

1. Open `User Pool > App integration > App clients`.
2. Set refresh token expiration to `30 days`.
3. Enable token revocation.

## OTP Bypass For Dev And QA

1. Set Lambda env `TEST_OTP_MODE=true`.
2. Set `ALLOW_FIXED_TEST_OTP=true` only in local/dev/qa.
3. Never enable either flag in production.
4. In dev/qa, frontend testers may use:
   - `debugOtp` returned by the API
   - fixed OTP `123456` when explicitly enabled
```

- [ ] **Step 2: Verify the guide content**

Run: `Get-Content docs\project-handbook\cognito-auth-setup.md`
Expected: includes sign-in settings, trigger attachment, refresh token settings, and OTP bypass instructions

- [ ] **Step 3: Commit**

```bash
git add docs/project-handbook/cognito-auth-setup.md
git commit -m "Document Cognito auth setup and OTP bypass flow"
```

### Task 8: Run Full Verification

**Files:**
- Modify: `tests/test_cognito_post_confirmation.py`
- Modify: `tests/test_cognito_pre_token.py`
- Modify: `tests/test_signup_signin_lambda.py`

- [ ] **Step 1: Run focused auth test suites**

Run: `python -m unittest tests.test_signup_signin_lambda tests.test_cognito_post_confirmation tests.test_cognito_pre_token -v`
Expected: PASS

- [ ] **Step 2: Verify SAM template parses**

Run: `sam validate`
Expected: `template.yaml is a valid SAM Template`

- [ ] **Step 3: Check git status is clean except intended files**

Run: `git status --short`
Expected:

```text
M backend/SignupSignin.py
M template.yaml
A backend/auth_db.py
A backend/CognitoPostConfirmation.py
A backend/CognitoPreToken.py
A backend/sql/happnix_auth_schema.sql
A docs/project-handbook/cognito-auth-setup.md
A tests/test_cognito_post_confirmation.py
A tests/test_cognito_pre_token.py
M tests/test_signup_signin_lambda.py
```

- [ ] **Step 4: Commit final integration batch**

```bash
git add backend/SignupSignin.py backend/auth_db.py backend/CognitoPostConfirmation.py backend/CognitoPreToken.py backend/sql/happnix_auth_schema.sql template.yaml docs/project-handbook/cognito-auth-setup.md tests/test_signup_signin_lambda.py tests/test_cognito_post_confirmation.py tests/test_cognito_pre_token.py
git commit -m "Build Cognito and PostgreSQL auth foundation"
```

## Self-Review

### Spec coverage

- SQL schema requirement is covered by Task 1.
- Post Confirmation trigger and unique `userID` generation are covered by Tasks 2 and 3.
- Pre Token Generation customization is covered by Task 4.
- OTP bypass and testing controls are covered by Task 5.
- Cognito configuration guidance is covered by Task 7.
- Deployment wiring is covered by Task 6.
- Verification is covered by Task 8.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Each task lists exact files, commands, and concrete code/examples.

### Type consistency

- `userID`, `userType`, `cognitoSub`, `emailAddress`, and `phoneNumber` are used consistently across SQL, Python, and tests.
- Trigger module names match the planned SAM handlers: `CognitoPostConfirmation.lambda_handler` and `CognitoPreToken.lambda_handler`.
