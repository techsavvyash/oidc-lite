import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TenantService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async findTenantElseCreate(
    accessTokenSigningKeysId: string,
    idTokenSigningKeysId: string,
    name?: string,
    data?: string,
  ) {
    if (accessTokenSigningKeysId && idTokenSigningKeysId) {
      const tenant = this.prismaService.tenant.findFirst({
        where: {
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
        },
      });
      if (tenant) {
        return {
          message: 'tenant with the provided keys found',
          tenant,
        };
      }
    }
    name = name ? name : randomUUID();
    const configurations = data ? data : 'Some default data if no given';
    accessTokenSigningKeysId = accessTokenSigningKeysId
      ? accessTokenSigningKeysId
      : randomUUID();
    idTokenSigningKeysId = idTokenSigningKeysId
      ? idTokenSigningKeysId
      : randomUUID();
    // find if keys exist for the given ids. else create keys using keysService

    try {
      const tenant = await this.prismaService.tenant.create({
        data: {
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
          name,
          data: configurations,
        },
      });
      this.logger.log('New tenant created!', tenant);
      return {
        message: 'New tenant created!',
        tenant,
      };
    } catch (error) {
      throw new HttpException(
        'Error creating a new tenant!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
