# This is zolo to next developers

> [Node-oidc-provider](https://github.com/panva/node-oidc-provider/)

Read the above documentation and then implement the remaining functionalities.

## What is achieved till now:

1. Applications(& roles, scopes), Groups(& members), users, tenants, admin, api-keys, jwks, memory-monitory and their crud operations are implemented. Now we need to make `node-oidc-provider` use them to run the user flow.
2. In `node-oidc-provider` some partial `adapter` and `config.service` is created. The adapter Uses [Prisma Adapter](https://github.com/panva/node-oidc-provider/blob/main/example/adapters/contributed/prisma.ts) to do crud on the application, grant, session, interation etc. (see OidcModel Schema in schema.prisma).
3. `Account` class is based on this: [node-oidc-provider account](https://github.com/panva/node-oidc-provider/blob/main/example/support/account.js) this is used to find the users that are already created in our whole service. (Checking for password is not done till now).
4. Time to live for access token and refresh token is added.

## What is remaining:

1. Domain pinning or clientBasedCors
2. Check whether the password is correct while `login`
3. Jwks in the `oidc.config.service.ts`
4. Creating our own `interactions` page and removing `devInteractions` along with `renderError`.
5. Correction kickstart.json
6. Use sqlite instead of postgresql
7. Making sure the tests are up to date
8. Integration with minIO and oauth-2-proxy
9. Removing any redundant code and cleanup and documentation updation


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

user find ho rha h but no password checking, might be dev interactions issue
save access token and refresh token - no need


in findAccount check lastLoginInstant
idToken ka ttl?
domain pinning?
jwks and jwkuri?
registration will happen after getting consent
