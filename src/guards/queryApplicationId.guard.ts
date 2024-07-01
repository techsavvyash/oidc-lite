import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { UtilsService } from '../utils/utils.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueryApplicationIdGuard implements CanActivate {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilService: UtilsService,
  ) {
    this.logger = new Logger(QueryApplicationIdGuard.name);
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { query, hostname } = request;
    const forwardedHost = request.headers['x-forwarded-host'];
    if (!query) return false;
    const applicationId = query.client_id;
    if (!applicationId) return false;
    const application = await this.prismaService.application.findUnique({
      where: { id: applicationId as string },
    });
    if (!application) return false;
    return await this.utilService.checkHostPublicKeyWithSavedPublicKeys(
      forwardedHost,
      hostname,
      application.id,
    );
  }
}
