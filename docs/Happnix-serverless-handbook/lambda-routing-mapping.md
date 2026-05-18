# HappniX Lambda Function to API Mapping

The serverless architecture routes API Gateway calls to designated AWS Lambda functions defined in the SAM template (`infra/app/template.yaml`).

| API Route(s) | Lambda Function | Backend Handler Path |
| --- | --- | --- |
| **POST** `/api/auth` (And Cognito hooks) | **`SignupSignin`** | `backend/SignupSignin.lambda_handler` |
| **GET, POST, DELETE** `/api/events/*` | **`EventsApi`** | `backend/events_api.lambda_handler` |
| **GET, POST, DELETE** `/api/tickets/*` | **`TicketsApi`** | `backend/tickets_api.lambda_handler` |
| **GET, POST** `/api/users/*`<br>**GET, POST** `/api/profile/*`<br>**GET, POST** `/api/settings/*` | **`ProfilesApi`** | `backend/profiles_api.lambda_handler` |
| **GET, POST** `/api/messages/conversations/*`<br>**POST** `/api/messages/messages/*` | **`MessagingApi`** | `backend/messaging_api.lambda_handler` |
| **GET, POST** `/api/messages/groups/*` | **`GroupChatApi`** | `backend/group_chat_api.lambda_handler` |
| **POST** `/api/guest-invites/*` | **`GuestsApi`** | `backend/guests_api.lambda_handler` |

### Internal / Auth Lifecycle Lambdas:
- **`CognitoPostConfirmation`**: Triggered by Cognito to sync confirmed users into RDS PostgreSQL. (`CognitoPostConfirmation.lambda_handler`)
- **`CognitoPreToken`**: Triggered by Cognito to inject `userID` and `userType` custom claims into JWT tokens. (`CognitoPreToken.lambda_handler`)
- **`AuthSchemaInit`**: Custom resource executed during CloudFormation stack deploy to initialize the PostgreSQL schema. (`AuthSchemaInit.lambda_handler`)
