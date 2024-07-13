---
title: Tenants API Guide
description: A guide in my new Starlight docs site.
---

## Overview

- A Tenant is a named object that represents a discrete namespace for Users, Applications and Groups. A user is unique by email address or username within a tenant.
- Tenants may also be useful in a test or staging environment to allow multiple users to call APIs and create and modify users without possibility of collision.

## Endpoints

### 1. Create a Tenant with random id 
- **Endpoint** : Post `/tenant`
- **Description**: Creates a new tenant.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): A unique identifier for the tenant.
    - `data` (CreateTenantDto): An object containing tenant details.
    - `headers` (object): Request headers for authorization.
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/tenant \
  Authorization:"Bearer <your_access_token>" \
  id="<tenant_id>" \
  data:='{
    "name": "<tenant_name>",
    "description": "<tenant_description>"
  }'

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/tenant \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <your_access_token>" \
    -d '{
      "id": "<tenant_id>",
      "data": {
        "name": "<tenant_name>",
        "description": "<tenant_description>"
      }
    }'

### 2. Create a Tenant with given id 
- **Endpoint** : Post `/tenant/:id`
- **Description**: Creates a new tenant.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): A unique identifier for the tenant.
    - `data` (CreateTenantDto): An object containing tenant details.
    - `headers` (object): Request headers for authorization.
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/tenant/<id> \
  Authorization:"Bearer <your_access_token>" \
  data:='{
    "name": "<tenant_name>",
    "description": "<tenant_description>"
  }'

- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/tenant/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "data": {
      "name": "<tenant_name>",
      "description": "<tenant_description>"
    }
  }'


### 3. Update a Tenant 
- **Endpoint** : Patch `/tenant/:id
- **Description**: Updates an existing tenant.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): The identifier of the tenant to update.
    - `data` (UpdateTenantDto): An object containing updated tenant details.
    - `headers` (object): Request headers for authorization.
- **Sample HTTPie**:
  ```sh
  http PATCH http://localhost:3000/tenant/<id> \
  Authorization:"Bearer <your_access_token>" \
  data:='{
    "name": "<updated_name>",
    "description": "<updated_description>"
  }'

- **Sample cURL**:
  ```sh
  curl -X PATCH http://localhost:3000/tenant/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "data": {
      "name": "<updated_name>",
      "description": "<updated_description>"
    }
  }'


### 4. Delete a Tenant 
- **Endpoint** : Delete `/tenant/:id
- **Description**: Deletes an existing tenant.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): The identifier of the tenant to delete.
    - `headers` (object): Request headers for authorization.
- **Sample HTTPie**:
  ```sh
  http DELETE http://localhost:3000/tenant/<id> \
  Authorization:"Bearer <your_access_token>"

- **Sample cURL**:
  ```sh
  curl -X DELETE http://localhost:3000/tenant/<id> \
  -H "Authorization: Bearer <your_access_token>"


### 5. Return a Tenant 
- **Endpoint** : Get `/tenant/:id
- **Description**: Retrieves a tenant by ID.
- **Authorization-Header**: Required
- **Parameters**:
    - `id` (string): The identifier of the tenant to retrieve.
    - `headers` (object): Request headers for authorization.
- **Sample HTTPie**:
  ```sh
  http GET http://localhost:3000/tenant/<id> \
  Authorization:"Bearer <your_access_token>"

- **Sample cURL**:
  ```sh
  curl -X GET http://localhost:3000/tenant/<id> \
  -H "Authorization: Bearer <your_access_token>"


### 6. Return all Tenants
- **Endpoint** : Get `/tenant`
- **Description**: Retrieves all tenants.
- **Authorization-Header**: Required
- **Parameters**:
    - `headers` (object): Request headers for authorization.
- **Sample HTTPie**:
  ```sh
  http GET http://localhost:3000/tenant \
  Authorization:"Bearer <your_access_token>"

- **Sample cURL**:
  ```sh
  curl -X GET http://localhost:3000/tenant \
  -H "Authorization: Bearer <your_access_token>"



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
