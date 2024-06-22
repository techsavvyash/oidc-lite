import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { DomainPinningService } from 'src/domain-pinning/domain-pinning.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DataApplicationIdGuard implements CanActivate {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly domainPinningService: DomainPinningService,
  ) {
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
    // const applicationData: ApplicationDataDto = JSON.parse(application.data);
    // const authorizedOriginURLs =
    //   applicationData?.oauthConfiguration?.authorizedOriginURLs;
    try {
      const data = await this.domainPinningService.get(`${hostname}`);
      return true;
    } catch (error) {
      this.logger.log(
        `Unauthorized access attempt on ${application.id} by ${hostname}`,
      );
      return false;
    }
  }
}
