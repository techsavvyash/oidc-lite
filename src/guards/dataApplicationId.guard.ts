import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationDataDto } from '../application/application.dto';

@Injectable()
export class DataApplicationIdGuard implements CanActivate {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(DataApplicationIdGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { hostname, body } = request;
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
    const applicationData: ApplicationDataDto = JSON.parse(application.data);
    const authorizedOriginURLs =
      applicationData?.oauthConfiguration?.authorizedOriginURLs;
    if (authorizedOriginURLs.includes(hostname)) return true;
    this.logger.log(
      `Unauthorized access attempt on ${application.id} by ${hostname}`,
    );
    return false;
  }
}
