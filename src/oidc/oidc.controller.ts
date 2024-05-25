import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import getCallbackFunction from './oidc.util';

// const Provider = getProvider();

@Controller('oidc')
export class OidcController {
  @All('/*')
  public async mountedOidc(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const callback = await getCallbackFunction();
    req.url = req.originalUrl.replace('/oidc', '');
    return callback(req, res);
  }
}
