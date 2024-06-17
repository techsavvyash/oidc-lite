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
import { RefreshTokensService } from './refreshtokens.service';
import { refreshCookiesDTO, refreshDTO } from './refreshToken.dto';

@Controller('jwt')
export class RefreshTokensController {
  constructor(private readonly refreshService: RefreshTokensService) {}

  @Post('/refresh')
  async refreshToken(
    @Headers() cookie: refreshCookiesDTO,
    @Body() data: refreshDTO,
  ) {
    return this.refreshService.refreshToken(cookie, data);
  }

  @Get('/refresh/:id')
  async retrieve(@Param('id') uuid: string,@Headers() headers: object) {
    return this.refreshService.retrieveByID(uuid,headers);
  }
  
  @Get('/refresh')
  async retrieveByUserID(@Headers('userId') userId: string,@Headers() headers: object) {
    return this.refreshService.retrieveByUserID(userId,headers);
  }

  @Delete('/refresh/:tokenId')
  async deleteViaTokenID(
    @Param('tokenId') id: string,
    @Headers() headers: object,
  ) {
    return this.refreshService.deleteViaTokenID(id, headers);
  }

  @Delete('refresh')
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
