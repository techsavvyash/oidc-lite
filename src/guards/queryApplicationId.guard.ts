import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApplicationDataDto } from 'src/application/application.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QueryApplicationIdGuard implements CanActivate {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(QueryApplicationIdGuard.name);
  }
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const {query,hostname} = request;
    if(!query) return false;
    const applicationId = query.client_id;
    if(!applicationId) return false;
    const application = await this.prismaService.application.findUnique({where: {id: applicationId as string}});
    if(!application) return false;
    const applicationData: ApplicationDataDto = JSON.parse(application.data);
    const authorizedOriginURLs = applicationData.oauthConfiguration.authorizedOriginURLs;
    if(authorizedOriginURLs.includes(hostname)) return true;
    return false;
  }
}
