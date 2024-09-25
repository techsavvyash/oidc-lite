# This is zolo to next developers

> [Node-oidc-provider](https://github.com/panva/node-oidc-provider/)

Read the above documentation and then implement the remaining functionalities.

## What is achieved till now:

1. Applications(& roles, scopes), Groups(& members), users, tenants, admin, api-keys, jwks, memory-monitory and their crud operations are implemented. Now we need to make `node-oidc-provider` use them to run the user flow.
2. In `node-oidc-provider` some partial `adapter` and `config.service` is created. The adapter Uses [Prisma Adapter](https://github.com/panva/node-oidc-provider/blob/main/example/adapters/contributed/prisma.ts) to do crud on the application, grant, session, interation etc. (see OidcModel Schema in `schema.prisma`).
3. `Account` class is based on this: [node-oidc-provider account](https://github.com/panva/node-oidc-provider/blob/main/example/support/account.js) this is used to find the users that are already created in our whole service. (Checking for password is not done till now).
4. Time to live for access token and refresh token is added.

## What is remaining:

- [ ] 1. Domain pinning or clientBasedCors
- [x] 2. Check whether the password is correct while `login`
- [x] 3. Jwks in the `oidc.config.service.ts`
- [x] 4. Creating our own `interactions` page and removing `devInteractions`
- [x] 5. Use sqlite instead of postgresql
- [x] 6. Correction kickstart.json
- [x] 7. Making sure the tests are up to date
- [x] 8a. Integration with minIO
- [x] 8b. Integration with oauth-2-proxy
- [x] 9. Removing any redundant code and cleanup and documentation updation
- [ ] 10. otp integration --> 2nd
- [ ] 11. remove dynamic imports of oidc-provider
- [x] 12. User Registration updation, creation after interaction ends
- [ ] 14. Complete updateUser in user.service.ts
- [x] 15. 100 users script
- [ ] 16. Dockerfile and Docker-compose


otp, dynamic

----
### These are my notes that I kept while trying to integrate the node-oidc-package

features.registration
    .devInteractions
    .introspection
    .jwtIntrospection
    .jwtUserinfo
    .registration -> intial and final access tokens, 
    .userinfo
    .resourceIndicators -> to set the scopes
clientBaseCors -> to check whether a given cors request should be allowed based on request's client (domain pinning) : this function is not getting called
extraParams -> `ctx.oidc.params` m available honge ye, will be passed to interaction session details
extraTokenClaims -> minio ki problem solve kr dega
adapter -> find -> clients
interactions.policy

renderError
ttl -> time to live for various things
user flows -> can be used after interactions are completed so that we can add user registration or if want save refreshTokens of a user

add refresh_token and access_token in response body for user_registration. Deprecated was removed

in findAccount check lastLoginInstant for user registration
idToken ka ttl?
registration will happen after getting consent - and where will it happen after consetless login

**frontend**
- signout reject k baad signout succes show krna. bhale hi signout na hua ho, frontend issue
- redirect_uri ka panga on ejs index.ejs
renderError page ki backchodi
- ejs me redict routes aur clientid dkh

**backend**
- logout_url??
- [how to skip these pages??](https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_consent.md): DONE
- policy claim in minio : DONE


**resource**
[oidc.github p kuch mila](https://authts.github.io/oidc-client-ts/interfaces/OidcClientSettings.html)


http://localhost:3001/oidc/auth?client_id=myminioadmin&redirect_uri=http%3A%2F%2F192.168.250.157%3A9001%2Foauth_callback&response_type=code&scope=offline_access+openid&state=eyJzdGF0ZSI6IlIxSkJTakZVUjBaRVNrOUdORUUwU1RGT1NGQllWbE5JVGpwbFJuZzJTRWwyU0VOYVoxUTBVWFV3VURWU1N6WXJNVVpJVnpaS1RWUklVMWhIYTNCc1VVWnBkM1ZuUFE9PSIsImlkcF9uYW1lIjoiXyJ9

domain pinning + non-consent screen + 
1. oauth + with consent and without consent : DONE
2. tenant + application crud : DONE
3. domain pinnig
4. oauth2 proxy and minio : DONE
5. pkce : DONE

- [x] ttl set krna h

**Presentation points**

fusionAuth kya h - very heavy to setup, show its docker compose, htop etc.
use case - generically use case on fusionAuth. isse utha k jo dali h humne. oidc compliant
Alternatives - keycloak and fusionauth both heavy, Auth0

User + UserRegistration updation either in findAccount or interaction end

Dockerfile and docker-compose

oauthproxy+Minio combined working

Multiple configure ho pae toh sorted h else make a simple app that uses google login and shows a page and make a button for oidc login to show consent screen
