# Auth Service

## Overview

Many organizations are transitioning to use FusionAuth instead of OAuth 2.0 due to its extensive range of services beyond standard OAuth 2.0 functionalities. Key services provided by FusionAuth include:

### Comprehensive IAM Platform

- **Authentication**: Password-based authentication, social login (e.g., Google, Facebook), Single Sign-On (SSO)
- **Authorization**: Role-based access control (RBAC)
- **User Management**:
  - User registration and profile management
  - Password recovery and account management

...and many more.

## What Does This Auth Service Do

This auth service is essentially a lightweight version of FusionAuth, providing essential functionalities such as:

- **Authentication**
- **Authorization**
- **User Management**
- **Application Management**
- **Memory Management**

## Issues Resolved by This Auth Service

This auth service addresses memory management issues, effectively managing resources even when registering a large number of users (e.g., using 117 MB for registering 100 users).

## Key Features

- **Key APIs**: Used to manage cryptographic keys for authentication. For more details, refer to the [Key-API documentation](key-api-readme.md).
- **Refresh Tokens APIs**: Used to perform CRUD operations on access tokens and JWT. For more details, refer to the [Refresh Token documentation](refreshToken.md).
- **Groups APIs**: Used to organize users into groups. For more details, refer to the [Group APIs documentation](Group.md).
- **Tenants**: Named objects representing discrete namespaces for Users, Applications, and Groups. For more details, refer to the [Tenant documentation](Tenants.md).

## Application and Significance

- Comprehensive user management
- Efficient memory utilization
- Streamlined authentication and authorization processes
- Simplified application management

This service is designed to offer a balance of necessary features from FusionAuth while ensuring efficient resource management, making it suitable for applications with focused user and application management needs.
