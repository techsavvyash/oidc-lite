# Setting up OpenID Authentication using OIDC Lite for MinIO

*(THIS GUIDE IS STILL A WIP)*
This guide lays down steps to configure authentication for your min.io instance using OIDC Lite.

### A configuration example for a client

```json
{
  "jwtConfiguration": {
    "enabled": true,
    "timeToLiveInSeconds": 60,
    "refreshTokenExpirationPolicy": "SlidingWindow",
    "refreshTokenTimeToLiveInMinutes": 60,
    "refreshTokenUsagePolicy": "OneTimeUse"
  },
  "registrationConfiguration": {
    "type": "basic"
  },
  "oauthConfiguration": {
    "authorizedRedirectURLs": [
      "/admin/login"
    ],
    "clientId": "3c219e58-ed0e-4b18-ad48-f4f92793ae32",
    "clientSecret": "NTdlMGE5OTkwNWJlODA4ZjkyY2M0NjM4ZjhkYzUzMTIxZDRiMGQ2Y2VjZGVhMjQzZTBmZjIyZjUzNzg5YzhiZg==",
    "enabledGrants": [
      "authorization_code",
      "refresh_token"
    ],
    "logoutURL": "/admin/single-logout",
    "generateRefreshTokens": true,
    "clientAuthenticationPolicy": "Required",
    "proofKeyForCodeExchangePolicy": "Required"
  },
  "loginConfiguration": {
    "allowTokenRefresh": false,
    "generateRefreshTokens": false,
    "requireAuthentication": true
  },
  "unverified": {
    "behavior": "Allow"
  },
  "verificationStrategy": "ClickableLink",
  "state": "Active"
}
```