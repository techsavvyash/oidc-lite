#!/bin/bash

# Base URL
BASE_URL="http://localhost:3001/user/registration/combined/"

# Function to generate a random string
generate_random_string() {
  local length=$1
  tr -dc A-Za-z0-9 </dev/urandom | head -c $length
}

# Loop to create 100 users
for i in {1..100}; do
  # Generate random username, password, and email
  USERNAME="user$(generate_random_string 6)"
  PASSWORD=$(generate_random_string 12)
  EMAIL="${USERNAME}@example.com"

  # Create JSON payload
  JSON_PAYLOAD=$(cat <<EOF
{
  "data": {
    "userInfo": {
      "active": true,
      "applicationId": "myminioadmin",
      "membership": [],
      "userData": {
        "username": "$USERNAME",
        "password": "$PASSWORD"
      },
      "email": "$EMAIL"
    },
    "registrationInfo": {
      "generateAuthenticationToken": true,
      "applicationId": "myminioadmin"
    }
  }
}
EOF
)

  # Send curl request
  curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "x-stencil-tenantid: minio-tenant" \
    -H "authorization: master" \
    -d "$JSON_PAYLOAD"

  echo "Created user $i: $USERNAME with email $EMAIL"
done
