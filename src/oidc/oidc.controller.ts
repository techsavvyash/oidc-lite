import {
  All,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Oidc } from 'nest-oidc-provider';
import axios from 'axios';
import { KoaContextWithOIDC } from 'oidc-provider';
// import qs from 'query-string';

@Controller()
export class OIDCController {
  @All('/*')
  public mountedOidc(
    @Oidc.Context() ctx: KoaContextWithOIDC,
    @Req() req: Request,
    @Res() res: Response,
   ) {
    const {
      oidc: { provider },
    } = ctx;
    req.url = req.originalUrl.replace('/oidc', '');
    const callback = provider.callback();
    return callback(req,res);
  }

  private readonly logger = new Logger(OIDCController.name);

  @Get('/')
  @Render('index')
  async index(@Oidc.Context() ctx: any) {
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
      const params = new URLSearchParams({
        client_id: 'test',
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3001/callback',
        code,
      });
      await axios.post('http://localhost:3001/oidc/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      res.redirect('/');
    } catch (err: any) {
      this.logger.error('Could not get token:', err);
      res
        .status(err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR)
        .json(err.response?.data ?? err);
    }
  }
}
