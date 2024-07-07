# Key API

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

### 2. Retrieve Unique Key
- **Endpoint** : Get `/key/:id`
- **Description**: This API is used to retrieve a single Key by unique Id or all of the configured Keys.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the key

### 3. Update Key
- **Endpoint** : Put `/key/:id`
- **Description**: This API method is used to update an existing Key.
Only the name of the Key may be changed; all other fields will remain the same
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the key.
  - `name`: The new name for the key.

### 4. Delete Key
- **Endpoint** : Delete `/key/:id`
- **Description**: Deletes a specific key by its UUID.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the key

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

## Authorization
All endpoints are protected by authorization headers which requires authorization and x-stencil-tenanid values to be passed in headers, which are verified using the `HeaderAuthService`.

## Error Handling
The service includes comprehensive error handling, throwing appropriate HTTP exceptions for various scenarios such as unauthorized access, bad requests, or internal server errors.

## Response Format
All endpoints return a standardized `ResponseDto` object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result
- `data`: The requested or manipulated data (when applicable)
