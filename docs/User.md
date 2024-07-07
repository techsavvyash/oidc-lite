# User Service

## Overview
The User Service is a part of a NestJS application that handles user-related operations such as creating, retrieving, updating, and deleting users.


## Endpoints

### 1. Create A User with random id
- **Endpoint** : Post `/user`
- **Description** : Creates a new user in the system.
- **Authorization-Header**: Required
- **Parameters:**
    - `data`: CreateUserDto - The data for creating the user
    - `headers`: object - The request headers

### 2. Create A User with given id
- **Endpoint** : Post `/user/:id`
- **Description** : Creates a new user in the system.
- **Authorization-Header**: Required
- **Parameters:**
    - `id`: string - The unique identifier for the user
    - `data`: CreateUserDto - The data for creating the user
    - `headers`: object - The request headers

### 3. Return a User
- **Endpoint** : Get `/user/:id`
- **Description** : Retrieves a user by their ID.
- **Authorization-Header**: Required
- **Parameters:**
    - `id`: string - The unique identifier of the user
    - `headers`: object - The request headers

### 4. Update a User
- **Endpoint** : Post `/user/:id`
- **Description** : Updates an existing user's information.
- **Authorization-Header**: Required
- **Parameters:**
    - `id`: string - The unique identifier of the user
    - `data`: UpdateUserDto - The data to update the user
    - `headers`: object - The request headers

### 5. Delete a User
- **Endpoint** : Post `/user/:id`
- **Description** : Deletes a user or sets them as inactive.
- **Authorization-Header**: Required
- **Parameters:**
    - `id`: string - The unique identifier of the user
    - `headers`: object - The request headers
    - `hardDelete`: string - If provided, permanently deletes the user; otherwise, sets the user as inactive

<br>

# User Registration Service

The User Registration Service is part of a NestJS application that handles user registration operations, including creating, retrieving, updating, and deleting user registrations. It also provides functionality to create both a user and their registration in a single operation.


## Endpoints

### 1. Create A User Registration
- **Endpoint** : Post `/registration/:userId`
- **Description** : Creates a new user registration.
- **Authorization-Header**: Required
- **Parameters:**
    - `userId`: string - The unique identifier of the user
    - `data`: CreateUserRegistrationDto - The data for creating the user registration
    - `headers`: object - The request headers


### 2. Return A User Registration
- **Endpoint** : Get `/registration/:userId/:applicationId`
- **Description** :Retrieves a user registration by user ID and application ID.
- **Authorization-Header**: Required
- **Parameters:**
    - `userId`: string - The unique identifier of the user
    - `applicationId`: string - The unique identifier of the application
    - `headers`: object - The request headers


### 3. Update A User Registration
- **Endpoint** : Patch `/registration/:userId/:applicationId`
- **Description** : Updates an existing user registration.
- **Authorization-Header**: Required
- **Parameters:**
    - `userId`: string - The unique identifier of the user
    - `applicationId`: string - The unique identifier of the application
    - `data`: UpdateUserRegistrationDto - The data to update the user registration
    - `headers`: object - The request headers


### 4. Delete A User Registration
- **Endpoint** : Delete `/registration/:userId/:applicationId`
- **Description** : Deletes a user registration.
- **Authorization-Header**: Required
- **Parameters:**
    - `usersId`: string - The unique identifier of the user
    - `applicationsId`: string - The unique identifier of the application
    - `headers`: object - The request headers


### 5. Create A User And User Registration
- **Endpoint** : Post `/registration/combined`
- **Description** : Creates both a user and their registration in a single operation.
- **Authorization-Header**: Required
- **Parameters:**
    - `userId`: string - The unique identifier for the new user
    - `data`: CreateUserAndUserRegistration - The data for creating both the user and their registration
    - `headers`: object - The request headers



## Authorization
All endpoints are protected by authorization headers which requires authorization and x-stencil-tenanid values to be passed in headers, which are verified using the `HeaderAuthService`.

## Error Handling

The service uses standard NestJS exceptions to handle errors:
- `UnauthorizedException`: Thrown when authorization fails.
- `BadRequestException`: Thrown when required parameters are missing or invalid.
- `InternalServerErrorException`: Thrown when a server error occurs during an operation.

## Response Format
All endpoints return a standardized response object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result
- `data`: The requested or manipulated data (when applicable)

