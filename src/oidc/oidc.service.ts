import { Injectable } from '@nestjs/common';
import Provider, { Configuration, JWKS } from 'oidc-provider';
import { PrismaAdapter } from './oidc.adapter';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationDataDto } from 'src/application/application.dto';

@Injectable()
export class OIDCService {
  private static provider: any;
  constructor() {}
  private static prismaService = new PrismaService();
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
        keys: ['test'], // change this
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
      },
      clientBasedCORS(ctx, origin, client) {
        // console.log('CLORS', ctx, origin, client);
        return true;
      },
      renderError: (ctx, out, error) => {
        console.log('Error why not working: ', error);
      },
      pkce: {
        methods: ['S256'],
        required: () => false,
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
          const clientData = client_ttlMap.get(client.clientId);
          return clientData.jwtConfiguration.timeToLiveInSeconds || 10000;
        },
        RefreshToken: (ctx, token, client) => {
          const clientData = client_ttlMap.get(client.clientId);
          return (
            clientData.jwtConfiguration.refreshTokenTimeToLiveInMinutes * 60 ||
            60000
          );
        },
        Grant: () => {
          return 300000;
        },
        AuthorizationCode: () => {
          return 300000;
        },
        Session: () => {
          return 300000;
        }, // id token ka set kr
        IdToken: () => {
          return 300000;
        },
      },
      jwks,
    };

    return config;
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

  public static async getProvider(): Promise<Provider> {
    if (OIDCService.provider) {
      // console.log('returning from if');
      // console.log('provider: ', this.provider);
      return OIDCService.provider;
    }

    const mod = await eval(`import('oidc-provider')`);
    OIDCService.provider = mod.default;
    const configuration: Configuration =
      await OIDCService.returnConfiguration();
    // console.log('configuration: ', configuration.jwks);
    const oidc = new OIDCService.provider(process.env.FULL_URL, configuration);
    OIDCService.provider = oidc;
    return oidc;
  }

  static async findAccount(ctx, id) {
    // Look up the user by their ID in the database using Prisma
    // console.log('ctx: ', ctx);
    console.log('id: ', id);
    const user = await OIDCService.prismaService.user.findUnique({
      where: { email: id },
    });
    console.log('user: ', user);

    if (!user) {
      return undefined;
    }

    return {
      accountId: id,
      async claims() {
        return {
          sub: id,
          email: user.email,
          data: user.data,
          tenantId: user.tenantId,
          // Add any other claims you want to include
          // For example:
          // name: user.name,
          // given_name: user.firstName,
          // family_name: user.lastName,
          // You can include any user properties that are relevant for your application
        };
      },
    };
  }
}
