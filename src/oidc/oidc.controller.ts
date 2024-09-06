import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcConfigService } from './oidc.config.service';
@Controller('oidc')
export class OidcController {
  private oidc;
  constructor(private readonly oidcConfigService: OidcConfigService) {
    this.oidcConfigService.returnOidc().then((resolve) => {
      this.oidc = resolve;
      console.log('authorization server created', resolve);
    });
  }
  @All('/*')
  public async mountedOidc(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    req.url = req.originalUrl.replace('/oidc', '');
    const callback = await this.oidc.callback();
    return callback(req, res);
  }
}
