# HappniX Lambda Function to API Mapping

The serverless architecture routes API Gateway calls to designated AWS Lambda functions defined in the SAM template (`infra/app/template.yaml`).

## Core Lambdas (Always Enabled)

| API Route(s) | Lambda Function | Backend Handler Path |
| --- | --- | --- |
| **POST** `/api/auth` | **`SignupSignin`** | `backend/handlers/signup_signin.lambda_handler` |
| **POST** `/api/dev_only` | **`DevOnly`** | `backend/handlers/dev_only.lambda_handler` |

## Feature Lambdas (Toggled via SAM Parameters)

| API Route(s) | Lambda Function | Toggle Parameter | Backend Handler Path |
| --- | --- | --- | --- |
| **GET** `/api/home/feed`, `/api/home/live`, `/api/home/nearby`<br>**POST** `/api/home/logout`<br>**GET, POST, DELETE** `/api/tickets/*`<br>**GET, POST** `/api/notifications/*`<br>**POST** `/api/guest-invites`, `/api/guest-invites/{token}/{action}`<br>**POST** `/api/profile/update`, `/api/profile/privacy`<br>**GET** `/api/profile/following`, `/api/profile/followers`, `/api/profile/follow-requests`<br>**POST** `/api/profile/follow-requests`<br>**GET** `/api/users/search`, `/api/users/{id}/profile`<br>**POST** `/api/users/follow`<br>**GET, POST** `/api/settings/preferences`<br>**GET, POST, DELETE** `/api/settings/people/{category}` | **`HomePageApi`** | `EnableHomePageApi` | `backend/handlers/home_page.lambda_handler` |
| **POST** `/api/events/create`<br>**GET** `/api/events/mine`, `/api/events/nearby`, `/api/events/live`, `/api/events/{id}`<br>**DELETE** `/api/events/{id}` | **`EventsApi`** | `EnableEventsApi` | `backend/handlers/events.lambda_handler` |
| **GET** `/api/messages/conversations`, `/api/messages/conversations/{id}/messages`<br>**POST** `/api/messages/conversations/start`, `/api/messages/conversations/{id}/messages`, `/api/messages/conversations/{id}/read`<br>**POST** `/api/messages/messages/{id}/edit`, `/api/messages/messages/{id}/forward`, `/api/messages/messages/{id}/delete`, `/api/messages/messages/{id}/unsend`<br>**POST** `/api/messages/groups/create`, `/api/messages/groups/{id}/{action}`<br>**GET** `/api/messages/groups/{id}/messages`<br>**POST** `/api/messages/group-messages/{id}/{action}` | **`MessagingApi`** | `EnableMessagingApi` | `backend/handlers/messaging.lambda_handler` |
| **GET** `/api/profile/me`, `/api/profile/{id}`, `/api/profile/notifications`<br>**POST** `/api/profile/me`, `/api/profile/verify/aadhaar/send`, `/api/profile/verify/aadhaar/verify`, `/api/profile/picture/upload`, `/api/profile/notifications/read` | **`ProfileApi`** | `EnableProfileApi` | `backend/handlers/profile.lambda_handler` |

### Internal / Auth Lifecycle Lambdas:
- **`CognitoPreToken`**: Triggered by Cognito to inject `userID` and `userType` custom claims into JWT tokens. (`handlers/CognitoPreToken.lambda_handler`)
- **`AuthSchemaInit`**: Lambda invoked during CI/CD deploys to initialize the PostgreSQL schema against RDS. (`handlers/AuthSchemaInit.lambda_handler`)
