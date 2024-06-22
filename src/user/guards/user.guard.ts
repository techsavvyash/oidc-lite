import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationDataDto } from '../../application/application.dto';
import { CreateUserAndUserRegistration, CreateUserDto, CreateUserRegistrationDto } from '../user.dto';

@Injectable()
export class UserGuardAuthorizedOriginUrls implements CanActivate {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(UserGuardAuthorizedOriginUrls.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const { hostname, body } = request;
    if (!body) return false;
    const data: CreateUserRegistrationDto | CreateUserAndUserRegistration | CreateUserDto = body.data;
    if (!data) return false;
    let applicationId = null;
    applicationId = (data as CreateUserAndUserRegistration).userInfo.applicationId;
    applicationId = applicationId ? applicationId: (data as CreateUserRegistrationDto).applicationId;
    applicationId = applicationId ? applicationId: (data as CreateUserDto).applicationId;

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
