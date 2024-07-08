import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class DataApplicationIdGuard implements CanActivate {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilsService,
  ) {
    this.logger = new Logger(DataApplicationIdGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { hostname, body } = request;
    const forwardedHost = request.headers['x-forwarded-host'];
    if (!body) return false;
    const data = body.data;
    if (!data) return false;
    let applicationId = null;
    applicationId = data.userInfo?.applicationId; // for /user/register/combined
    applicationId = applicationId ? applicationId : data.applicationId;
    applicationId = applicationId ? applicationId : data.client_id; // for oidc/introspection route

    if (!applicationId) return false;
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) return false;
    return await this.utilService.checkHostPublicKeyWithSavedPublicKeys(
      forwardedHost,
      hostname,
      application.id,
    );
  }
}
