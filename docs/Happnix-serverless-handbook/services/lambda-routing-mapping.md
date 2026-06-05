# HappniX Lambda Function to API Mapping

The serverless architecture routes API Gateway calls to designated AWS Lambda functions defined in the SAM template (`infra/app/template.yaml`).

| API Route(s) | Lambda Function | Backend Handler Path |
| --- | --- | --- |
| **POST** `/api/auth` | **`SignupSignin`** | `backend/handlers/signup_signin.lambda_handler` |
| **GET, POST, DELETE** `/api/events/*`<br>**POST** `/api/tickets/*` | **`EventsApi`** | `backend/events.lambda_handler` |
| **GET, POST, DELETE** `/api/home/*`<br>**GET, POST, DELETE** `/api/tickets/*`<br>**GET, POST** `/api/notifications/*`<br>**POST** `/api/guest-invites` | **`HomePageApi`** | `backend/home_page.lambda_handler` |
| **GET, POST** `/api/messages/*` | **`MessagingApi`** | `backend/messaging.lambda_handler` |
| **GET, POST** `/api/profile/*` | **`ProfileApi`** | `backend/profile.lambda_handler` |

### Internal / Auth Lifecycle Lambdas:
- **`CognitoPostConfirmation`**: Triggered by Cognito to sync confirmed users into RDS PostgreSQL. (`CognitoPostConfirmation.lambda_handler`)
- **`CognitoPreToken`**: Triggered by Cognito to inject `userID` and `userType` custom claims into JWT tokens. (`CognitoPreToken.lambda_handler`)
- **`AuthSchemaInit`**: Custom resource executed during CloudFormation stack deploy to initialize the PostgreSQL schema. (`AuthSchemaInit.lambda_handler`)
