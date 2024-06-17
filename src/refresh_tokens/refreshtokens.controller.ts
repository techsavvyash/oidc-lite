import {
  BadGatewayException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { RefreshTokensService } from './refreshtokens.service';
import { refreshCookiesDTO, refreshDTO } from './refreshToken.dto';

@ApiTags('jwt')
@Controller('jwt')
export class RefreshTokensController {
  constructor(private readonly refreshService: RefreshTokensService) {}

  @Post('/refresh')
  @ApiOperation({ summary: 'Refresh the access token using the refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 502, description: 'Bad Gateway' })
  @ApiBody({ type: refreshDTO })
  async refreshToken(
    @Headers() cookie: refreshCookiesDTO,
    @Body() data: refreshDTO,
  ) {
    return this.refreshService.refreshToken(cookie, data);
  }

  @Get('/refresh/:id')
  @ApiOperation({ summary: 'Retrieve refresh token by ID' })
  @ApiResponse({
    status: 200,
    description: 'Refresh token retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'id', description: 'UUID of the refresh token' })
  @ApiHeader({
    name: 'x-stencil-tenantid',
    required: true,
    description: 'Tenant ID',
  })
  async retrieve(@Param('id') uuid: string, @Headers() headers: object) {
    return this.refreshService.retrieveByID(uuid, headers);
  }

  @Get('/refresh')
  @ApiOperation({ summary: 'Retrieve refresh tokens by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Refresh tokens retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiHeader({ name: 'userId', required: true, description: 'User ID' })
  @ApiHeader({
    name: 'x-stencil-tenantid',
    required: true,
    description: 'Tenant ID',
  })
  async retrieveByUserID(
    @Headers('userId') userId: string,
    @Headers() headers: object,
  ) {
    return this.refreshService.retrieveByUserID(userId, headers);
  }

  @Delete('/refresh/:tokenId')
  @ApiOperation({ summary: 'Delete refresh token by token ID' })
  @ApiResponse({
    status: 200,
    description: 'Refresh token deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'tokenId', description: 'Token ID' })
  @ApiHeader({
    name: 'x-stencil-tenantid',
    required: true,
    description: 'Tenant ID',
  })
  async deleteViaTokenID(
    @Param('tokenId') id: string,
    @Headers() headers: object,
  ) {
    return this.refreshService.deleteViaTokenID(id, headers);
  }

  @Delete('refresh')
  @ApiOperation({ summary: 'Delete refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Refresh token deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        applicationId: { type: 'string', nullable: true },
        usersId: { type: 'string', nullable: true },
        token: { type: 'string', nullable: true },
      },
      required: [],
    },
  })
  @ApiHeader({
    name: 'x-stencil-tenantid',
    required: true,
    description: 'Tenant ID',
  })
  async deletereftoken(
    @Body('applicationId') appid: string,
    @Body('usersId') userid: string,
    @Body('token') refreshToken: string,
    @Headers() headers: object,
  ) {
    if (appid && userid) {
      return this.refreshService.deleteViaUserAndAppID(userid, appid, headers);
    } else if (appid) {
      return this.refreshService.deleteViaAppID(appid, headers);
    } else if (userid) {
      return this.refreshService.deleteViaUserID(userid, headers);
    } else if (refreshToken) {
      return this.refreshService.deleteViaToken(refreshToken, headers);
    } else {
      throw new BadGatewayException({
        success: false,
        message: 'invalid parameters',
      });
    }
  }
}
