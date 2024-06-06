import { Configuration } from 'oidc-provider';

let Provider, oidc;
const configuration: Configuration = {
  features: {
    /** enables grant_type=client_credentials to be used on token endpoint */
    clientCredentials: {
      enabled: true,
    },
    resourceIndicators: {
      enabled: true,
      getResourceServerInfo(ctx, resourceIndicator, client) {
        if (resourceIndicator)
          return {
            scope: 'openid email profile phone offline_access address',
            audience: resourceIndicator,
            accessTokenTTL: 1 * 60 * 60,
            accessTokenFormat: 'jwt',
          };
        throw new Error('Resource indicator not given!');
      },
    },
    /** To extract out the info in the tokens generated; default has to be modified to allow introspection from authentic sources only (features.introspection.allowedPolicy)*/
    introspection: {
      enabled: true,
    },

    /** To turn off default pages and routes */
    devInteractions: {
      enabled: false,
    },
  },
  clientBasedCORS(ctx, origin, client) {
    return false;
  },
  clients: [
    {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: [
        `${process.env.HOST_NAME}:${process.env.HOST_PORT}/${process.env.OIDC_CALLBACK_ROUTE}`,
      ],
      grant_types: [
        'client_credentials',
        'refresh_token',
        'authorization_code',
      ],
      response_types: ['code'],
    },
  ],
  pkce: {
    methods: ['S256'],
    required: () => false,
  },
  scopes: ['openid', 'offline_access', 'profile', 'email', 'phone', 'address'],

  jwks: {
    keys: [
      {
        p: '8C-OZn_UhZHifUfoD3xyY7vvQbFkbpVdRgzl7bOSy2ZnfRoJ1QlQvojimJ1i-rdLqCXY9_1NuQ4nMnG0tHCPOS3VIwzjL2iPJj1SyxOTDenVfEUXLdLluMN3yvJkD22StZ7Wd4rzBjvJIMifKTnwYEUFaac3jkAO1BdKGm6zvIU',
        kty: 'RSA',
        q: '6tcYml-yc9vc-h7Hbpjgw5APbvCeQ6FAYYh6CbpJS2J_Snnj0WqC_UmWmrjWRvlDCqQ5hhB31RufQRRnZgXX3_bY5eEoNnV_52vUOJm_oLBFMJkUYfJYIOJoQewWtponwkRbY9-OE36SpittXtCGAWgHFSVaIDdqwR9Nar_eCWE',
        d: 'NQc9O8FfZee-RjDMtCh_Dx-9QcBLy4O3LnAXSHZklLDs0ifTCtp6TyE8YJOGBoUfFnUKskgGEOgnadh8c6Tw7LgHdUg8IuzDCXMZY1qNSg0zrMIbAs77pKSDd6aa_QSI0K_fkT8qKFmkSfsoSYkCWGzuec1N7KyWBlAC5NlUroCblrFcPhcrAwDIsVuvxKiA8Fa0ON9f15AdVIzVZj-1UkSy2CD9ZpjSUB_ERoVdytIBa-vV1okBloghZiOSn7x76RR4po0Ql5iHFWcFJpyFIVFKEUeUq34AQXsczKtrBExUmdotrAG7PlTpdCn2fl2lIVScSPnJ_59uwhC5NPXvgQ',
        e: 'AQAB',
        use: 'sig',
        qi: 'qEqJV_wvPK7bU9orWIxTaxLtBFDWBkKu2KV-3tkW1Obe2iwYbLzKVsX1SfUX6nJgZ25Ms35t7VQM_emjphof5bfG6Lwpt2hZk5LbbSG6Tb_Br7vvMkSmZ44BF9fV0jrNGTK6Zi69f4w_DxazkZA-488pyeLXK3yjuGIli2x_Qog',
        dp: 'AvrEDHd3fnSx15YFxfNoQ953-FuoAEswDgdo7sr0fjt1-zJQfukPrF1sWjJRoQSXFq3phCILTclkKRcKA9cFn9L2uumVA-iLJhFKrqQ-hcSp1lHRGMtt-B3MpaLeJObaFBC1XmRF4YTqWNLETrGeTsNsbsQZR1V6GZ10WOGYrzU',
        alg: 'RS256',
        dq: 'rYh8mbaVe5_ATuNno4Y8sMZHYUdU68zAclITPBT4DEignzwq6Ji4aspyC6sCTDftHnP0Pej1Y_ihWcnmDjHLL6iM5nHW8UcqWKwJijmyrN8UgbDcqvQVw1cKi4wVzKFlN9yjW83agvVJEJmOnD2iiG-CrFGJo7zPmh2za2qUfIE',
        n: '3FVHL5Sr9tUKmOgTKtGVwCFwxp5maO_ct8ecjMas5wN7SVKVMxnwSGEtyFQdcUHW_tmJaSKXo2THZ7GMNyP94nGlrwGITet7_IdoD0Fm9Vg9UTqajzc9KnHXQ8M2OB3UGcjrKYuN7QHgeYXz50k-ySVs5piXsA7Yhr6Hy989XSx2JL4QyT_vpQZfG1F9JcU-6MopZTi9AWVmFsPlPIFWrtYD--3eqtnuo2QGyhXx0tUb9dVM5fj5jSYHug_5uyfodi2d2_FyszZ82mm2qI_qJe9MSm_Cp07CDpUm8pOA3lB7p-bqCuHSGtVvjfejMw57wfL9xypkRMMpLSt--hEbZQ',
      },
    ],
  },
};

// refer: https://stackoverflow.com/questions/70545129/compile-a-package-that-depends-on-esm-only-library-into-a-commonjs-package to understand why this all
async function getProvider(): Promise<any> {
  if (typeof Provider !== 'undefined') return Provider;
  const mod = await (eval(`import('oidc-provider')`) as Promise<
    typeof import('oidc-provider')
  >);
  Provider = mod.default;
  return mod;
}
getProvider().then(() => {
  oidc = new Provider(
    `${process.env.HOST_NAME}:${process.env.HOST_PORT}`,
    configuration,
  );
});
async function getCallbackFunction() {
  return oidc.callback();
}

export default getCallbackFunction;
