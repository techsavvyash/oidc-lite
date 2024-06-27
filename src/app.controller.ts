import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DomainPinningService } from './domain-pinning/domain-pinning.service';
import { KickstartService } from './kickstart/kickstart.service';

@ApiTags('OIDC Wrapper')
@Controller()
export class AppController {
  constructor(
    private readonly domainPinning: DomainPinningService,
    private readonly kickstartService: KickstartService,
  ) {}

  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }

  @Get('/cert')
  async getCertificate(@Req() req: Request) {
    try {
      const data = await this.domainPinning.get(req.hostname);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  @Get('.well-known/openid-configuration')
  async returnConfigs() {
    return {
      issuer: `${process.env.HOST_NAME}:${process.env.HOST_PORT}`,
      authorization_endpoint: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/auth`,
      token_endpoint: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/token`,
      userinfo_endpoint: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/userinfo`,
      jwks_uri: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/.well-known/jwks.json`,
      scopes_supported: ['openid', 'profile', 'email'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'password'],
      id_token_signing_alg_values_supported: ['RS256', 'ES256', 'HS256'],
      code_challenge_methods_supported: ['plain', 'S256'],
    };
  }
}
