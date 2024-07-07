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

### 2. Create Group with given Id 
- **Endpoint** : Post `/group/:id`
- **Description**: This API is used to create a new Group.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id for the new group
  - `data`: Object containing group details (name, tenantId, roleIDs)

### 3. Retrieve All Groups
- **Endpoint** : Get `/group`
- **Description**: This API is used to retrieve all of the configured Groups.
- **Authorization-Header**: Required

### 4. Retrieve Group by ID
- **Endpoint** : Get `/group/:id`
- **Description**: This API is used to retrieve a single Group by unique Id among the configured Groups.
- **Authorization-Header**: Required
- **Parameters**: 
  - `id`: The unique id of the group

### 5. Update Group
- **Endpoint** : Put `/group/:id`
- **Description**: This API is used to update an existing Group.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the group
  - `data`: Object containing update information (name, roleIDs)

### 6. Delete Group
- **Endpoint** : Delete `/group/:id`
- **Description**: This API is used to permanently delete a Group
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique id of the group

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

### 2. Update User in Group
- **Endpoint** : Put `/group/member`
- **Description**: Updates user memberships in groups (Note: Implementation details are not fully provided in the given code).
- **Authorization-Header**: Required

### 3. Delete Member by ID
- **Endpoint** : Delete `/group/member/:id`
- **Description**: Removes a specific member from a group using the membership ID.
- **Authorization-Header**: Required
- **Parameters**: 
  - `uuid`: The unique identifier of the group membership

### 4. Delete Member by User ID and Group ID
- **Endpoint** : Delete `/group/member`
- **Description**: Removes a user from a specific group using user ID and group ID.
- **Authorization-Header**: Required
- **Parameters**: 
  - `userId`: The ID of the user
  - `gpId`: The ID of the group

### 5. Delete All Users from Group
- **Endpoint** : Delete `/group/member`
- **Description**: Removes all users from a specified group.
- **Authorization-Header**: Required
- **Parameters**: 
  - `gpId`: The ID of the group

### 6. Delete Multiple Members
- **Endpoint** : Delete `/group/member`
- **Description**: Removes multiple members from their respective groups.
- **Authorization-Header**: Required
- **Body**: 
  - `members`: Array of membership IDs to be deleted

## Authorization
All endpoints are protected by authorization headers which requires authorization and x-stencil-tenanid values to be passed in headers, which are verified using the `HeaderAuthService`.

## Error Handling
The service includes comprehensive error handling, throwing appropriate exceptions for various scenarios such as unauthorized access, bad requests, or when required data is missing.

## Response Format
All endpoints return a standardized `ResponseDto` object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result
- `data`: The requested or manipulated data (when applicable)

