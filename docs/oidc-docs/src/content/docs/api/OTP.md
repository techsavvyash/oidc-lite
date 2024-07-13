---
title: OTP Service Guide
description: A guide in my new Starlight docs site.
---

The OTP (One-Time Password) Service is part of a NestJS application that handles the generation, sending, and validation of one-time passwords. It supports multiple delivery methods including email, SMS, and WhatsApp.

## Endpoints

### 1. SendOtp
- **Endpoint** : Post `/otp/send`
- **Description** : Generates and sends an OTP via specified channels.
- **Parameters:**
    - `type`: string[] - An array of delivery methods ('mail', 'sms', 'whatsapp')
    - `to`: string - The recipient's address (email, phone number, etc.)
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/otp/send \
  -H "Authorization: Bearer dummy_token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": ["mail", "sms"],
    "to": "example@example.com"
  }'

- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/otp/send \
  Authorization:"Bearer dummy_token" \
  type:='["mail", "sms"]' \
  to="example@example.com"



### 2. ValidateOtp
- **Endpoint** : Post `/otp/verify`
- **Description** : Validates a given OTP.
- **Parameters:**
-   `otp`: string - The OTP to validate
- **Sample cURL**:
  ```sh
  curl -X POST http://localhost:3000/otp/verify \
  -H "Authorization: Bearer dummy_token" \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456"
  }'


- **Sample HTTPie**:
  ```sh
  http POST http://localhost:3000/otp/verify \
  Authorization:"Bearer dummy_token" \
  otp="123456"





## Response Format
All endpoints return a standardized response object containing:
- `success`: Boolean indicating operation success
- `message`: Descriptive message about the operation result

## Error Handling
The service includes comprehensive error handling, throwing appropriate HTTP exceptions for various scenarios such as unauthorized access, bad requests, or internal server errors.