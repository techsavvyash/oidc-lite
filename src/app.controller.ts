import { Controller, Get, Logger, Body, Post, Headers } from '@nestjs/common';

import { CreateUserDto, LoginDTO } from './dto/user.dto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }

  @Post('/login')
  async loginRoute(@Headers() headers: any, @Body() body: LoginDTO) {
    return this.appService.loginService(headers, body);
  }

  // for verifying opaque tokens
  @Post('/opaque-verify')
  async opaque_verify(@Body('token') token: string) {
    return this.appService.opaqueTokenVerifyService(token);
  }

  // to verify jwt created tokens, whose public keys are available
  @Post('/jwt-verify')
  async jwt_verify(@Body('token') token: string) {
    return this.appService.jwtTokenVerifyService(token);
  }

  @Post('/signup')
  async signupRoute(
    @Body()
    body: CreateUserDto,
  ) {
    return this.appService.signupService(body);
  }
}
