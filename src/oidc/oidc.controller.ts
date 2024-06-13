import { Body, Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { Request, Response } from 'express';
import { OIDCAuthQuery } from './oidc.auth.dto';
import { LoginDto } from 'src/login/login.dto';
import { TokenDto } from './oidc.token.dto';

@Controller('oidc')
export class OidcController {
  constructor(private readonly oidcService: OidcService) {}
  @Get('authorize')
  async authorize(
    @Query() query: OIDCAuthQuery,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.oidcService.authorize(req, res, query);
  }

  @Post('authorize')
  async postAuthorize(@Body() data: LoginDto,@Query() query: OIDCAuthQuery){
    return await this.oidcService.postAuthorize(data,query);
  }

  @Post('token')
  async returnToken(@Headers() headers: object, @Body() data: TokenDto){
    return await this.oidcService.returnToken(headers,data);
  }
}
