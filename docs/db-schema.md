## Schema of Service

The proposed schema which will act as the skeleton for the service.

### 1. `ApplicationOauthScope`

| Field             | Type     | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `id`              | String   | Primary Key (UUID)                              |
| `applicationsId`  | String   | Foreign Key referencing `Application`           |
| `createdAt`       | DateTime | Time when the scope was created                 |
| `updatedAt`       | DateTime | Time when the scope was last updated            |
| `name`            | String   | Name of the scope                               |
| `description`     | String   | Description of the scope                        |

### 2. `ApplicationRole`

| Field             | Type     | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `id`              | String   | Primary Key (UUID)                              |
| `applicationsId`  | String   | Foreign Key referencing `Application`           |
| `description`     | String?  | Description of the role                         |
| `createdAt`       | DateTime | Time when the role was created                  |
| `isDefault`       | Boolean  | Whether the role is default or not              |
| `isSuperRole`     | Boolean  | Whether it is an admin role                     |
| `updatedAt`       | DateTime | Time when the role was last updated             |
| `name`            | String   | Name of the role                                |

### 3. `Application`

| Field                     | Type     | Description                                |
| ------------------------- | -------- | ------------------------------------------ |
| `id`                      | String   | Primary Key (UUID)                         |
| `accessTokenSigningKeysId`| String?  | Foreign Key referencing `Key`              |
| `active`                  | Boolean  | Whether the application is active or not   |
| `data`                    | String   | Configurations of the application          |
| `idTokenSigningKeysId`    | String?  | Foreign Key referencing `Key`              |
| `createdAt`               | DateTime | Time when the application was created      |
| `updatedAt`               | DateTime | Time when the application was last updated |
| `name`                    | String   | Name of the application                    |
| `tenantId`                | String   | Foreign Key referencing `Tenant`           |
| `logo_uri`                | String?  | Application logo URI                       |

### 4. `GroupApplicationRole`

| Field             | Type   | Description                                     |
| ----------------- | ------ | ----------------------------------------------- |
| `id`              | String | Primary Key (UUID)                              |
| `applicationRolesId`| String| Foreign Key referencing `ApplicationRole`     |
| `groupsId`        | String | Foreign Key referencing `Group`                 |

### 5. `GroupMember`

| Field       | Type     | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| `id`        | String   | Primary Key (UUID)                              |
| `groupId`   | String   | Foreign Key referencing `Group`                 |
| `createdAt` | DateTime | Time when the user joined the group             |
| `userId`    | String   | Foreign Key referencing `User`                  |

### 6. `Group`

| Field     | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| `id`      | String   | Primary Key (UUID)                 |
| `createdAt`| DateTime| Time when the group was created    |
| `updatedAt`| DateTime| Time when the group was last updated|
| `name`    | String   | Name of the group                  |
| `tenantId`| String   | Foreign Key referencing `Tenant`   |

### 7. `Key`

| Field         | Type     | Description                                  |
| ------------- | -------- | -------------------------------------------- |
| `id`          | String   | Primary Key (UUID)                           |
| `algorithm`   | String?  | Algorithm used                               |
| `certificate` | String?  | Certificate of the key                       |
| `expiry`      | Int?     | Expiry time of the key                       |
| `createdAt`   | DateTime | Time when the key was created                |
| `issuer`      | String?  | Issuer of the key                            |
| `kid`         | String   | Key identifier (unique)                      |
| `updatedAt`   | DateTime | Time when the key was last updated           |
| `name`        | String   | Name of the key (unique)                     |
| `privateKey`  | String?  | Private key used to sign JWT/JWKS            |
| `publicKey`   | String?  | Public key used to sign JWT/JWKS             |
| `secret`      | String?  | Secret for the public/private key pair       |
| `type`        | String   | Type of the key                              |
| `data`        | String   | Additional data related to the key           |

### 8. `Tenant`

| Field                     | Type     | Description                                  |
| ------------------------- | -------- | -------------------------------------------- |
| `id`                      | String   | Primary Key (UUID)                           |
| `accessTokenSigningKeysId`| String   | Foreign Key referencing `Key`                |
| `data`                    | String?  | Configurations and extra settings of the tenant |
| `idTokenSigningKeysId`    | String   | Foreign Key referencing `Key`                |
| `createdAt`               | DateTime | Time when the tenant was created             |
| `updatedAt`               | DateTime | Time when the tenant was last updated        |
| `name`                    | String   | Name of the tenant (unique)                  |

### 9. `UserRegistration`

| Field            | Type     | Description                                     |
| ---------------- | -------- | ----------------------------------------------- |
| `id`             | String   | Primary Key (UUID)                              |
| `applicationsId` | String   | Foreign Key referencing `Application`           |
| `password`       | String   | Password of the user                            |
| `data`           | String?  | Additional data related to the registration     |
| `createdAt`      | DateTime | Time when the user was registered               |
| `lastLoginInstant`| DateTime?| Last login time of the user                    |
| `updatedAt`      | DateTime | Time when the registration was last updated     |
| `usersId`        | String   | Foreign Key referencing `User`                  |

### 10. `User`

| Field         | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| `id`          | String   | Primary Key (UUID)                 |
| `active`      | Boolean  | Whether the user is active or not  |
| `data`        | String   | Additional data of the user        |
| `expiry`      | Int?     | Expiry time of the user            |
| `createdAt`   | DateTime | Time when the user was created     |
| `updatedAt`   | DateTime | Time when the user was last updated|
| `tenantId`    | String   | Foreign Key referencing `Tenant`   |
| `email`       | String   | Email of the user (unique)         |