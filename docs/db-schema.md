## Schema of Service 

The proposed schema which will act as the skeleton for the service.

- [DB Diagram](https://dbdiagram.io/d/OIDC-Wrapper-DB-Schema-665d7a3bb65d933879567dd2)

### 1. `application_oauth_scopes`

| Field             | Description                           |
| ----------------- | ------------------------------------- |
| `applications_id` | Application to which the scope belongs|
| `name`            | Name of the scope                     |
| `description`     | Description of the scope              |
| `created_at`      | Time when the scope was created       |
| `updated_at`      | Time when the scope was last updated  |

### 2. `application_roles`

| Field                 | Description                            |
| --------------------- | -------------------------------------- |
| `applications_id`     | Application to which the role belongs  |
| `description`         | Description of the role                |
| `is_default`          | Whether the role is default or not     |
| `is_super_role`       | Whether it is an admin role            |
| `name`                | Name of the role                       |
| `created_at`          | Time when the role was created         |
| `updated_at`          | Time when the role was last updated    |

### 3. `applications`

| Field                         | Description                                |
| ----------------------------- | ------------------------------------------ |
| `active`                      | Whether the application is in service or not |
| `data`                        | Configurations of the application          |
| `name`                        | Name of the application                    |
| `tenants_id`                  | Tenant to which the application belongs    |
| `created_at`                  | Time when the application was created      |
| `updated_at`                  | Time when the application was last updated |

### 4. `tenants`

| Field                          | Description                                |
| ------------------------------ | ------------------------------------------ |
| `access_token_signing_keys_id` | ID of the key used to sign access tokens   |
| `id_token_signing_keys_id`     | ID of the key used to sign identity tokens |
| `name`                         | Name of the tenant                         |
| `data`                         | Configurations and extra settings of the tenant |
| `created_at`                   | Time when the tenant was created           |
| `updated_at`                   | Time when the tenant was last updated      |

### 5. `user_registration`

| Field                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `applications_id`      | ID of the application                           |
| `authentication_token` | Token created while authenticating the user     |
| `password`             | Password of the user                            |
| `data`                 | Stores tokens and preferred languages           |
| `created_at`           | Time when the user was registered               |
| `last_login_instant`   | Last login time of the user                     |
| `updated_at`           | Time when the user registration was last updated|

### 6. `users`

| Field         | Description                        |
| ------------- | ---------------------------------- |
| `tenant_id`   | Tenant to which the user belongs   |
| `active`      | Whether the user is active or not  |
| `data`        | Extra data of the user             |
| `expiry`      | Expiry time of the user            |
| `created_at`  | Time when the user was created     |
| `updated_at`  | Time when the user was last updated|
| `email`       | Email of the user                  |

### 7. `keys/JWKS`

| Field         | Description                              |
| ------------- | ---------------------------------------- |
| `algorithm`   | Algorithm used                           |
| `certificate` | Certificate of the key                   |
| `issuer`      | The issuer of the key                    |
| `kid`         | Key identifier for JWKS                  |
| `private_key` | Private key used to sign the JWT/JWKS    |
| `public_key`  | Public key used to sign the JWT/JWKS     |
| `secret`      | Secret for the public/private key pair   |
| `created_at`  | Time when the key was created            |
| `updated_at`  | Time when the key was last updated       |

### 8. `groups`

| Field         | Description                        |
| ------------- | ---------------------------------- |
| `tenant_id`   | Tenant to which the group belongs  |
| `name`        | Name of the group                  |
| `created_at`  | Time when the group was created    |
| `updated_at`  | Time when the group was last updated|

### 9. `group_members`

| Field         | Description                                         |
| ------------- | --------------------------------------------------- |
| `user_id`     | ID of the user                                      |
| `group_id`    | ID of the group to which the user belongs           |
| `created_at`  | Time when the user joined the group                 |

### 10. `group_application_roles`

| Field                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `application_roles_id` | ID of the role which is assigned to a group     |
| `group_id`             | ID of the group to which a particular role belongs|

### 11. `refresh_tokens`

| Field             | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `id`              | ID of the entry                                        |
| `applications_id` | Application to which the token belongs                 |
| `expiry`          | Time when the refresh token expires                    |
| `data`            | Extra data of the refresh token                        |
| `created_at`      | Time when the refresh token was created                |
| `start_instant`   | Instant when the token was last refreshed/renewed      |
| `tenant_id`       | ID of the tenant to which this token belongs           |
| `token`           | Actual refresh token                                   |
| `token_hash`      | Hash of the token (currently not used)                 |
| `token_text`      | Text representation of the token (currently not used)  |
| `user_id`         | User to whom this refresh token belongs                |

### Additional Tables

#### `public_keys`

| Field         | Description                        |
| ------------- | ---------------------------------- |
| `application_id` | ID of the application              |
| `hostname`    | Hostname for the public key         |
| `public_key`  | Public key value                    |
| `created_at`  | Time when the public key was created|
| `updated_at`  | Time when the public key was updated|

#### `admin`

| Field         | Description                         |
| ------------- | ----------------------------------- |
| `username`    | Username of the admin               |
| `password`    | Password of the admin               |