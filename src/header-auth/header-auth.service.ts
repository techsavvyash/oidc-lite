import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ResponseDto } from '../dto/response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyResponseDto, Permissions } from '../api-keys/apiKey.dto';

@Injectable()
export class HeaderAuthService {
  constructor(private readonly prismaService: PrismaService) {}

  /** Takes headers and check if the tenantID, requestedUrl and requestedMethods matches with the headerKey if available */
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
      data: headerKey,
    };
  }

  private async extractAuthorizationKeyFromHeader(
    headers: object,
  ): Promise<ApiKeyResponseDto> {
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
    delete headerKey.permissions;
    const data = { ...headerKey, permissions };
    return {
      success: true,
      message: 'Key extracted',
      data,
    };
  }

  async validateRoute(
    headers: object,
    requestedUrl: string,
    requestedMethod: string,
  ): Promise<ApiKeyResponseDto> {
    const valid = await this.extractAuthorizationKeyFromHeader(headers);
    if (!valid.success) {
      return {
        success: valid.success,
        message: valid.message,
      };
    }
    const { data } = valid;
    const permissions = data.permissions as Permissions;
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
      data,
    };
  }
}
