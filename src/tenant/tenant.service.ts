import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTenantDto } from 'src/dto/tenant.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TenantService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger();
  }

  async createATenant(id: string, data: CreateTenantDto) {}
  async updateATenant(id: string, data: CreateTenantDto) {}

  async deleteATenant(id: string) {
    const tenant = await this.prismaService.tenant.delete({ where: { id } });
    return {
      message: 'Tenant deleted successfully!',
      tenant,
    };
  }

  async returnATenant(id: string) {
    return await this.prismaService.tenant.findUnique({ where: { id } });
  }

  async returnAllTenants() {
    return await this.prismaService.tenant.findMany();
  }

  // search for a tenant with given ids else creates a new tenant with given ids
  async findTenantElseCreate(
    accessTokenSigningKeysId: string,
    idTokenSigningKeysId: string,
    tenantId?: string,
    name?: string,
    data?: string,
  ) {
    if (accessTokenSigningKeysId && idTokenSigningKeysId) {
      const tenant = await this.prismaService.tenant.findFirst({
        where: {
          accessTokenSigningKeysId,
          idTokenSigningKeysId,
        },
      });
      if (tenant) {
        if ((tenantId && tenant.id === tenantId) || !tenantId) {
          return {
            message: 'tenant with the provided keys/id found',
            tenant,
          };
        }
      }
    }
    // creating new tenant if any of the ids not matched in existing tenants
    name = name ? name : randomUUID();
    const configurations = data ? data : 'Some default data if no given';
    const tenant_id = tenantId ? tenantId : randomUUID();
    accessTokenSigningKeysId = accessTokenSigningKeysId
      ? accessTokenSigningKeysId
      : randomUUID();
    idTokenSigningKeysId = idTokenSigningKeysId
      ? idTokenSigningKeysId
      : randomUUID();
    // find if keys exist for the given ids. else create keys using keysService
    // will fail since can't create keys till now
    try {
      const tenant = await this.prismaService.tenant.create({
        data: {
          id: tenant_id,
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
      console.log('Error creating tenant', error);
      throw new HttpException(
        'Error creating a new tenant!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
