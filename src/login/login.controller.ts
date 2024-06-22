import { Body, Controller, Get, Headers, Post, Req, Res } from '@nestjs/common';
import { LoginDto } from './login.dto';
import { LoginService } from './login.service';
import { Response,Request } from 'express';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('/')
  async login(
    @Body('data') data: LoginDto,
    @Headers() headers: object,
    @Res() res: Response,
  ){
    const result = await this.loginService.login(data, headers);
    res.cookie('refreshToken', result.data.refreshToken.value, {
      secure: true,
      httpOnly: true,
    });
    res.cookie('accessToken', result.data.accessToken.value, {
      secure: true,
      httpOnly: true,
    });

    return res.status(200).json(result);
  }

  @Get('/logout')
  async logout(@Res() res: Response,@Req() req: Request){
    return await this.loginService.logout(res,req);
  }
}
