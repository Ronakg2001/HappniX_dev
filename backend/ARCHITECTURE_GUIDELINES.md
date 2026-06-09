# HappniX Backend Architecture Guidelines

This document outlines the standard coding patterns to be used across the ENTIRE HappniX backend. These rules apply universally to all integrations (DynamoDB, RDS, Cognito, R2 Bucket, etc.) and all handler workflows.

**Please adhere to these rules strictly.**

## 1. Handlers (`handlers/`)

Handlers are the front door for incoming requests (e.g., API Gateway -> Lambda). 
- **The "10-Line Rule"**: If an action's entire business logic (validation, computation, DB call) fits within approximately 10 lines of code, it should be written directly in the handler. Do not create unnecessary boilerplate in the `services/` layer for simple operations (e.g., fetching a country code map, sending an OTP).
- **Variable Unfolding & Validation**: Handlers MUST extract, format, and validate all variables from `kwargs` before passing them to any service. This includes checking regex patterns, formatting phone numbers, and verifying that required keys exist.
- **Response Formatting**: Handlers are strictly responsible for calling `success_response` or `error_response`. Services should never generate HTTP response dicts directly.
- **Action Try/Catch**: Every action wrapper inside a handler must be wrapped in its own `try...except Exception as exc:` block to safely catch, log, and return the specific stringified error (`str(exc)`) as a 500 `error_response` back to the frontend.

## 2. Services (`services/<handler_name>_services.py`)

The `services` layer holds heavy business logic and multi-step orchestration.
- **Naming Convention**: `services/<handler_name>_services.py` (e.g., `services/signup_signin_services.py`).
- **Heavy Lifting Only**: Services are for complex logic that exceeds 10 lines, such as orchestrating an RDS insert, Cognito creation, and DynamoDB provisioning in a single transaction-like flow.
- **Clean Inputs**: Service functions expect explicitly named, validated arguments (e.g., `def execute_user_registration(username: str, full_name: str...)`) rather than raw `**kwargs`. The handler does the messy unfolding.
- **Return Types**: Service functions return simple dictionaries indicating status and data (e.g., `{"success": True, "redirectUrl": "..."}`). The handler wraps this in the final `success_response`.

## 3. Integrations (`integration/`)

The integrations layer (e.g., `dynamo_db.py`, `rds.py`, `cognito_auth.py`, `r2_bucket.py`) contains raw wrappers for AWS or external services.
- **Strictly Generic**: Never write feature-specific data preparation, specific item checks, or self-healing logic here. 
- **`**kwargs` Driven**: ALL functions in the integration layer must use `**kwargs` as the standard parameter transfer mechanism. DO NOT use explicit, rigid positional parameters.
- **Dynamic Config**: Integration functions must rely on `manifest.json` (or `dependencies.py`) to resolve table names, primary keys, required columns, or UserPool mapping attributes dynamically. 

### Examples of Generic Integration Functions:
- `dynamo_db.py`: `get_item(table_name, pk, sk, **kwargs)`
- `rds.py`: `insert_record(table_name, **kwargs)`, `get_record(table_name, **kwargs)`
- `cognito_auth.py`: `create_user(**kwargs)`, `authenticate_user(**kwargs)`

## 4. Shared Utilities (`utils/utilities.py`)

Any helper functions that are used **globally across multiple handlers/features** should be placed in `utils/utilities.py`.
- Examples: `parse_body`, `is_valid_mobile`, `format_phone_in`, generic logging.

## 5. Constant Files (`integration/manifest.json` & `utils/dependencies.py`)

All static parameters, schema definitions, and mappings must be stored in configuration files, keeping the Python code completely dynamic and agnostic to schema changes.

- **`manifest.json`**: Store database schemas (DynamoDB keys/entities, RDS columns/tables) and Cognito attribute mappings here.
- **`dependencies.py`**: Store static maps, enum lists, and environment variable loaders here.
