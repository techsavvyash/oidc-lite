import { Injectable, UnauthorizedException } from '@nestjs/common';
import Provider, {
  AdapterPayload,
  Client,
  Configuration,
  JWKS,
  KoaContextWithOIDC,
  errors,
} from 'oidc-provider';
import { PrismaAdapter } from './oidc.adapter';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationDataDto } from 'src/application/application.dto';
import { UtilsService } from 'src/utils/utils.service';

// this part of code is under progress
const corsProp = 'urn:custom:client:allowed-cors-origins';
const isOrigin = (value) => {
  return true; // for now
  if (typeof value !== 'string') {
    return false;
  }
  if (value === '*') return true;
  try {
    const { origin } = new URL(value);
    // Origin: <scheme> "://" <hostname> [ ":" <port> ]
    return value === origin;
  } catch (err) {
    return false;
  }
};

@Injectable()
export class OIDCService {
  private static provider: any;
  constructor() {}
  private static readonly prismaService = new PrismaService();
  private static readonly utilsService = new UtilsService(
    OIDCService.prismaService,
  );
  public static async returnConfiguration(): Promise<Configuration> {
    const client_ttlMap: Map<string, ApplicationDataDto> =
      await this.returnTTL();

    const jwksArray = await this.prismaService.key.findMany();
    const jwksFinal = jwksArray.map((jwk) => JSON.parse(jwk.data));
    const jwks: JWKS = jwksFinal.length > 0 ? { keys: jwksFinal } : undefined;
    const config: Configuration = {
      interactions: {
        url(ctx, interaction) {
          return `/interaction/${interaction.uid}`;
        },
      },
      adapter: (modelName: string) => new PrismaAdapter(modelName),
      findAccount: OIDCService.findAccount.bind(this),
      cookies: {
        keys: ['test'], // TODO: change this
      },
      scopes: [
        'openid',
        'offline_access',
        'profile',
        'email',
        'phone',
        'address',
      ],
      claims: {
        address: ['address'],
        email: ['email', 'email_verified'],
        phone: ['phone_number', 'phone_number_verified'],
        profile: [
          'birthdate',
          'family_name',
          'gender',
          'given_name',
          'locale',
          'middle_name',
          'name',
          'nickname',
          'picture',
          'preferred_username',
          'profile',
          'updated_at',
          'website',
          'zoneinfo',
        ],
        openid: ['policy'],
      },
      // this and next function are under progress
      extraClientMetadata: {
        properties: [corsProp, 'extra'], // don't remove extra, used for skipping consent screen
        validator: async (ctx, key, value, metadata) => {
          console.log(ctx);
          if (key === corsProp) {
            // set default (no CORS)
            if (value === undefined) {
              metadata[corsProp] = [];
              return;
            }
            // validate an array of Origin strings
            if (!Array.isArray(value) || !value.every(isOrigin)) {
              throw new UnauthorizedException(
                `${corsProp} must be an array of origins`,
              );
            }
          }
        },
      },
      clientBasedCORS(ctx, origin, client) {
        console.log('This nigga is not getting called');
        // ctx.oidc.route can be used to exclude endpoints from this behaviour, in that case just return
        // true to always allow CORS on them, false to deny
        // you may also allow some known internal origins if you want to
        return (
          (client[corsProp] as any).includes(() =>
            console.log('Wassup nigga'),
          ) || (client[corsProp] as any).includes('*')
        );
      },

      // used to skip consent
      loadExistingGrant: async (ctx) => {
        const clientMacroObject = ctx.oidc.client;
        const grantId =
          (ctx.oidc.result &&
            ctx.oidc.result.consent &&
            ctx.oidc.result.consent.grantId) ||
          ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId);

        if (grantId) {
          // keep grant expiry aligned with session expiry
          // to prevent consent prompt being requested when grant expires
          const grant = await ctx.oidc.provider.Grant.find(grantId);

          // this aligns the Grant ttl with that of the current session
          // if the same Grant is used for multiple sessions, or is set
          // to never expire, you probably do not want this in your code
          if (ctx.oidc.account && grant.exp < ctx.oidc.session.exp) {
            grant.exp = ctx.oidc.session.exp;

            await grant.save();
          }

          return grant;
        } else if (OIDCService.skipConsent(clientMacroObject) === true) {
          const grant = new ctx.oidc.provider.Grant({
            clientId: ctx.oidc.client.clientId,
            accountId: ctx.oidc.session.accountId,
          });
          const client = await OIDCService.prismaService.application.findUnique(
            {
              where: { id: clientMacroObject.clientId },
            },
          );
          if (!client || !client.active) return undefined;

          const scope =
            await OIDCService.utilsService.returnScopesForAGivenApplicationId(
              clientMacroObject.clientId,
            );

          grant.addOIDCScope(scope.join(' '));
          // not needed
          // grant.addOIDCClaims(['first_name']);
          // grant.addResourceScope(
          //   'urn:example:resource-indicator',
          //   'api:read api:write',
          // );
          await grant.save();
          return grant;
        }
      },
      renderError: (ctx, out, error) => {
        console.log('Error why oidc not working: ', error);
      },
      pkce: {
        methods: ['S256'],
        required: (ctx, client) => {
          return (client.extra as any).enablePKCE === true ? true : false;
        },
      },
      features: {
        introspection: { enabled: true },
        jwtIntrospection: { enabled: true },
        userinfo: { enabled: true },
        // resource Indicators?
        revocation: { enabled: true },
        devInteractions: {
          enabled: false,
        },
      },
      issueRefreshToken: async () => {
        return true;
      },
      ttl: {
        AccessToken: (ctx, token, client) => {
          const clientData = client_ttlMap.get(client?.clientId);
          return clientData.jwtConfiguration.timeToLiveInSeconds || 10000;
        },
        RefreshToken: (ctx, token, client) => {
          const clientData = client_ttlMap.get(client?.clientId);
          return (
            clientData.jwtConfiguration.refreshTokenTimeToLiveInMinutes * 60 ||
            60000
          );
        },
        Grant: (ctx, token, client) => {
          return 1000;
        },
        AuthorizationCode: (ctx, token, client) => {
          const clientData = client_ttlMap.get(client?.clientId);
          return (
            clientData.oauthConfiguration
              .authorizationCodeTimeToLiveInSeconds || 1000
          );
        },
        Session: (ctx, token, client) => {
          return 30000;
        },
        IdToken: (ctx, token, client) => {
          const clientData = client_ttlMap.get(client?.clientId);
          return (
            clientData.oauthConfiguration.idTokenTimeToLiveInMinutes * 60 ||
            60000
          );
        },
      },
      // can be used for adding extra claims in access token if required
      // extraTokenClaims(ctx, token) {
      //   console.log(token);
      //   return undefined;
      // },
      //
      // can be used in backchannel authorization
      // extraParams: {

      // },
      jwks,
    };

