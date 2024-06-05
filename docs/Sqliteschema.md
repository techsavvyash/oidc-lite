The proposed schema which will act as skeleton for the service

### application_oauth_scopes
`applications_id` - application to which the scope belong
`name` - name of the scope

### application_roles
`applications_id` - 
`description` - 
`is_default` - whether the role is default or not
`is_super_role` - whether it is admin role
`name` - name of the role
`description` - about the role
`application_oauth_scopes_id` - the scopes allowed to a particular role

### applications
`active` - in service or not
`data` - configurations of application
`name` - name of application
`tenants_id` - tenant it is using
`templates_link_json` - contains the link of various templates in json format

### tenants
`access_token_signing_keys_id` - id of key used to sign the access tokens
`id_token_signing_keys_id` - id of key used to sign identity tokens
`name` - name of tenant
`data` - configurations and extra settings of tenant

### user_registration
`applications_id` - application id
`authentication_token` - the token created while authenticating the user
`data` - stores tokens and preferred languages

### users
`tenants_id` - tenant to which it belongs to
`groups_id` - groups to which it belongs to

### keys / jwks
`algorithm` - algo used
`certificate` - certificate of key
`issuer` - the issuer(we) of key
`kid`
`private_key`
`public_key`
`secret`

### groups
`tenants_id` - tenant it is using

### group_members
`users_id` - id of user
`groups_id` - id of group to which the particular user belongs to

## group_application_roles
`application_roles_id` - the role which is placed in a group
`groups_id` - the group to which a particular role belongs to

## REQUIRED -
 1. `application_oauth-scopes`, 
 2. `application roles`, 
 3. `applications [active,data/config, name, tenants_id, templates_link_json]`,
 4. ` authentication_keys`,
 5.  `groups / roles` (id,permissions,name) and `users` will have an optional group field, can handle permissions for both users and organizations(entities), and tenants/settings in a setting attribute containing(id_token_sign_key, access_token_sign_key)
 6.  `user` (expiry,data -> json,groupid->array)
 7.  `refresh_tokens`
 8.  `keys`
 9.  
   
### Notes


## NOT REQUIRED - 
application_daily/monthly_active_users, audit logs (we will be using telemetry logs)
1. `identities`
## RESEARCH REQUIRED - 
1. `families`
  these are focussed more on familial relationships like parent and child. Inclued management features like parental controls. Unlike groups emphazise roles and permissions allowing buld assignment of access rights and roles to users.
2. `entity_entity_grant`
3. `form_fields`
    used with `forms` and `form_steps` to create a custom form field for taking inputs. `forms` are customizable objects that consists of many `form_steps` which in turn contains `form_fields`
4. `entity_type_permissions`
5. `connectors`
    just like identity providers they can be used to connect fusionauth to an external system of record for user identity.
6. `user_actions`
   User Actions in FusionAuth are ways to interact with, reward, and discipline users. For example, you could use them to email a user, call another application when a user does something, or temporarily disable a user’s login.
7. `consents`
    Consent is a definition of a permission that can be given to a User. Can't find the difference b/w this and grants`


