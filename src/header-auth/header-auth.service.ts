import { Injectable } from '@nestjs/common';
import { ResponseDto } from 'src/dto/response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Permissions } from 'src/api-keys/apiKey.dto';

@Injectable()
export class HeaderAuthService {
  constructor(private readonly prismaService: PrismaService) {}
  async authorizationHeaderVerifier(
    headers: object,
    tenantID: string,
    requestedUrl: string,
    requestedMethod: string,
  ): Promise<ResponseDto> {
    const token = headers['authorization'];
    if (!token) {
      return {
        success: false,
        message: 'authorization header required',
      };
    }
    const headerKey = await this.prismaService.authenticationKey.findUnique({
      where: {
        keyValue: token,
      },
    });
    if (!headerKey) {
      return {
        success: false,
        message: 'You are not authorized',
      };
    }
    const permissions: Permissions = JSON.parse(headerKey.permissions);
    let allowed = permissions ? false : true;
    if (permissions) {
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
        (headerKey.tenantsId === tenantID || headerKey.tenantsId === null); // allowed only if same tenantid or tenant scoped
    }

    if (!allowed) {
      return {
        success: false,
        message: 'Not authorized',
      };
    }
    return {
      success: true,
      message: 'Authorized',
      data: headerKey
    };
  }
}
