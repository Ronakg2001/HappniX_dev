# Cognito Auth Setup

## User Pool Sign-In

1. Open the AWS Cognito console and create or select the HappniX User Pool.
2. In `Sign-in experience`, enable:
   - `Username`
   - `Email`
3. In `Sign-up experience`, collect:
   - `email`
   - `phone_number`
4. Keep password-based sign-in enabled.
5. Do not enable Cognito native SMS OTP for this phase if you want to avoid SMS cost on the Essential plan.

## Lambda Triggers

1. Open `User Pool > Triggers`.
2. Attach:
   - `CognitoPostConfirmation` as the `Post confirmation` trigger
   - `CognitoPreToken` as the `Pre token generation` trigger

## App Client Security

1. Open `User Pool > App integration > App clients`.
2. Set refresh token expiration to `30 days`.
3. Enable token revocation.

## Attribute And Custom Field Guidance

1. Keep `email` and `phone_number` available on the user profile.
2. Add custom attributes only if they help identity workflows directly:
   - `custom:userType`
   - `custom:dateOfBirth`
3. Prefer PostgreSQL for broader profile data and device-trust metadata.

## OTP Bypass For Dev And QA

1. Set Lambda env `TEST_OTP_MODE=true` in `dev` or `qa`.
2. Set `ALLOW_FIXED_TEST_OTP=true` only when you intentionally want the fixed test code path.
3. Never enable either flag in production.
4. In `dev` and `qa`, testers can use:
   - `debugOtp` returned by the API response
   - fixed OTP `123456` when `ALLOW_FIXED_TEST_OTP=true`

## Recommended Sign-In Model

1. Use Cognito for email/username plus password.
2. Use your custom HappniX OTP API for phone verification during build and test phases.
3. After phone verification succeeds, link or continue the session through your backend device-trust logic instead of Cognito SMS.
