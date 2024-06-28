import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Response } from 'express';

@ApiTags('OIDC Wrapper')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }

  @Get('/')
  async adminPanel(@Res() res: Response) {
    return await this.appService.adminPanel(res);
  }

  @Post('/')
  async toggleKeyManager(
    @Body() data: { username: string; password: string; key: string },
  ) {
    return await this.appService.toggleKeyManager(data);
  }

  @Post('/admin')
  async createAdmin(@Body() data: { username: string; password: string }) {
    return await this.appService.createAdmin(data);
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
