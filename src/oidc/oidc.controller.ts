import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { OidcService } from './oidc.service';
import { Request, Response } from 'express';
import { OIDCAuthQuery } from './oidc.auth.dto';
import { LoginDto } from 'src/login/login.dto';
import { IntrospectDto, TokenDto } from './oidc.token.dto';
import { ResponseDto } from 'src/dto/response.dto';

@ApiTags('OIDC')
@Controller('oidc')
export class OidcController {
  constructor(private readonly oidcService: OidcService) {}

  @ApiOperation({ summary: 'OIDC Authorization Endpoint' })
  @ApiQuery({ name: 'client_id', required: true, type: String })
  @ApiQuery({ name: 'tenantId', required: true, type: String })
  @ApiQuery({ name: 'redirect_uri', required: true, type: String })
  @ApiQuery({ name: 'response_type', required: true, type: String })
  @ApiQuery({ name: 'scope', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Redirects to login page or authorizes the user',
  })
  @ApiHeader({ name: 'authorization', required: false })
  @Get('auth')
  async authorize(
    @Query() query: OIDCAuthQuery,
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: object,
  ) {
    return await this.oidcService.authorize(req, res, query, headers);
  }

  @ApiOperation({ summary: 'OIDC Post Authorization Endpoint' })
  @ApiBody({ type: LoginDto })
  @ApiQuery({ name: 'client_id', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns authentication token' })
  @ApiHeader({ name: 'authorization', required: false })
  @Post('auth')
  async postAuthorize(
    @Body() data: LoginDto,
    @Query() query: OIDCAuthQuery,
    @Headers() headers: object,
  ) {
    return await this.oidcService.postAuthorize(data, query, headers);
  }

  @ApiOperation({ summary: 'OIDC Token Endpoint' })
  @ApiBody({ type: TokenDto })
  @ApiResponse({
    status: 200,
    description: 'Returns tokens (idToken, accessToken, refreshToken)',
  })
  @ApiHeader({ name: 'authorization', required: true })
  @Post('token')
  async returnToken(
    @Headers() headers: object,
    @Body() data: TokenDto,
  ): Promise<ResponseDto> {
    return await this.oidcService.returnToken(data, headers);
  }

  @Get('/.well-known/jwks.json')
  async returnAllPublicJwks(){
    return await this.oidcService.returnAllPublicJwks();
  }

  @Post('/introspect')
  async introspect(@Body() data: IntrospectDto,@Headers() headers: object){
    return await this.oidcService.introspect(data,headers);
  }
}
