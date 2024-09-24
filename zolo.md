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
- [x] 4a. Creating our own `interactions` page and removing `devInteractions`
- [ ] 4b. removing `renderError` with our own
- [x] 5. Use sqlite instead of postgresql
- [ ] 6a. Correction kickstart.json
- [ ] 6b. Parse payload of oidcModel since prisma using. search on github for the issue ticket
- [ ] 7. Making sure the tests are up to date
- [ ] 8a. Integration with minIO
- [x] 8b. Integration with oauth-2-proxy
- [ ] 9. Removing any redundant code and cleanup and documentation updation
- [ ] 10. otp integration
- [ ] 11. remove dynamic imports of oidc-provider
- [ ] 12. integrating with our custom code


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
clientBaseCors -> to check whether a given cors request should be allowed based on request's client (domain pinning)
extraParams -> `ctx.oidc.params` m available honge ye, will be passed to interaction session details
extraTokenClaims -> minio ki problem solve kr dega
adapter -> find -> clients
interactions.policy

renderError
ttl -> time to live for various things
user flows -> can be used after interactions are completed so that we can add user registration or if want save refreshTokens of a user

add refresh_token and access_token in response body for user_registration. Deprecated was removed

in findAccount check lastLoginInstant
idToken ka ttl?
domain pinning?
registration will happen after getting consent - and where will it happen after consetless login

**frontend**
- signout reject k baad signout succes show krna. bhale hi signout na hua ho, frontend issue
- redirect_uri ka panga on ejs index.ejs
renderError page ki backchodi
- ejs me redict routes aur clientid dkh

**backend**
- logout_url??
- [how to skip these pages??](https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_consent.md)
- policy claim in minio


**resource**
[oidc.github p kuch mila](https://authts.github.io/oidc-client-ts/interfaces/OidcClientSettings.html)


http://localhost:3001/oidc/auth?client_id=myminioadmin&redirect_uri=http%3A%2F%2F192.168.250.157%3A9001%2Foauth_callback&response_type=code&scope=offline_access+openid&state=eyJzdGF0ZSI6IlIxSkJTakZVUjBaRVNrOUdORUUwU1RGT1NGQllWbE5JVGpwbFJuZzJTRWwyU0VOYVoxUTBVWFV3VURWU1N6WXJNVVpJVnpaS1RWUklVMWhIYTNCc1VVWnBkM1ZuUFE9PSIsImlkcF9uYW1lIjoiXyJ9