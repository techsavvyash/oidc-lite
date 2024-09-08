import { Injectable } from '@nestjs/common';
import Provider, { Configuration, Interaction, JWKS } from 'oidc-provider';
import { PrismaAdapter } from './oidc.adapter';
import Account from './findAccount';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationDataDto } from 'src/application/application.dto';

@Injectable()
export class OidcConfigService {
  private provider;
  private async returnConfiguration(): Promise<Configuration> {
    const client_ttlMap: Map<string, ApplicationDataDto> = await this.returnTTL();

    const jwksArray = await this.prismaService.key.findMany();
    const jwksFinal = jwksArray.map(jwk => JSON.parse(jwk.data));
    const jwks: JWKS = jwksFinal.length > 0 ? {keys: jwksFinal}: undefined;
    return {
      interactions: {
        url(ctx, interaction) {
          return `/interaction/${interaction.uid}`;
        },
      },
      adapter: (modelName: string) => new PrismaAdapter(modelName),
      findAccount: (ctx, sub, token) =>
        Account.findAccount(ctx as unknown as any, sub, token),
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
        console.log('CLORS', ctx, origin, client);
        return false;
      },
      pkce: {
        required(ctx, client) {
          return false;
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
      issueRefreshToken: async (ctx, client, code) => {
        return true;
      },
      // loadExistingGrant(ctx) { // runs after giving consent
      //   console.log(ctx);
      //   return undefined;
      // },
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
        Grant: (ctx, token, client) => {
          return 300000;
        },
        AuthorizationCode: (ctx, token, client) => {
          return 300000;
        },
        Session: (ctx, token, client) => {
          return 300000;
        }, // id token ka set kr
        IdToken: (ctx, token, client) => {
          return 300000;
        },
      },
      jwks,
    };
  }

  constructor(private readonly prismaService: PrismaService) {}

  async returnOidc() {
    if (typeof this.provider !== 'undefined') {
      return this.provider;
    }
    const mod = await eval(`import('oidc-provider')`);
    this.provider = mod.default;
    const configuration: Configuration = await this.returnConfiguration();
    const oidc = new this.provider(process.env.FULL_URL, configuration);
    return oidc;
  }

  private async returnTTL() {
    const client_ttlMap: Map<string, ApplicationDataDto> = new Map();
    const clients = await this.prismaService.application.findMany();
    clients.forEach(client => client_ttlMap.set(client.id,JSON.parse(client.data) as ApplicationDataDto))
    return client_ttlMap;
  }
}
