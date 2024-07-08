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
export class ParamApplicationIdGuard implements CanActivate {
  private readonly logger: Logger;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilsService,
  ) {
    this.logger = new Logger(ParamApplicationIdGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { params, hostname } = request;
    const forwardedHost = request.headers['x-forwarded-host'];
    const applicationId = params?.applicationId;

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
