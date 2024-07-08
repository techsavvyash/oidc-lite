# Group API

- A Group is a named object that optionally contains one to many Application Roles.
- This service provides endpoints for managing groups within a multi-tenant system. It uses NestJS and Prisma for database operations.



## Endpoints

### 1. Create Group with random Id 
- **Endpoint** : Post `/group`
- **Description**: This API is used to create a new Group.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id for the new group
  - `data`: Object containing group details (name, tenantId, roleIDs)
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/group \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <your_access_token>" \
    -d '{
      "name": "<group_name>",
      "tenantId": "<tenant_id>",
      "roleIDs": ["<role_id1>", "<role_id2>"]
    }'

- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/group \
  Authorization:"Bearer <your_access_token>" \
  name="<group_name>" \
  tenantId="<tenant_id>" \
  roleIDs:='["<role_id1>", "<role_id2>"]'

### 2. Create Group with given Id 
- **Endpoint** : Post `/group/:id`
- **Description**: This API is used to create a new Group.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id for the new group
  - `data`: Object containing group details (name, tenantId, roleIDs)
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/group/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "name": "<group_name>",
    "tenantId": "<tenant_id>",
    "roleIDs": ["<role_id1>", "<role_id2>"]
  }'

- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/group/<id> \
  Authorization:"Bearer <your_access_token>" \
  name="<group_name>" \
  tenantId="<tenant_id>" \
  roleIDs:='["<role_id1>", "<role_id2>"]'


### 3. Retrieve All Groups
- **Endpoint** : Get `/group`
- **Description**: This API is used to retrieve all of the configured Groups.
- **Authorization-Header**: Required
- **Sample cURL**:
  ```sh
  curl -X GET http://localhost:3000/group \
  -H "Authorization: Bearer <your_access_token>"


- **Sample HTTPie**:
  ```sh
  http GET http://localhost:3000/group \
  Authorization:"Bearer <your_access_token>"


### 4. Retrieve Group by ID
- **Endpoint** : Get `/group/:id`
- **Description**: This API is used to retrieve a single Group by unique Id among the configured Groups.
- **Authorization-Header**: Required
- **Parameters**: 
  - `id`: The unique id of the group
- **Sample cURL**:
  ```sh
  curl -X GET http://localhost:3000/group/<id> \
  -H "Authorization: Bearer <your_access_token>"


- **Sample HTTPie**:
  ```sh
  http GET http://localhost:3000/group/<id> \
  Authorization:"Bearer <your_access_token>"


### 5. Update Group
- **Endpoint** : Put `/group/:id`
- **Description**: This API is used to update an existing Group.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the group
  - `data`: Object containing update information (name, roleIDs)
- **Sample cURL**:
  ```sh
  curl -X PUT http://localhost:3000/group/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "name": "<updated_group_name>",
    "roleIDs": ["<updated_role_id1>", "<updated_role_id2>"]
  }'

- **Sample HTTPie**:
  ```sh
  http PUT http://localhost:3000/group/<id> \
  Authorization:"Bearer <your_access_token>" \
  name="<updated_group_name>" \
  roleIDs:='["<updated_role_id1>", "<updated_role_id2>"]'


### 6. Delete Group
- **Endpoint** : Delete `/group/:id`
- **Description**: This API is used to permanently delete a Group
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the group
- **Sample cURL**:
  ```sh
  curl -X DELETE http://localhost:3000/group/<id> \
  -H "Authorization: Bearer <your_access_token>"


- **Sample HTTPie**:
  ```sh
  http DELETE http://localhost:3000/group/<id> \
  Authorization:"Bearer <your_access_token>"


## Authorization
All endpoints are protected by authorization headers which requires authorization and x-stencil-tenanid values to be passed in headers, which are verified using the `HeaderAuthService`.

## Error Handling
The service includes comprehensive error handling, throwing appropriate exceptions for various scenarios such as unauthorized access, bad requests, or when required data is missing.

## Response Format
All endpoints return a standardized `ResponseDto` object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result
- `data`: The requested or manipulated data (when applicable)

<br>

# Group User API

This service manages the relationship between users and groups within a multi-tenant system. It uses NestJS and Prisma for database operations.

## Endpoints

### 1. Add User to Group
- **Endpoint** : Post `/group/member`
- **Description**: This API is used to add Users to a Group. A User that is added to a Group is called a member, a user can belong to one to many Groups.
- **Authorization-Header**: Required
- **Body**: 
  - `members`: Array of objects containing `groupId` and `userIds`
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/group/member \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "members": [
      {
        "groupId": "<group_id>",
        "userIds": ["<user_id1>", "<user_id2>"]
      }
    ]
  }'
- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/group/member \
  Authorization:"Bearer <your_access_token>" \
  members:='[
    {
      "groupId": "<group_id>",
      "userIds": ["<user_id1>", "<user_id2>"]
    }
  ]'


### 2. Update User in Group
- **Endpoint** : Put `/group/member`
- **Description**: Updates user memberships in groups (Note: Implementation details are not fully provided in the given code).
- **Authorization-Header**: Required
- **Sample cURL**:
  ```sh
  curl -X PUT http://localhost:3000/group/member \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "members": [
      {
        "groupId": "<group_id>",
        "userIds": ["<updated_user_id1>", "<updated_user_id2>"]
      }
    ]
  }'


- **Sample HTTPie**:
  ```sh
  http PUT http://localhost:3000/group/member \
  Authorization:"Bearer <your_access_token>" \
  members:='[
    {
      "groupId": "<group_id>",
      "userIds": ["<updated_user_id1>", "<updated_user_id2>"]
    }
  ]'


### 3. Delete Member by ID
- **Endpoint** : Delete `/group/member/:id`
- **Description**: Removes a specific member from a group using the membership ID.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique identifier of the group membership
- **Sample cURL**:
  ```sh
  curl -X DELETE http://localhost:3000/group/member/<id> \
  -H "Authorization: Bearer <your-token>" \
  -H "x-stencil-tenanid: <your-tenant-id>"



- **Sample HTTPie**:
  ```sh
  http DELETE http://localhost:3000/group/member/<id> \
  Authorization:"Bearer <your-token>" \
  x-stencil-tenanid:<your-tenant-id>



### 4. Delete Member by User ID and Group ID
- **Endpoint** : Delete `/group/member`
- **Description**: Removes a user from a specific group using user ID and group ID.
- **Authorization-Header**: Required
- **Parameters**: 
  - `userId`: The ID of the user
  - `gpId`: The ID of the group
- **Sample cURL**:
  ```sh
  curl -X DELETE http://localhost:3000/group/member \
    -H "Authorization: Bearer <your-token>" \
    -H "x-stencil-tenanid: <your-tenant-id>" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "user-id-1",
      "gpId": "group-id-1"
    }'


- **Sample HTTPie**:
  ```sh
  http DELETE http://localhost:3000/group/member \
    Authorization:"Bearer <your-token>" \
    x-stencil-tenanid:<your-tenant-id> \
    userId=user-id-1 \
    gpId=group-id-1


### 5. Delete All Users from Group
- **Endpoint** : Delete `/group/member`
- **Description**: Removes all users from a specified group.
- **Authorization-Header**: Required
- **Parameters**: 
  - `gpId`: The ID of the group
- **Sample cURL**:
  ```sh
  curl -X DELETE http://localhost:3000/group/member \
    -H "Authorization: Bearer <your-token>" \
    -H "x-stencil-tenanid: <your-tenant-id>" \
    -H "Content-Type: application/json" \
    -d '{
      "gpId": "group-id-1"
    }'


- **Sample HTTPie**:
  ```sh
    http DELETE http://localhost:3000/group/member \
      Authorization:"Bearer <your-token>" \
      x-stencil-tenanid:<your-tenant-id> \
      gpId=group-id-1

### 6. Delete Multiple Members
- **Endpoint** : Delete `/group/member`
- **Description**: Removes multiple members from their respective groups.
- **Authorization-Header**: Required
- **Body**: 
  - `members`: Array of membership IDs to be deleted
- **Sample cURL**:
  ```sh
  curl -X DELETE http://localhost:3000/group/member \
    -H "Authorization: Bearer <your-token>" \
    -H "x-stencil-tenanid: <your-tenant-id>" \
    -H "Content-Type: application/json" \
    -d '{
      "members": ["membership-id-1", "membership-id-2"]
    }'


- **Sample HTTPie**:
  ```sh
  http DELETE http://localhost:3000/group/member \
    Authorization:"Bearer <your-token>" \
    x-stencil-tenanid:<your-tenant-id> \
    members:='["membership-id-1", "membership-id-2"]'


## Authorization
All endpoints are protected by authorization headers which requires authorization and x-stencil-tenanid values to be passed in headers, which are verified using the `HeaderAuthService`.

## Error Handling
The service includes comprehensive error handling, throwing appropriate exceptions for various scenarios such as unauthorized access, bad requests, or when required data is missing.

## Response Format
All endpoints return a standardized `ResponseDto` object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result
- `data`: The requested or manipulated data (when applicable)

