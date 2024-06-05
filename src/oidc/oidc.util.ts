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
  // jwks: {
  //   keys: [
  //     {
  //       d: 'VEZOsY07JTFzGTqv6cC2Y32vsfChind2I_TTuvV225_-0zrSej3XLRg8iE_u0-3GSgiGi4WImmTwmEgLo4Qp3uEcxCYbt4NMJC7fwT2i3dfRZjtZ4yJwFl0SIj8TgfQ8ptwZbFZUlcHGXZIr4nL8GXyQT0CK8wy4COfmymHrrUoyfZA154ql_OsoiupSUCRcKVvZj2JHL2KILsq_sh_l7g2dqAN8D7jYfJ58MkqlknBMa2-zi5I0-1JUOwztVNml_zGrp27UbEU60RqV3GHjoqwI6m01U7K0a8Q_SQAKYGqgepbAYOA-P4_TLl5KC4-WWBZu_rVfwgSENwWNEhw8oQ',
  //       dp: 'E1Y-SN4bQqX7kP-bNgZ_gEv-pixJ5F_EGocHKfS56jtzRqQdTurrk4jIVpI-ZITA88lWAHxjD-OaoJUh9Jupd_lwD5Si80PyVxOMI2xaGQiF0lbKJfD38Sh8frRpgelZVaK_gm834B6SLfxKdNsP04DsJqGKktODF_fZeaGFPH0',
  //       dq: 'F90JPxevQYOlAgEH0TUt1-3_hyxY6cfPRU2HQBaahyWrtCWpaOzenKZnvGFZdg-BuLVKjCchq3G_70OLE-XDP_ol0UTJmDTT-WyuJQdEMpt_WFF9yJGoeIu8yohfeLatU-67ukjghJ0s9CBzNE_LrGEV6Cup3FXywpSYZAV3iqc',
  //       e: 'AQAB',
  //       kty: 'RSA',
  //       n: 'xwQ72P9z9OYshiQ-ntDYaPnnfwG6u9JAdLMZ5o0dmjlcyrvwQRdoFIKPnO65Q8mh6F_LDSxjxa2Yzo_wdjhbPZLjfUJXgCzm54cClXzT5twzo7lzoAfaJlkTsoZc2HFWqmcri0BuzmTFLZx2Q7wYBm0pXHmQKF0V-C1O6NWfd4mfBhbM-I1tHYSpAMgarSm22WDMDx-WWI7TEzy2QhaBVaENW9BKaKkJklocAZCxk18WhR0fckIGiWiSM5FcU1PY2jfGsTmX505Ub7P5Dz75Ygqrutd5tFrcqyPAtPTFDk8X1InxkkUwpP3nFU5o50DGhwQolGYKPGtQ-ZtmbOfcWQ',
  //       p: '5wC6nY6Ev5FqcLPCqn9fC6R9KUuBej6NaAVOKW7GXiOJAq2WrileGKfMc9kIny20zW3uWkRLm-O-3Yzze1zFpxmqvsvCxZ5ERVZ6leiNXSu3tez71ZZwp0O9gys4knjrI-9w46l_vFuRtjL6XEeFfHEZFaNJpz-lcnb3w0okrbM',
  //       q: '3I1qeEDslZFB8iNfpKAdWtz_Wzm6-jayT_V6aIvhvMj5mnU-Xpj75zLPQSGa9wunMlOoZW9w1wDO1FVuDhwzeOJaTm-Ds0MezeC4U6nVGyyDHb4CUA3ml2tzt4yLrqGYMT7XbADSvuWYADHw79OFjEi4T3s3tJymhaBvy1ulv8M',
  //       qi: 'wSbXte9PcPtr788e713KHQ4waE26CzoXx-JNOgN0iqJMN6C4_XJEX-cSvCZDf4rh7xpXN6SGLVd5ibIyDJi7bbi5EQ5AXjazPbLBjRthcGXsIuZ3AtQyR0CEWNSdM7EyM5TRdyZQ9kftfz9nI03guW3iKKASETqX2vh0Z8XRjyU',
  //       use: 'sig',
  //     },
  //     {
  //       crv: 'P-256',
  //       d: 'K9xfPv773dZR22TVUB80xouzdF7qCg5cWjPjkHyv7Ws',
  //       kty: 'EC',
  //       use: 'sig',
  //       x: 'FWZ9rSkLt6Dx9E3pxLybhdM6xgR5obGsj5_pqmnz5J4',
  //       y: '_n8G69C-A2Xl4xUW2lF0i8ZGZnk_KPYrhv4GbTGu5G4',
  //     },
  //   ],
  // },

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
