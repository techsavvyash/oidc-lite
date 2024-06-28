# Tenant API

## Overview

- A Tenant is a named object that represents a discrete namespace for Users, Applications and Groups. A user is unique by email address or username within a tenant.
- Tenants may also be useful in a test or staging environment to allow multiple users to call APIs and create and modify users without possibility of collision.

## Endpoints

### 1. Create a Tenant

- **Description**: Creates a new tenant.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): A unique identifier for the tenant.
    - `data` (CreateTenantDto): An object containing tenant details.
    - `headers` (object): Request headers for authorization.

### 2. Update a Tenant

- **Description**: Updates an existing tenant.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): The identifier of the tenant to update.
    - `data` (UpdateTenantDto): An object containing updated tenant details.
    - `headers` (object): Request headers for authorization.

### 3. Delete a Tenant

- **Description**: Deletes an existing tenant.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): The identifier of the tenant to delete.
    - `headers` (object): Request headers for authorization.

### 4. Return a Tenant

- **Description**: Retrieves a tenant by ID.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): The identifier of the tenant to retrieve.
    - `headers` (object): Request headers for authorization.

### 5. Return all Tenants

- **Description**: Retrieves all tenants.
- **Authorization-Header**: Required
- **Parameters**:
    - `headers` (object): Request headers for authorization.

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
