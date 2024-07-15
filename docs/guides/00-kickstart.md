## What is Kickstart.json ?

When starting the service for the first time, you will be required to provide a `kickstart.json` to seed the data into sqlite and startup the service. An example `kickstart.json` is provided with this service.
We will now go through what does it contain.

```
type kickstart = {
    variables: Record<string,string>,
    apiKey: {
        key: string
        description: string
    },
    requests: Requests[]
}
type Requests = {
    method: Methods,
    url: "string",
    headers?: {
        x-stencil-tenantid: string,
        authorization: string,
    }
    body: any
}
enum Methods {
    POST = "POST",
    GET = "GET",
    PATCH = "PATCH",
    DELETE = "DELETE"
}
```

- `Variables` are the keys whose values you can use in the kickstart json. For example one of the variables is `"apiKeyValue": "master"`. Now you can use this variable to replace it with its value in `key: "#{apiKeyValue}"`. This will make `key: "master"`.
  <br />
- `#{UUID()}` can be used to generate a random uuid in the `kickstart.json`
  <br />
- `apiKey` is used to create a master key, with `keyManager: true`, `permissions: null` and `tenant: null`. This authentication key can be used to access any route on the service. This will also be used to create new `tenant`.
  <br />
- You can either create provide a `POST /admin` request in kickstart to create `one and only` admin. Or send a request using `curl/postman` to `POST /admin` with `{username,password}` to create one.
  <br />
- `requests` array contains all the requests to be made to the server to seed the dummy data. Each request have a different `body` type. All the requests except `POST /admin` require headers -> `{'x-stencil-tenantid': some-tenant-id,'authorization': apiKeyValue}`
  <br />

Here is a dummy `kickstart.json`

```
{
  "variables": {
    "apiKeyValue": "master",
    "jwksKeyId": "#{UUID()}",
    "applicationId": "myminioadmin",
    "clientSecret": "minio-secret-key-change-me",
    "tenantId": "minio-tenant",
    "roleId": "adminRoleId",
    "groupId": "agroup",
    "adminUsername": "admin",
    "adminPassword": "adminPassword12#",
    "userEmail": "user@email.com",
    "userPassword": "userPassword12#"
  },
  "apiKey": {
    "key": "#{apiKeyValue}",
    "description": "Unrestricted API key"
  },
  "requests": [
    {
      "method": "POST",
      "url": "/admin",
      "body": {
        "password": "#{adminPassword}",
        "username": "#{adminUsername}"
      }
    },
    {
      "method": "POST",
      "url": "/key/generate/#{jwksKeyId}",
      "headers": {
        "x-stencil-tenantid": "#{tenantId}",
        "authorization": "#{apiKeyValue}"
      },
      "body": {
        "key": {
          "algorithm": "RS256",
          "issuer": "Stencil Service",
          "name": "First jwks"
        }
      }
    },
    {
      "method": "POST",
      "url": "/tenant/#{tenantId}",
      "headers": {
        "x-stencil-tenantid": "#{tenantId}",
        "authorization": "#{apiKeyValue}"
      },
      "body": {
        "data": {
          "name": "First tenant",
          "jwtConfiguration": {
            "accessTokenSigningKeysID": "#{jwksKeyId}",
            "refreshTokenTimeToLiveInMinutes": 3600,
            "timeToLiveInSeconds": 60,
            "idTokenSigningKeysID": "#{jwksKeyId}"
          }
        }
      }
    },
    {
      "method": "POST",
      "url": "/application/#{applicationId}",
      "headers": {
        "x-stencil-tenantid": "#{tenantId}",
        "authorization": "#{apiKeyValue}"
      },
      "body": {
        "data": {
          "active": true,
          "name": "First Stencil application",
          "scopes": [
            {
              "name": "offline_access",
              "defaultConsentDetail": "Required for getting access token",
              "defaultConsentMessage": "Perform actions from your behalf",
              "required": false
            },
            {
              "name": "profile",
              "defaultConsentDetail": "Your username, firstname and lastname will be shared",
              "defaultConsentMessage": "Access to your profile data",
              "required": false
            },
            {
              "name": "email",
              "defaultConsentDetail": "Your email will be shared",
              "defaultConsentMessage": "Access to your email",
              "required": false
            }
          ],
          "roles": [
            {
              "name": "Admin",
              "description": "This is admin role",
              "isDefault": false,
              "isSuperRole": true,
              "id": "#{roleId}"
            },
            {
              "name": "user",
              "description": "This is user role",
              "isDefault": true,
              "isSuperRole": false
            }
          ],
          "oauthConfiguration": {
            "authorizedOriginURLs": [
              "*",
              "https://strong-chairs-fall.loca.lt",
              "https://jl4spt7t-3000.inc1.devtunnels.ms/"
            ],
            "authorizedRedirectURLs": [
              "http://localhost:9001/oauth_callback",
              "http://192.168.233.157:9001/oauth_callback",
              "http://localhost:4180/oauth2/callback"
            ],
            "clientSecret": "#{clientSecret}",
            "enabledGrants": ["authorization_code", "password"],
            "logoutURL": "http://localhost:3000/logout"
          }
        }
      }
    },
    {
      "method": "POST",
      "url": "/group/#{groupId}",
      "headers": {
        "authorization": "#{apiKeyValue}",
        "x-stencil-tenantid": "#{tenantId}"
      },
      "body": {
        "group": {
          "name": "Admin group",
          "roleIDs": ["#{roleId}"]
        }
      }
    },
    {
      "method": "POST",
      "url": "/user/registration/combined/",
      "headers": {
        "x-stencil-tenantid": "#{tenantId}",
        "authorization": "#{apiKeyValue}"
      },
      "body": {
        "data": {
          "userInfo": {
            "active": true,
            "applicationId": "#{applicationId}",
            "membership": ["#{groupId}"],
            "userData": {
              "username": "AdminUser",
              "password": "#{userPassword}"
            },
            "email": "#{userEmail}"
          },
          "registrationInfo": {
            "generateAuthenticationToken": true,
            "applicationId": "#{applicationId}",
            "roles": ["user"]
          }
        }
      }
    }
  ]
}
```
