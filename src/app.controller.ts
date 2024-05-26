import {
  Controller,
  HttpStatus,
  Get,
  Query,
  Render,
  Res,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { Request, Response } from 'express';
import * as qs from 'query-string';
import { UserService } from './user/user.service';
import { env } from 'process';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,private readonly userService: UserService) {}

  @Get('/')
  @Render('index')
  async getLoginPage(
    @Req() req: Request,
    @Res() res: Response,
    @Query('error') error: string,
    @Query('error_description') error_description: string,
  ) {
    const result: Record<string, any> = {
      query: { error, error_description },
      accountId: null,
      scopes: null,
      origin: process.env.LOCALHOST_URL
    };

    return result;
  }

  @Get('/callback')
  async test(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('error_description') error_description: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    console.log('first', code);
    if (error) {
      return res.redirect(
        `/?error=${error}&error_description=${error_description}`,
      );
    }

    if (!code) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing "code" parameter');
    }
    try {
      const result = await axios.post(
        'http://localhost:3000/oidc/token',
        qs.stringify({
          client_id: process.env.CLIENT_ID,
          grant_type: 'authorization_code',
          redirect_uris: 'http://localhost:3000/callback',
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic' + process.env.AUTHORIZATION_TOKEN,
          },
        },
      );
      console.log('THis is result data', result.data);  // use by default nest logger instead   
      const refresh_token =  result.data.access_token
      const user = req.cookies?.user; //user will exist since code is generated
      console.log("Hello user",user?.username);
      await this.userService.insertToken(user.id,refresh_token); // token getting appended
      console.log("Token appended!");
    } catch (error) {
      console.log('Axios error happened', error);
      res
        .status(error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response?.data ?? error);
    }

    res.redirect('/');
  }
}
