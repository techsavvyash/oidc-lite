The configurations each client/application registered to our service will need to have

{
    jwtConfiguration:{
        enabled,
        timeToLiveInSeconds,
        refreshTokenTimeToLiveInMinutes: 60,
        refreshTokenUsagePolicy: ontime/or always
    },
    client_id,
    client_secret
    enabledGrants: like "authorization_code", refresh_token,
    proofKeyForCodeExchangePolicy
}