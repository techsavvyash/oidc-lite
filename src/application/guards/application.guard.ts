import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationDataDto } from '../application.dto';

@Injectable()
export class AuthorizedOriginUrls implements CanActivate {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(AuthorizedOriginUrls.name);
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
    const applicationData: ApplicationDataDto = JSON.parse(application.data);
    const authorizedOriginURLs =
      applicationData.oauthConfiguration.authorizedOriginURLs;
    if(authorizedOriginURLs.includes(hostname)) return true;
    this.logger.log(`Unauthorized access attempt on ${application.id} by ${hostname}`);
    return false;
  }
}
