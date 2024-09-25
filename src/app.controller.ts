import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { Oidc } from 'nest-oidc-provider';
import { KoaContextWithOIDC } from 'oidc-provider';
import axios from 'axios';

@ApiTags('OIDC Wrapper')
@Controller()
export class AppController {
  private readonly logger: Logger;
  constructor(private readonly appService: AppService) {
    this.logger = new Logger(AppController.name);
  }

  // TODO: Fix this endpoint
  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }

  @Get('/')
  @Render('index')
  async index(@Oidc.Context() ctx: KoaContextWithOIDC) {
    const {
      oidc: { provider },
    } = ctx;
    const session = await provider.Session.get(ctx);

    const res: Record<string, any> = {
      query: ctx.query,
      accountId: null,
      scopes: null,
      origin: ctx.URL.origin,
    };

    if (session?.accountId) {
      const grant = await provider.Grant.find(session.grantIdFor('test'));
      res.accountId = session.accountId;
      res.scopes = grant?.getOIDCScopeEncountered();
    }

    return res;
  }

  @Get('/callback')
  async test(@Query() query: Record<string, any>, @Res() res: Response) {
    console.log('======== INSIDE CALLBACK ==========');
    const { code, error, error_description } = query;

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
      await axios.post(
        `${process.env.ISSUER_URL}/token`,
        new URLSearchParams({
          client_id: 'test',
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.FULL_URL}/callback`,
          code,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      res.redirect('/');
    } catch (err: any) {
      this.logger.error('Could not get token:', err);
      res
        .status(err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR)
        .json(err.response?.data ?? err);
    }
  }

  @Get('/admin')
  async adminPanel(@Res() res: Response) {
    return res.render('admin', {
      hostname: `${process.env.FULL_URL}`,
    });
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

  @Post('login')
  async confirmLogin(@Req() req: Request) {
    console.log(req.body);
  }
}
