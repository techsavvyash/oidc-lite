---
title: Keys API Guide
description: A guide in my new Starlight docs site.
---

This API provides endpoints for managing cryptographic keys. Cryptographic keys are used in signing and verifying JWTs and verifying responses for third party identity providers


## Key Types
The service supports generating three types of keys:
- RSA keys (RS256)
- Elliptic Curve keys (ES256)
- HMAC keys (HS256)

Each key type is stored in the database with its relevant information, including public and private keys where applicable.

## Endpoints

### 1. Retrieve All Keys
- **Endpoint** : Get `/key`
- **Description**: This API is used to retrieve all of the configured Keys.
- **Authorization-Header**: Required
- **Sample cURL**:
  ```sh
  curl -X GET http://localhost:3000/key \
    -H "Authorization: Bearer dummy_token" \
    -H "x-stencil-tenanid: dummy_tenant_id"

- **Sample HTTPie**:
  ```sh
  http GET http://localhost:3000/key \
  Authorization:"Bearer dummy_token" \
  x-stencil-tenanid:dummy_tenant_id


### 2. Retrieve Unique Key
- **Endpoint** : Get `/key/:id`
- **Description**: This API is used to retrieve a single Key by unique Id or all of the configured Keys.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the key
- **Sample cURL**:
  ```sh
  curl -X GET http://localhost:3000/key/unique_key_id \
  -H "Authorization: Bearer dummy_token" \
  -H "x-stencil-tenanid: dummy_tenant_id"

- **Sample HTTPie**:
  ```sh
  http GET http://localhost:3000/key/unique_key_id \
  Authorization:"Bearer dummy_token" \
  x-stencil-tenanid:dummy_tenant_id


### 3. Update Key
- **Endpoint** : Put `/key/:id`
- **Description**: This API method is used to update an existing Key.
Only the name of the Key may be changed; all other fields will remain the same
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the key.
  - `name`: The new name for the key.
- **Sample cURL**:
  ```sh
  curl -X PUT http://localhost:3000/key/unique_key_id \
  -H "Authorization: Bearer dummy_token" \
  -H "x-stencil-tenanid: dummy_tenant_id" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "new_key_name"
  }'

- **Sample HTTPie**:
  ```sh
  http PUT http://localhost:3000/key/unique_key_id \
  Authorization:"Bearer dummy_token" \
  x-stencil-tenanid:dummy_tenant_id \
  name="new_key_name"


### 4. Delete Key
- **Endpoint** : Delete `/key/:id`
- **Description**: Deletes a specific key by its UUID.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the key
- **Sample cURL**:
  ```sh
  curl -X DELETE http://localhost:3000/key/unique_key_id \
  -H "Authorization: Bearer dummy_token" \
  -H "x-stencil-tenanid: dummy_tenant_id"

- **Sample HTTPie**:
  ```sh
  http DELETE http://localhost:3000/key/unique_key_id \
  Authorization:"Bearer dummy_token" \
  x-stencil-tenanid:dummy_tenant_id


### 5. Generate Key with random id
- **Endpoint** : Post `/key/generate`
- **Description**: Generates a new cryptographic key with specified parameters.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id for the new key
  - `algorithm`: The algorithm to use (RS256, ES256, or HS256)
  - `name`: The name of the key
  - `length`: The key length (for some algorithms)
  - `issuer`: The issuer of the key
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/key/generate \
  -H "Authorization: Bearer dummy_token" \
  -H "x-stencil-tenanid: dummy_tenant_id" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "random_key_id",
    "algorithm": "RS256",
    "name": "new_key",
    "length": 2048,
    "issuer": "example_issuer"
  }'



- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/key/generate \
  Authorization:"Bearer dummy_token" \
  x-stencil-tenanid:dummy_tenant_id \
  uuid="random_key_id" \
  algorithm="RS256" \
  name="new_key" \
  length:=2048 \
  issuer="example_issuer"


### 6. Generate Key with given id
- **Endpoint** : Post `/key/generate:id`
- **Description**: Generates a new cryptographic key with specified parameters.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id for the new key
  - `algorithm`: The algorithm to use (RS256, ES256, or HS256)
  - `name`: The name of the key
  - `length`: The key length (for some algorithms)
  - `issuer`: The issuer of the key
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/key/generate/unique_key_id \
  -H "Authorization: Bearer dummy_token" \
  -H "x-stencil-tenanid: dummy_tenant_id" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "unique_key_id",
    "algorithm": "RS256",
    "name": "new_key",
    "length": 2048,
    "issuer": "example_issuer"
  }'
  
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/key/generate/unique_key_id \
  Authorization:"Bearer dummy_token" \
  x-stencil-tenanid:dummy_tenant_id \
  uuid="unique_key_id" \
  algorithm="RS256" \
  name="new_key" \
  length:=2048 \
  issuer="example_issuer"


## Authorization
All endpoints are protected by authorization headers which requires authorization and x-stencil-tenanid values to be passed in headers, which are verified using the `HeaderAuthService`.

## Error Handling
The service includes comprehensive error handling, throwing appropriate HTTP exceptions for various scenarios such as unauthorized access, bad requests, or internal server errors.

## Response Format
All endpoints return a standardized `ResponseDto` object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result
- `data`: The requested or manipulated data (when applicable)
