## Schema of Service 
The proposed schema which will act as skeleton for the service.
- [DB Diagram](https://dbdiagram.io/d/OIDC-Wrapper-DB-Schema-665d7a3bb65d933879567dd2)

### 1. `application_oauth_scopes`

| Field             | Description                           |
| ----------------- | ------------------------------------- |
| `applications_id` | Application to which the scope belong |
| `name`            | Name of the scope                     |

### 2. `application_roles`

| Field                         | Description                             |
| ----------------------------- | --------------------------------------- |
| `applications_id`             | application to which the scope belong   |
| `description`                 | description of the role                 |
| `is_default`                  | whether the role is default or not      |
| `is_super_role`               | whether it is admin role                |
| `name`                        | name of the role                        |
| `description`                 | about the role                          |
| `application_oauth_scopes_id` | the scopes allowed to a particular role |

### 3. `applications`

| Field                 | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `active`              | in service or not                                     |
| `data`                | configurations of application                         |
| `name`                | name of application                                   |
| `tenants_id`          | tenant it is using                                    |
| `templates_link_json` | contains the link of various templates in json format |

### 4. `tenants`

| Field                          | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `access_token_signing_keys_id` | id of key used to sign the access tokens    |
| `id_token_signing_keys_id`     | id of key used to sign identity tokens      |
| `name`                         | name of tenant                              |
| `data`                         | configurations and extra settings of tenant |
### 5. `user_registration`

| Field                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `applications_id`      | application id                                  |
| `authentication_token` | the token created while authenticating the user |
| `data`                 | stores tokens and preferred languages           |

### 6. `users`

| Field        | Description                   |
| ------------ | ----------------------------- |
| `tenants_id` | tenant to which it belongs to |
| `groups_id`  | groups to which it belongs to |
  
### 7.`keys/JWKS`

| Field         | Description                              |
| ------------- | ---------------------                    |
| `algorithm`   | algorithm used                           |
| `certificate` | certificate of key                       |
| `issuer`      | the issuer(we) of key                    |
| `kid`         | key identifier for JWKS                  |
| `private_key` | private key used to sign the JWT/JWKS    |
| `public_key`  | private key used to sign the JWT/JWKS    |
| `secret`      | secret for the public/private key pair   |

### 8. `groups`

| Field        | Description        |
| ------------ | ------------------ |
| `tenants_id` | tenant it is using |

### 9. `group_members`

| Field       | Description                                         |
| ----------- | --------------------------------------------------- |
| `users_id`  | id of user                                          |
| `groups_id` | id of group to which the particular user belongs to |


### 10. `group_application_roles`

| Field                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `application_roles_id` | the role which is placed in a group             |
| `groups_id`            | the group to which a particular role belongs to |


### 11. `refresh_tokens`

| Field             | Description                                            |
| ----------------- | -------------------------------------------------------|
| `id`              |      id of the entry                                   |
| `applications_id` |      application of the id to which this belongs       |
| `expiry`          |      time when the refresh token expires               |
| `data`            |      self explanatory                                  |
| `created_at`      |      self explanatory                                  |
| `start_instant`   |      instant when the token was last refreshed/renewed |
| `tenants_id`      |      id of the tenant this token belongs to            |
| `token`           |      actual token                                      |
| `token_hash`      |                                                        |
| `token_text`      |                                                        |
| `users_id`        |                                                        |

