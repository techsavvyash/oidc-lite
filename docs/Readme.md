# Auth Service

## Overview

OIDC lite is a OIDC compliant light weight alternative to FusionAuth supporting multi-tenant authentication.

*Note: Authorization (using OPA), Social Login (e.g., Google, Facebook), Single Sign-On (SSO) coming soon!* 


## Features

- OIDC Compliant
- Negligible memory footprint (uses ~117 MB for registering 100 users).
- Lightweight 
- Multi-tenant 

## Index

### DB Schema

The database schema for this service has been borrowed and fine-tuned from FusionAuth schema.
1. [DB Diagram](https://dbdiagram.io/d/OIDC-Wrapper-DB-Schema-665d7a3bb65d933879567dd2)
2. [Schema Documentation](./db-schema.md)

### API Documentation

- [Key APIs](./api/keys.md).
- [Refresh Tokens APIs](./api/refresh-tokens.md).
- [Tenants](./api/tenants.md)
- [Application](./api/applications.md)
- [Groups APIs](./api/groups.md) 
- [Users](./api/users.md) 
- [OTP](./api/OTP.md)

### Guides

The guides section contains documentation on of the use cases of OIDC Lite and how to configure them to provide the user with a better idea of the capabilities of this service and also to provide a better idea on how to integrate this in your own service. Read more [here](./guides/README.md)