    return config;
  }

  private static skipConsent(client: Client) {
    // if enabled skipConsentScreen in the application schema then skip consent
    return (client.extra as any).skipConsentScreen === true ? true : false;
  }

  private static async returnTTL() {
    const client_ttlMap: Map<string, ApplicationDataDto> = new Map();
    const clients = await this.prismaService.application.findMany();
    clients.forEach((client) =>
      client_ttlMap.set(
        client.id,
        JSON.parse(client.data) as ApplicationDataDto,
      ),
    );
    return client_ttlMap;
  }

  // TODO: figure out how not to use this function, as I want to remove it
  public static async getProvider(): Promise<Provider> {
    if (OIDCService.provider) {
      return OIDCService.provider;
    }

    const mod = await eval(`import('oidc-provider')`);
    OIDCService.provider = mod.default;
    const configuration: Configuration =
      await OIDCService.returnConfiguration();
    const oidc = new OIDCService.provider(
      process.env.ISSUER_URL,
      configuration,
    );
    OIDCService.provider = oidc;
    return oidc;
  }

  // Look up the user by their ID in the database using Prisma and returns the user claims, id is required to be email rather than some uuid
  static async findAccount(ctx: KoaContextWithOIDC, id: string) {
    const clientId = ctx.oidc.client.clientId;
    const user = await OIDCService.prismaService.user.findUnique({
      where: { email: id },
    });

    if (!user || !user.active) {
      // if user soft deleted the return undefined as well
      return undefined;
    }

    // roles that are of type urn:applicationId:claim:roles will be put in jwt
    const roleIds =
      await OIDCService.utilsService.returnRolesForAGivenUserIdAndTenantId(
        user.id,
        user.tenantId,
      );
    const rolesObj = await Promise.all(
      roleIds.map(async (roleId) => {
        const role = await OIDCService.prismaService.applicationRole.findUnique(
          { where: { id: roleId } },
        );
        return role;
      }),
    );
    const roles = rolesObj.map((roleObj) => roleObj.name);
    // regex to check if a role matches the urn:clientId:claim:roles pattern
    const urnRegex = /^urn:[a-zA-Z0-9]+:[a-zA-Z0-9]+:[\[\]\'\"\,a-zA-Z0-9]+$/;

    // Filter roles that follow the required format
    const filteredRoles = roles.filter((role) => urnRegex.test(role));
    // Parse roles into claims and their values
    const roleClaims = filteredRoles.reduce((acc, role) => {
      // Extract the parts from the URN role string (urn:namespace:claim:value)
      const parts = role.split(':');
      if (parts.length === 4) {
        const claimName = parts[2]; // This is the 'claim' part of the role
        const clientName = parts[1];

        // checks if the role belongs to the corresponding client or not
        if (clientName !== clientId) return acc;

        let claimValue = parts[3];

        // Handle the conversion from single quoted value to unquoted value
        if (claimValue.startsWith("'") && claimValue.endsWith("'")) {
          claimValue = claimValue.slice(1, -1); // Remove the surrounding single quotes
        }

        // Handle the conversion from string representation of an array to actual array
        if (claimValue.startsWith("['") && claimValue.endsWith("']")) {
          try {
            // Convert single quotes to double quotes for valid JSON parsing
            claimValue = JSON.parse(claimValue.replace(/'/g, '"'));
          } catch (e) {
            // If parsing fails, keep it as the original string
            console.error(
              'Failed to parse claim value as JSON array:',
              claimValue,
            );
          }
        }

        // Add the claim to the accumulated object, handle cases where there may be multiple values
        if (acc[claimName]) {
          // If the claim already exists, append the new values
          if (Array.isArray(acc[claimName])) {
            acc[claimName] = Array.isArray(claimValue)
              ? [...acc[claimName], ...claimValue]
              : [...acc[claimName], claimValue];
          } else {
            acc[claimName] = [acc[claimName], ...[].concat(claimValue)];
          }
        } else {
          // Otherwise, add it as a new entry
          acc[claimName] = claimValue;
        }
      }
      return acc;
    }, {});

    return {
      accountId: id,
      async claims(
        use: 'id_token' | 'userinfo',
        scope: string,
        claims: object,
        rejected: String[],
      ) {
        // add whatever u want but only claims supported by AS are returned in id_token, supported claims are above
        return {
          sub: id,
          email: user.email,
          ...roleClaims, // Spread the role claims into the return object
        };
      },
    };
  }
}
