import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { OidcService } from './oidc.service';
import { Request, Response } from 'express';
import { OIDCAuthQuery } from './dto/oidc.auth.dto';
import { LoginDto } from 'src/login/login.dto';
import { IntrospectDto, TokenDto } from './dto/oidc.token.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { QueryApplicationIdGuard } from 'src/guards/queryApplicationId.guard';
import { DataApplicationIdGuard } from 'src/guards/dataApplicationId.guard';

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
  @UseGuards(QueryApplicationIdGuard)
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
  @UseGuards(QueryApplicationIdGuard)
  async postAuthorize(
    @Body() data: LoginDto,
    @Query() query: OIDCAuthQuery,
    @Headers() headers: object,
    @Res() res: Response
  ) {
    return await this.oidcService.postAuthorize(data, query, headers,res);
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
  ){
    return await this.oidcService.returnToken(data, headers);
  }

  @ApiOperation({ summary: 'Return all public JWKS' })
  @ApiResponse({ status: 200, description: 'Returns all public JWKS' })
  @Get('/.well-known/jwks.json')
  async returnAllPublicJwks() {
    return await this.oidcService.returnAllPublicJwks();
  }

  @ApiOperation({ summary: 'Return public JWKS for a tenant' })
  @ApiParam({ name: 'tenantId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Returns public JWKS for a tenant' })
  @Get('/:tenantId/.well-known/jwks.json')
  async returnAPublicJwks(@Param('tenantId') tenantId: string) {
    return await this.oidcService.returnAPublicJwks(tenantId);
  }

  @ApiOperation({ summary: 'Introspect a token' })
  @ApiBody({ type: IntrospectDto })
  @ApiResponse({
    status: 200,
    description: 'Returns token introspection result',
  })
  @ApiHeader({ name: 'content-type', required: true })
  @ApiHeader({ name: 'authorization', required: false })
  @Post('/introspect')
  @UseGuards(DataApplicationIdGuard)
  async introspect(@Body() data: IntrospectDto, @Headers() headers: object) {
    return await this.oidcService.introspect(data, headers);
  }

  @Post('userinfo')
  async returnClaimsOfEndUser(@Headers() headers: object){
    return await this.oidcService.returnClaimsOfEndUser(headers);
  }
}
