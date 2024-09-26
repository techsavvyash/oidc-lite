# Integrating our service with Oauth2-proxy

## Steps

1. Install go - `sudo apt install golang-go`
2. Install oauth2-proxy - `go install github.com/oauth2-proxy/v7@latest`
3. `echo $GOPATH`, If nothing prints then do `export GOPATH=$HOME/go`
4. Set path to access installations done by go - `export PATH=$PATH:$GOPATH/bin`
5. `nano oauth2proxy.cfg`
6. Paste the following code in the file created

```
provider = "oidc"
redirect_url = "http://localhost:4180/oauth2/callback"
oidc_issuer_url = "http://localhost:3001/oidc"
upstreams = [
    "http://localhost:3001/health","http://localhost:3001/admin","http://localhost:9001/"
]
email_domains = [
    "*"
]
client_id = "myminioadmin"
client_secret = "minio-secret-key-change-me"
pass_access_token = true
pass_authorization_header = true
pass_user_headers = true
set_xauthrequest = true
cookie_secret = "This is one 333 long secret key "
cookie_secure = false
skip_provider_button = true
```

7. Run the following command - `oauth2-proxy --config oauth2proxy.cfg --code-challenge-method "S256" --logging-filename ""
`

8. Go to `localhost:4180`
9. Enter credentials. After entering credentials, you will see 404 page. However, go to `cookies`, there you will find `_oauth2_proxy` cookie and `X-Auth-Request-[user,Access,Id]`
