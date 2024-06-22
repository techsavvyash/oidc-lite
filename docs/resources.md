[Intro to oidc-provider](https://www.scottbrady91.com/openid-connect/getting-started-with-oidc-provider) the basic stepping stone to practically understand oidc

[Fusion Auth full Schema](https://dbdiagram.io/d/66588635b65d9338791a13ab) the actual db schema of fusionauth

[Schema from fusion auth ui](https://fusionauth.io/docs/get-started/core-concepts/users) the schema from fusion auth ui

[Fusion Auth tokens](https://fusionauth.io/docs/lifecycle/authenticate-users/oauth/tokens#client-credentials-access-token) read about tokens on fusionauth

[OAuth login flow using authorization code](https://fusionauth.io/articles/login-authentication-workflows/webapp/oauth-authorization-code-grant-jwts-refresh-tokens-cookies) how the authorization flow will look like

[Getting deep into oidc](https://connect2id.com/learn/openid-connect#token-endpoint) (advanced oidc)

## A configuration example for a client
```
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
