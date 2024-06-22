import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { DomainPinningService } from 'src/domain-pinning/domain-pinning.service';

@Injectable()
export class ParamApplicationIdGuard implements CanActivate {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly domainPinningService: DomainPinningService,
  ) {
    this.logger = new Logger(ParamApplicationIdGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { params, hostname } = request;
    const applicationId = params?.applicationId;
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
