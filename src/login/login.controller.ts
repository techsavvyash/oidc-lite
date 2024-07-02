import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './login.dto';
import { LoginService } from './login.service';
import { Response, Request } from 'express';
import { DataApplicationIdGuard } from '../guards/dataApplicationId.guard';

@Controller('/')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('/login')
  @UseGuards(DataApplicationIdGuard)
  async login(
    @Body('data') data: LoginDto,
    @Headers() headers: object,
    @Res() res: Response,
  ) {
    const result = await this.loginService.login(data, headers);
    res.cookie('refreshToken', result.refresh_token, {
      secure: true,
      httpOnly: true,
    });
    res.cookie('accessToken', result.access_token, {
      secure: true,
      httpOnly: true,
    });

    return res.status(200).json(result);
  }

  @Get('/logout')
  async logout(@Res() res: Response, @Req() req: Request) {
    return await this.loginService.logout(res, req);
  }
}
