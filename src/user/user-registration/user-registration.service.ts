import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ResponseDto } from 'src/dto/response.dto';
import {
  CreateUserRegistrationDto,
  UpdateUserRegistrationDto,
} from 'src/dto/user.dto';
import { Permissions } from 'src/dto/apiKey.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRegistrationService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async authorizationHeaderVerifier(
    headers: object,
    tenantId: string,
    requestedUrl: string,
    requestedMethod: string,
  ) {
    if (!headers) {
      throw new BadRequestException({
        success: false,
        message: 'Headers missing',
      });
    }
    const token = headers['authorization'];
    if (!token) {
      throw new BadRequestException({
        message: 'Authorization header required',
      });
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are not authorized',
      });
    }
    const permissions: Permissions = JSON.parse(headerKey.permissions);
    let allowed = false;
    if (permissions.endpoints) {
      permissions.endpoints.forEach((val) => {
        allowed =
          (val.url === requestedUrl && val.methods === requestedMethod) ||
          allowed;
      });
    } else {
      allowed = true;
    }
    allowed =
      allowed &&
      (permissions.tenantId === tenantId || permissions.tenantId === null); // allowed only if tenant scoped or same tenantid
    if (!allowed) {
      throw new UnauthorizedException({
        success: false,
        message: 'You are unauthorized!',
      });
    }
    return true;
  }
  async createAUserRegistration(
    userId: string,
    data: CreateUserRegistrationDto,
    headers: object,
  ): Promise<ResponseDto> {}

  async returnAUserRegistration(
    userId: string,
    applicationId: string,
    headers: object,
  ): Promise<ResponseDto> {}

  async updateAUserRegistration(
    userId: string,
    applicationId: string,
    data: UpdateUserRegistrationDto,
    headers: object,
  ): Promise<ResponseDto> {}

  async deleteAUserRegistration(
    userId: string,
    applicationId: string,
    headers: object,
  ): Promise<ResponseDto> {}
}
