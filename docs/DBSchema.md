This doc contains some of the useful schemas obtained from fusionauth

## application_daily_active_users, application_monthly_active_users
`applications_id`, `count`: no of users, `day/month`

## application_registration_count
stores the count of users registered on each application
`applications_id`, `count`, `decrement_count`, `hour`

## application_roles
stores all the roles created in each application
`id`, `applications_id`, `description`, `insert_instant` (created at), `is_default`, `is_super_role`, `lastUpdated`, `name`

## applications
all the created/registered applications on fusionauth
`id`, `access_token_populate_lamdas_id`, (lamda functions are used to customize the content of the access token during the token generation process) `access_token_signing_keys_id`, `active`, `admin_regis_form_id`, `data` (configuration of app), `id_token_signing_keys_id`, `name`, `tenants_id`, `daily_active_users`, `app_oauth_scopes`, `app_roles`, `refresh_tokens`, `tenant`, `some lamdas attributes` ???

## asynchronous_tasks 
`id`,`data`,`entity_id`,`status`,`node_id`,`type`

## audit logs
used for storing logs
`createdAt`, `insert_user` (which user caused log insertion), `messageInserted`, `data` (containing reason like FusionAuth User Interface)

## authentication keys 
`ip_access_control_lists_id`, `key_manager`, `key_value`, `permissions` (different get,post,update permissions on the routes) `metadata`

## breached_password_metrics
holds data about password breaches in each tenant
`tenant`, `password_checked`, `matched_password_count`

## common_breached_password
all passwords breached

## connectors
`data`, `name`, `ssl_certificate_keys_id`

## connectors_tenants
`connectors_id`, `data`, `sequence`, `tenants_id`

## entities
suppose like github having organizations, they are entities
`client_id`, `client_secret`, `data`, `entity_types_id`, `name`, `entities`, `entity_entity_grants`, `entity_user_grants`

## global_daily/monthly/registration_counts

## groups
all the created groups
`name`, `group_application_roles`, `group_members`

## group_application_roles
group a set of application_roles
`application_roles_id`, `groups_id`, `application_role`

## group_members
users present in a group
`id`, `groups_id`, 

## refresh_tokens
`applications_id`, `tenants_id`, `token`, `token_hash`, `users_id`

## tenants
holds everything related to a particular group of users, applications
`access_token_signing_keys_id`, `id_token_signing_keys_id`, 

## users
`isactive`, `dob`,`tenants_id`, `entity_user_grants` (fk), `families` (fk), `refresh_tokens` (fk), 