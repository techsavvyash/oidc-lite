---
title: Refresh Token Guide
description: A guide in my new Starlight docs site.
---

Refresh token is a token assigned to user while registration, and is used to refresh jwt and access tokens.

## Key Features
- JWT-based token refresh mechanism
- Comprehensive token retrieval and deletion options
- Secure token handling and validation

## Endpoints

### 1. Refresh Token
- **Endpoint** : Post `/jwt/refresh`
- **Description**: Refreshes an access token using a refresh token.
- **Parameters**: 
  - Refresh token and access token (either through cookie or request body)
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh \
    Authorization:"Bearer <your_access_token>" \
    refreshToken="<your_refresh_token>"
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <your_access_token>" \
    -d '{
      "refreshToken": "<your_refresh_token>"
    }'

### 2. Retrieve Refresh Token by ID
- **Endpoint** : Post `/jwt/refresh/:id`
- **Description**: Retrieves a refresh token by its ID.
- **Authorization-Header**: Required- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh/<id> \
  Authorization:"Bearer <your_access_token>"

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>"



### 3. Retrieve Refresh Tokens by User ID
- **Endpoint** : Post `/jwt/refresh`
- **Description**: Retrieves all refresh tokens for a specific user.
- **Authorization-Header**: Required
- **Parameters**: 
  - `userId`: User ID
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh \
  Authorization:"Bearer <your_access_token>" \
  userId="<user_id>"

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "userId": "<user_id>"
  }'


### 4. Delete Refresh Tokens by Application ID
- **Endpoint** : Post `/jwt/refresh/:tokenId`
- **Description**: Deletes all refresh tokens for a specific application.
- **Authorization-Header**: Required
- **Parameters**: 
  - `applicationsId`: Application ID
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh/<tokenId> \
  Authorization:"Bearer <your_access_token>" \
  applicationsId="<application_id>"

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh/<tokenId> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "applicationsId": "<application_id>"
  }'


### 5. Delete Refresh Tokens by User ID
- **Endpoint** : Post `/jwt/refresh`
- **Description**: Deletes all refresh tokens for a specific user.
- **Authorization-Header**: Required
- **Parameters**: 
  - `userId`: User ID
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh \
  Authorization:"Bearer <your_access_token>" \
  userId="<user_id>"

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "userId": "<user_id>"
  }'


### 6. Delete Refresh Tokens by User and Application ID
- **Endpoint** : Post `/jwt/refresh`
- **Description**: Deletes refresh tokens for a specific user in a specific application.
- **Authorization-Header**: Required
- **Parameters**: 
  - `userId`: User ID
  - `applicationsId`: Application ID
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh \
  Authorization:"Bearer <your_access_token>" \
  userId="<user_id>" \
  applicationsId="<application_id>"

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "userId": "<user_id>",
    "applicationsId": "<application_id>"
  }'


### 7. Delete Refresh Token by Token ID
- **Endpoint** : Post `/jwt/refresh`
- **Description**: Deletes a specific refresh token by its ID.
- **Authorization-Header**: Required
- **Parameters**: 
  - `tokenId`: id
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh \
  Authorization:"Bearer <your_access_token>" \
  tokenId="<token_id>"

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "tokenId": "<token_id>"
  }'


### 8. Delete Refresh Token by Token String
- **Endpoint** : Post `/jwt/refresh`
- **Description**: Deletes a specific refresh token by its token string.
- **Authorization-Header**: Required
- **Parameters**: 
  - `TokenString`: String
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/jwt/refresh \
  Authorization:"Bearer <your_access_token>" \
  TokenString="<token_string>"

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/jwt/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "TokenString": "<token_string>"
  }'


## Authorization
All endpoints are protected by authorization headers which requires authorization and x-stencil-tenanid values to be passed in headers, which are verified using the `HeaderAuthService`.

## Error Handling
The service includes comprehensive error handling, throwing appropriate exceptions for various scenarios such as:
- Unauthorized access
- Bad requests (missing or invalid data)
- Internal server errors

## Response Format
All endpoints return a standardized response object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result
- `data`: The requested or manipulated data (when applicable)

